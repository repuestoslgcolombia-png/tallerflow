import { tool, jsonSchema } from 'ai'
import { db } from '@/lib/db'
import { createPendingAction } from './pending'

export const WRITE_ACTIONS = [
  'registroRapido',
  'crearCliente',
  'crearEquipo',
  'crearOrdenServicio',
  'actualizarEstadoOrden',
  'asignarTecnico',
  'crearRecordatorio',
  'crearCotizacion',
  'crearFactura',
  'registrarPago',
  'crearTareaDiaria',
] as const

const s = (schema: any) => jsonSchema(schema)

const optString = (description: string) => ({ type: 'string', description })
const enumString = (values: readonly string[], description: string) => ({ type: 'string', enum: [...values], description })
const bool = (description: string) => ({ type: 'boolean', description })

const dateRange = (fecha?: string) => {
  const day = fecha ? new Date(fecha) : new Date()
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(day)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// ============== HERRAMIENTAS DE LECTURA (ejecución inmediata) ==============

export const buscarClientes = tool({
  description:
    'Busca clientes por nombre, apellido, teléfono o documento. Úsalo antes de crear o asociar órdenes, para obtener el customerId.',
  inputSchema: s({
    type: 'object',
    properties: { query: optString('Texto a buscar (nombre, apellido, teléfono o documento)') },
    additionalProperties: false,
  }),
  execute: async ({ query }) => {
    const clients = await db.customer.findMany({
      where: query
        ? {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { phone: { contains: query } },
              { documentId: { contains: query } },
            ],
          }
        : {},
      include: { _count: { select: { devices: true, workOrders: true } } },
      take: 6,
      orderBy: { createdAt: 'desc' },
    })
    return clients.map((c) => ({
      id: c.id,
      nombre: `${c.firstName} ${c.lastName}`.trim(),
      telefono: c.phone || null,
      email: c.email || null,
      direccion: c.address || null,
      equipos: c._count.devices,
      ordenes: c._count.workOrders,
    }))
  },
})

export const buscarEquipos = tool({
  description:
    'Busca equipos/dispositivos (lavadoras, neveras, aires, TVs...) por marca, modelo o tipo, o por cliente. Devuelve deviceId para usarlos en órdenes.',
  inputSchema: s({
    type: 'object',
    properties: {
      query: optString('Texto a buscar (marca, modelo o tipo de equipo)'),
      customerId: optString('Filtrar por id de cliente'),
    },
    additionalProperties: false,
  }),
  execute: async ({ query, customerId }) => {
    const devices = await db.device.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(query
          ? { OR: [{ brand: { contains: query } }, { model: { contains: query } }, { type: { contains: query } }] }
          : {}),
      },
      include: { customer: { select: { firstName: true, lastName: true } } },
      take: 8,
      orderBy: { createdAt: 'desc' },
    })
    return devices.map((d) => ({
      id: d.id,
      tipo: d.type,
      marca: d.brand || null,
      modelo: d.model || null,
      serial: d.serial || null,
      cliente: `${d.customer.firstName} ${d.customer.lastName}`.trim(),
      customerId: d.customerId,
    }))
  },
})

export const buscarOrdenes = tool({
  description:
    'Busca órdenes de trabajo por código, cliente, estado o técnico. Devuelve el id y código de la orden.',
  inputSchema: s({
    type: 'object',
    properties: {
      query: optString('Texto a buscar (código OT-YYYY-NNN o nombre de cliente)'),
      status: optString('Filtrar por estado: received, diagnosing, quoted, approved, in_progress, ready, delivered, cancelled'),
      customerId: optString('Filtrar por id de cliente'),
    },
    additionalProperties: false,
  }),
  execute: async ({ query, status, customerId }) => {
    const orders = await db.workOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
        ...(query
          ? {
              OR: [
                { code: { contains: query } },
                { customer: { firstName: { contains: query } } },
                { customer: { lastName: { contains: query } } },
              ],
            }
          : {}),
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        device: { select: { type: true, brand: true, model: true } },
        technician: { select: { name: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    })
    return orders.map((o) => ({
      id: o.id,
      code: o.code,
      estado: o.status,
      prioridad: o.priority,
      cliente: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
      equipo: [o.device.type, o.device.brand, o.device.model].filter(Boolean).join(' '),
      tecnico: o.technician?.name || null,
      visitas: o.scheduledVisitAt ? o.scheduledVisitAt.toISOString() : null,
    }))
  },
})

export const verDetalleOrden = tool({
  description:
    'Devuelve el detalle completo de una orden de trabajo: cliente, equipo, técnico, diagnóstico, cotizaciones, factura y recordatorios. Úsalo para conocer el contexto de una orden antes de proponer acciones.',
  inputSchema: s({
    type: 'object',
    properties: { query: optString('Código de la orden (ej: OT-2026-005) o su id') },
    required: ['query'],
    additionalProperties: false,
  }),
  execute: async ({ query }) => {
    const wo = await db.workOrder.findFirst({
      where: { OR: [{ code: { equals: query } }, { id: { equals: query } }] },
      include: {
        customer: true,
        device: true,
        technician: { select: { name: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
        quotes: { include: { items: true }, orderBy: { createdAt: 'desc' } },
        invoice: { include: { items: true } },
        reminders: { orderBy: { dueDate: 'asc' } },
        diagnosis: true,
      },
    })
    if (!wo) return { error: 'Orden no encontrada' }
    return {
      id: wo.id,
      code: wo.code,
      estado: wo.status,
      prioridad: wo.priority,
      servicio: wo.serviceType,
      problemaReportado: wo.reportedIssue,
      diagnostico: wo.diagnosisText || null,
      total: wo.totalAmount,
      pagado: wo.totalPaid,
      recibida: wo.receivedAt.toISOString(),
      visita: wo.scheduledVisitAt ? wo.scheduledVisitAt.toISOString() : null,
      cliente: {
        id: wo.customer.id,
        nombre: `${wo.customer.firstName} ${wo.customer.lastName}`.trim(),
        telefono: wo.customer.phone,
        direccion: wo.customer.address,
      },
      equipo: {
        id: wo.device.id,
        tipo: wo.device.type,
        marca: wo.device.brand,
        modelo: wo.device.model,
        serial: wo.device.serial,
      },
      tecnico: wo.technician?.name || null,
      timeline: wo.timeline.map((t) => ({
        titulo: t.title,
        descripcion: t.description,
        fecha: t.createdAt.toISOString(),
      })),
      cotizaciones: wo.quotes.map((q) => ({
        id: q.id,
        code: q.code,
        estado: q.status,
        total: q.total,
        items: q.items.map((i) => ({
          descripcion: i.description,
          cantidad: i.quantity,
          precioUnitario: i.unitPrice,
          total: i.total,
        })),
      })),
      factura: wo.invoice
        ? {
            id: wo.invoice.id,
            code: wo.invoice.code,
            estado: wo.invoice.status,
            total: wo.invoice.total,
            pagado: wo.invoice.paid,
          }
        : null,
      recordatorios: wo.reminders.map((r) => ({
        id: r.id,
        titulo: r.title,
        fecha: r.dueDate.toISOString(),
        estado: r.status,
      })),
    }
  },
})

export const verDetalleCliente = tool({
  description:
    'Devuelve la información de un cliente: datos de contacto, equipos registrados y órdenes de trabajo.',
  inputSchema: s({
    type: 'object',
    properties: { query: optString('Nombre, teléfono o id del cliente') },
    required: ['query'],
    additionalProperties: false,
  }),
  execute: async ({ query }) => {
    const c = await db.customer.findFirst({
      where: {
        OR: [
          { id: { equals: query } },
          { phone: { contains: query } },
          { firstName: { contains: query } },
          { lastName: { contains: query } },
        ],
      },
      include: {
        devices: { orderBy: { createdAt: 'desc' } },
        workOrders: { orderBy: { createdAt: 'desc' }, take: 10 },
        reminders: { orderBy: { dueDate: 'asc' }, take: 5 },
      },
    })
    if (!c) return { error: 'Cliente no encontrado' }
    return {
      id: c.id,
      nombre: `${c.firstName} ${c.lastName}`.trim(),
      telefono: c.phone,
      email: c.email,
      direccion: c.address,
      notas: c.notes,
      equipos: c.devices.map((d) => ({
        id: d.id,
        tipo: d.type,
        marca: d.brand,
        modelo: d.model,
        serial: d.serial,
      })),
      ordenes: c.workOrders.map((o) => ({
        id: o.id,
        code: o.code,
        estado: o.status,
        problema: o.reportedIssue,
        fecha: o.createdAt.toISOString(),
      })),
      recordatorios: c.reminders.map((r) => ({ id: r.id, titulo: r.title, fecha: r.dueDate.toISOString(), estado: r.status })),
    }
  },
})

export const listarTecnicos = tool({
  description: 'Lista los técnicos activos del taller con su id y nombre. Úsalo para asignar técnicos a órdenes.',
  inputSchema: s({ type: 'object', properties: {}, additionalProperties: false }),
  execute: async () => {
    const users = await db.user.findMany({
      where: { role: 'technician', active: true },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    })
    return users.map((u) => ({ id: u.id, nombre: u.name, telefono: u.phone || null }))
  },
})

export const buscarRepuestos = tool({
  description:
    'Busca repuestos en el inventario por nombre, sku o marca. Úsalo para verificar disponibilidad y obtener el id/stock/precio antes de cotizar.',
  inputSchema: s({
    type: 'object',
    properties: {
      query: optString('Texto a buscar (nombre, sku o marca)'),
      lowStockOnly: bool('Solo repuestos con stock bajo (<= stock mínimo)'),
    },
    additionalProperties: false,
  }),
  execute: async ({ query, lowStockOnly }) => {
    let parts
    if (lowStockOnly) {
      parts = await db.$queryRaw<
        Array<{ id: string; sku: string; name: string; stock: number; minstock: number; unitprice: number }>
      >`SELECT id, sku, name, stock, "minStock" as minstock, "unitPrice" as unitprice FROM "Part" WHERE active = true AND stock <= "minStock" ORDER BY stock ASC LIMIT 12`
    } else {
      const found = await db.part.findMany({
        where: query
          ? { OR: [{ name: { contains: query } }, { sku: { contains: query } }, { brand: { contains: query } }] }
          : {},
        take: 10,
        orderBy: { name: 'asc' },
      })
      parts = found.map((p) => ({ id: p.id, sku: p.sku, name: p.name, stock: p.stock, minstock: p.minStock, unitprice: p.unitPrice }))
    }
    return parts.map((p) => ({
      id: p.id,
      sku: p.sku,
      nombre: p.name,
      stock: p.stock,
      stockMinimo: p.minstock,
      precio: p.unitprice,
    }))
  },
})

export const buscarCotizaciones = tool({
  description: 'Busca cotizaciones por estado, orden de trabajo o texto. Devuelve id, código y total.',
  inputSchema: s({
    type: 'object',
    properties: {
      query: optString('Texto a buscar (código COT-YYYY-NNN o cliente)'),
      workOrderId: optString('Filtrar por id de orden'),
      status: enumString(['draft', 'sent', 'approved', 'rejected', 'expired'], 'Filtrar por estado de la cotización'),
    },
    additionalProperties: false,
  }),
  execute: async ({ query, workOrderId, status }) => {
    const quotes = await db.quote.findMany({
      where: {
        ...(workOrderId ? { workOrderId } : {}),
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                { code: { contains: query } },
                { workOrder: { customer: { firstName: { contains: query } } } },
                { workOrder: { customer: { lastName: { contains: query } } } },
              ],
            }
          : {}),
      },
      include: {
        workOrder: {
          select: { code: true, customer: { select: { firstName: true, lastName: true } } },
        },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    })
    return quotes.map((q) => ({
      id: q.id,
      code: q.code,
      estado: q.status,
      total: q.total,
      orden: q.workOrder.code,
      cliente: `${q.workOrder.customer.firstName} ${q.workOrder.customer.lastName}`.trim(),
    }))
  },
})

export const buscarFacturas = tool({
  description: 'Busca facturas por estado, cliente o texto. Devuelve id, código, total, pagado y saldo.',
  inputSchema: s({
    type: 'object',
    properties: {
      query: optString('Texto a buscar (código FAC-YYYY-NNN o cliente)'),
      status: enumString(['pending', 'paid', 'partial', 'cancelled'], 'Filtrar por estado de la factura'),
    },
    additionalProperties: false,
  }),
  execute: async ({ query, status }) => {
    const invoices = await db.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(query
          ? {
              OR: [
                { code: { contains: query } },
                { customer: { firstName: { contains: query } } },
                { customer: { lastName: { contains: query } } },
              ],
            }
          : {}),
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        workOrder: { select: { code: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    })
    return invoices.map((i) => ({
      id: i.id,
      code: i.code,
      estado: i.status,
      total: i.total,
      pagado: i.paid,
      saldo: i.total - i.paid,
      cliente: `${i.customer.firstName} ${i.customer.lastName}`.trim(),
      orden: i.workOrder.code,
    }))
  },
})

export const buscarRecordatorios = tool({
  description:
    'Busca recordatorios por título, cliente, estado o vencimiento. Devuelve id, fecha y estado.',
  inputSchema: s({
    type: 'object',
    properties: {
      query: optString('Texto a buscar (título o cliente)'),
      status: enumString(['pending', 'sent', 'done', 'snoozed', 'cancelled'], 'Filtrar por estado del recordatorio'),
      dueToday: bool('Solo recordatorios que vencen hoy'),
    },
    additionalProperties: false,
  }),
  execute: async ({ query, status, dueToday }) => {
    const range = dateRange()
    const reminders = await db.reminder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(dueToday ? { dueDate: { gte: range.start, lte: range.end } } : {}),
        ...(query
          ? {
              OR: [
                { title: { contains: query } },
                { customer: { firstName: { contains: query } } },
                { customer: { lastName: { contains: query } } },
              ],
            }
          : {}),
      },
      include: { customer: { select: { firstName: true, lastName: true } } },
      take: 8,
      orderBy: { dueDate: 'asc' },
    })
    return reminders.map((r) => ({
      id: r.id,
      titulo: r.title,
      cliente: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
      fecha: r.dueDate.toISOString(),
      estado: r.status,
      tipo: r.type,
    }))
  },
})

export const agendaDelDia = tool({
  description:
    'Devuelve la agenda del día: visitas técnicas programadas (órdenes con hora de visita), tareas diarias pendientes y recordatorios que vencen hoy.',
  inputSchema: s({
    type: 'object',
    properties: { fecha: optString('Fecha en formato YYYY-MM-DD. Si no se da, hoy') },
    additionalProperties: false,
  }),
  execute: async ({ fecha }) => {
    const { start, end } = dateRange(fecha)
    const [visitas, tareas, recordatorios] = await Promise.all([
      db.workOrder.findMany({
        where: { scheduledVisitAt: { gte: start, lte: end } },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          device: { select: { type: true, brand: true, model: true } },
        },
        orderBy: { scheduledVisitAt: 'asc' },
      }),
      db.dailyTask.findMany({
        where: { taskDate: { gte: start, lte: end } },
        include: { assignee: { select: { name: true } } },
        orderBy: { sortOrder: 'asc' },
      }),
      db.reminder.findMany({
        where: { dueDate: { gte: start, lte: end }, status: { notIn: ['done', 'cancelled'] } },
        include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
        orderBy: { dueDate: 'asc' },
      }),
    ])
    return {
      fecha: start.toLocaleDateString('es-CO'),
      visitas: visitas.map((v) => ({
        hora: v.scheduledVisitAt?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        code: v.code,
        estado: v.status,
        cliente: `${v.customer.firstName} ${v.customer.lastName}`.trim(),
        telefono: v.customer.phone,
        equipo: [v.device.type, v.device.brand, v.device.model].filter(Boolean).join(' '),
      })),
      tareas: tareas.map((t) => ({
        id: t.id,
        titulo: t.title,
        completada: t.isCompleted,
        prioridad: t.priority,
        asignado: t.assignee?.name || null,
      })),
      recordatorios: recordatorios.map((r) => ({
        id: r.id,
        titulo: r.title,
        cliente: `${r.customer.firstName} ${r.customer.lastName}`.trim(),
        telefono: r.customer.phone,
        tipo: r.type,
      })),
    }
  },
})

export const estadoDelTaller = tool({
  description:
    'Devuelve el estado general del taller: órdenes por estado, órdenes del día, repuestos con stock bajo, facturas por cobrar y cotizaciones pendientes.',
  inputSchema: s({ type: 'object', properties: {}, additionalProperties: false }),
  execute: async () => {
    const { start, end } = dateRange()
    const [grouped, ordenesHoy, lowStock, facturas, cotizaciones, recordatoriosHoy] = await Promise.all([
      db.workOrder.groupBy({ by: ['status'], _count: { _all: true } }),
      db.workOrder.count({ where: { scheduledVisitAt: { gte: start, lte: end } } }),
      db.$queryRaw<Array<{ id: string; sku: string; name: string; stock: number; minstock: number }>>`SELECT id, sku, name, stock, "minStock" as minstock FROM "Part" WHERE active = true AND stock <= "minStock" ORDER BY stock ASC LIMIT 10`,
      db.invoice.findMany({ where: { status: { in: ['pending', 'partial'] } }, select: { code: true, total: true, paid: true } }),
      db.quote.findMany({ where: { status: { in: ['draft', 'sent'] } }, select: { code: true, status: true, total: true } }),
      db.reminder.count({ where: { dueDate: { gte: start, lte: end }, status: { notIn: ['done', 'cancelled'] } } }),
    ])

    const statusLabels: Record<string, string> = {
      received: 'Recibidas',
      diagnosing: 'En diagnóstico',
      quoted: 'Cotizadas',
      approved: 'Aprobadas',
      in_progress: 'En reparación',
      ready: 'Listas',
      delivered: 'Entregadas',
      cancelled: 'Canceladas',
    }

    return {
      ordenesPorEstado: grouped.map((g) => ({ estado: g.status, label: statusLabels[g.status] || g.status, cantidad: g._count._all })),
      ordenesHoy,
      repuestosBajos: lowStock.map((p) => ({ id: p.id, sku: p.sku, nombre: p.name, stock: p.stock, stockMinimo: p.minstock })),
      porCobrar: facturas.map((i) => ({ code: i.code, total: i.total, pagado: i.paid, saldo: i.total - i.paid })),
      totalPorCobrar: facturas.reduce((sum, i) => sum + (i.total - i.paid), 0),
      cotizacionesPendientes: cotizaciones.map((c) => ({ code: c.code, estado: c.status, total: c.total })),
      recordatoriosHoy,
    }
  },
})

// ============== HERRAMIENTA DE ESCRITURA (siempre requiere confirmación) ==============

export const proponerAccion = tool({
  description:
    'Herramienta para PROPONER cualquier acción de escritura (crear, actualizar, registrar o pagar). NUNCA la ejecuta: solo la registra para que el usuario la confirme. Reglas: (1) Primero usa las herramientas de lectura para resolver ids (customerId, deviceId, technicianId, workOrderId, invoiceId). (2) Llama esta herramienta con la acción deseada, un resumen claro y los datos completos. (3) Después de llamarla, escribe al usuario el resumen de lo que se propone y pide su confirmación.',
  inputSchema: s({
    type: 'object',
    properties: {
      action: enumString(
        WRITE_ACTIONS,
        'Acción a ejecutar: registroRapido (nuevo cliente+equipo+orden+recordatorio), crearCliente, crearEquipo, crearOrdenServicio (orden para cliente/equipo existente), actualizarEstadoOrden, asignarTecnico, crearRecordatorio, crearCotizacion, crearFactura, registrarPago, crearTareaDiaria'
      ),
      entity: optString('Entidad afectada en singular: Cliente, Equipo, Orden de trabajo, Recordatorio, Cotización, Factura, Tarea diaria'),
      resumen: optString('Resumen breve y claro de la acción propuesta para que el usuario la confirme (máx 2 líneas)'),
      data: {
        type: 'object',
        description:
          'Datos de la acción con los ids ya resueltos. Consulta la doc de cada acción: registroRapido requiere firstName, lastName, phone, address, deviceType, reportedIssue (+ deviceBrand, deviceModel, serviceType, priority, visitDate, visitTime opcionales). crearCliente: firstName, lastName (+ phone, email, address, documentId). crearEquipo: customerId/customerPhone/customerName, type, brand, model. crearOrdenServicio: customerId/customerPhone/customerName, deviceId/deviceDescription, reportedIssue (+ serviceType, priority, scheduledVisitAt, technicianId). actualizarEstadoOrden: workOrderId/workOrderCode, status. asignarTecnico: workOrderId/workOrderCode, technicianId/technicianName. crearRecordatorio: customerId/customerPhone/customerName, type (follow_up, warranty_check, service_review, maintenance, custom), title, message, dueDate o daysAfter. crearCotizacion: workOrderId/workOrderCode, items [{itemType part|labor|other, description, quantity, unitPrice, partId?}], sendImmediately. crearFactura: workOrderId/workOrderCode, items?, paymentMethod. registrarPago: invoiceId/invoiceCode/workOrderId, amount, paymentMethod. crearTareaDiaria: title, description, taskDate, priority.',
        additionalProperties: true,
      },
    },
    required: ['action', 'entity', 'resumen', 'data'],
    additionalProperties: false,
  }),
  execute: async ({ action, entity, resumen, data }) => {
    const pa = await createPendingAction({ action, entity, resumen, args: data })
    return {
      pendingId: pa.id,
      action: pa.action,
      entity: pa.entity,
      resumen: pa.resumen,
    }
  },
})

export const assistantTools = {
  buscarClientes,
  buscarEquipos,
  buscarOrdenes,
  verDetalleOrden,
  verDetalleCliente,
  listarTecnicos,
  buscarRepuestos,
  buscarCotizaciones,
  buscarFacturas,
  buscarRecordatorios,
  agendaDelDia,
  estadoDelTaller,
}
