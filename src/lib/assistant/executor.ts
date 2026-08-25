import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { logQuoteEvent } from '@/lib/quotes/history'
import {
  WORK_ORDER_STATUS,
  DEVICE_TYPES,
  REMINDER_TYPES,
} from '@/lib/constants'

export type ExecResult = {
  ok: boolean
  message: string
  data: Record<string, unknown>
}

const VALID_STATUSES = Object.keys(WORK_ORDER_STATUS)
const VALID_DEVICE_TYPES = Object.keys(DEVICE_TYPES)
const VALID_REMINDER_TYPES = Object.keys(REMINDER_TYPES)

function normalizePhone(p: string): string {
  return p.replace(/[\s\-\(\)]/g, '')
}

function deviceLabel(d: { type: string; brand?: string | null; model?: string | null }): string {
  const tipo = (DEVICE_TYPES as Record<string, { label: string }>)[d.type]?.label || d.type
  return [tipo, d.brand, d.model].filter(Boolean).join(' ')
}

function customerName(c: { firstName: string; lastName: string }): string {
  return `${c.firstName} ${c.lastName}`.trim()
}

// ============== RESOLUCIÓN DE ENTIDADES ==============

async function resolveCustomer(args: Record<string, unknown>) {
  if (args.customerId) {
    return db.customer.findUnique({ where: { id: String(args.customerId) } })
  }
  if (args.customerPhone) {
    const p = normalizePhone(String(args.customerPhone))
    const exact = await db.customer.findFirst({ where: { phone: p } })
    if (exact) return exact
    return db.customer.findFirst({ where: { phone: { contains: p } } })
  }
  if (args.customerName) {
    const name = String(args.customerName).trim()
    const parts = name.split(/\s+/)
    return db.customer.findFirst({
      where: {
        OR: [
          { firstName: { contains: name } },
          { lastName: { contains: name } },
          ...(parts.length > 1
            ? [{ firstName: { contains: parts[0] }, lastName: { contains: parts.slice(1).join(' ') } }]
            : []),
        ],
      },
    })
  }
  return null
}

async function resolveDevice(args: Record<string, unknown>, customerId?: string) {
  if (args.deviceId) {
    return db.device.findUnique({
      where: { id: String(args.deviceId) },
      include: { customer: true },
    })
  }
  if (customerId) {
    const byCustomer = await db.device.findFirst({
      where: { customerId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    })
    if (byCustomer) return byCustomer
  }
  if (args.deviceDescription) {
    const q = String(args.deviceDescription)
    const byMatch = await db.device.findFirst({
      where: {
        ...(customerId ? { customerId } : {}),
        OR: [
          { brand: { contains: q } },
          { model: { contains: q } },
          { type: { contains: q } },
        ],
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    })
    if (byMatch) return byMatch
  }
  return null
}

async function resolveTechnician(args: Record<string, unknown>) {
  if (args.technicianId) {
    return db.user.findUnique({ where: { id: String(args.technicianId) } })
  }
  if (args.technicianName) {
    return db.user.findFirst({
      where: { name: { contains: String(args.technicianName) }, active: true },
    })
  }
  return null
}

async function resolveWorkOrder(args: Record<string, unknown>) {
  if (args.workOrderId) {
    return db.workOrder.findUnique({ where: { id: String(args.workOrderId) } })
  }
  const code = args.workOrderCode || args.code
  if (code) {
    return db.workOrder.findUnique({ where: { code: String(code) } })
  }
  return null
}

// ============== EJECUTOR ==============

export async function executeAction(action: string, args: Record<string, unknown>): Promise<ExecResult> {
  switch (action) {
    case 'registroRapido':
      return executeRegistroRapido(args)
    case 'crearCliente':
      return executeCrearCliente(args)
    case 'crearEquipo':
      return executeCrearEquipo(args)
    case 'crearOrdenServicio':
      return executeCrearOrdenServicio(args)
    case 'actualizarEstadoOrden':
      return executeActualizarEstado(args)
    case 'asignarTecnico':
      return executeAsignarTecnico(args)
    case 'crearRecordatorio':
      return executeCrearRecordatorio(args)
    case 'crearCotizacion':
      return executeCrearCotizacion(args)
    case 'crearFactura':
      return executeCrearFactura(args)
    case 'registrarPago':
      return executeRegistrarPago(args)
    case 'crearTareaDiaria':
      return executeCrearTareaDiaria(args)
    default:
      throw new Error(`Acción desconocida: ${action}`)
  }
}

function requireFields(args: Record<string, unknown>, fields: string[]): void {
  const missing = fields.filter((f) => args[f] === undefined || args[f] === null || args[f] === '')
  if (missing.length) {
    throw new Error(`Faltan datos obligatorios: ${missing.join(', ')}`)
  }
}

async function executeRegistroRapido(args: Record<string, unknown>): Promise<ExecResult> {
  requireFields(args, ['firstName', 'lastName', 'phone', 'address', 'deviceType', 'reportedIssue'])

  const phone = normalizePhone(String(args.phone))
  if (phone.length < 7) throw new Error('El teléfono debe tener al menos 7 dígitos')
  const deviceType = String(args.deviceType)
  if (!VALID_DEVICE_TYPES.includes(deviceType)) {
    throw new Error(
      `Tipo de equipo inválido: "${deviceType}". Válidos: ${VALID_DEVICE_TYPES.join(', ')}`
    )
  }

  const year = new Date().getFullYear()
  let scheduledVisitAt: Date | null = null
  if (args.visitDate && args.visitTime) {
    const [hours, minutes] = String(args.visitTime).split(':').map(Number)
    scheduledVisitAt = new Date(String(args.visitDate))
    scheduledVisitAt.setHours(hours, minutes, 0, 0)
  } else if (args.scheduledVisitAt) {
    scheduledVisitAt = new Date(String(args.scheduledVisitAt))
  }

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.workshopSetting.update({
      where: { id: 'default' },
      data: { counterWorkOrder: { increment: 1 } },
    })
    const code = `OT-${year}-${String(updated.counterWorkOrder).padStart(3, '0')}`

    let customer = await tx.customer.findFirst({ where: { phone } })
    if (!customer) {
      customer = await tx.customer.create({
        data: {
          firstName: String(args.firstName),
          lastName: String(args.lastName),
          documentId: args.documentId ? String(args.documentId) : null,
          phone,
          email: args.email ? String(args.email) : null,
          address: String(args.address),
          notes: args.notes ? String(args.notes) : null,
        },
      })
    }

    const device = await tx.device.create({
      data: {
        customerId: customer.id,
        type: deviceType,
        brand: args.deviceBrand ? String(args.deviceBrand) : null,
        model: args.deviceModel ? String(args.deviceModel) : null,
        serial: args.serial ? String(args.serial) : null,
        notes: args.deviceNotes ? String(args.deviceNotes) : null,
      },
    })

    const serviceType = String(args.serviceType || 'revision')
    const serviceLabel: Record<string, string> = {
      mantenimiento: 'Mantenimiento Preventivo',
      revision: 'Revisión',
      instalacion: 'Instalación',
    }

    const workOrder = await tx.workOrder.create({
      data: {
        code,
        customerId: customer.id,
        deviceId: device.id,
        serviceType,
        scheduledVisitAt,
        priority: String(args.priority || 'normal'),
        reportedIssue: String(args.reportedIssue),
        timeline: {
          create: {
            eventType: 'status_change',
            fromStatus: '',
            toStatus: 'received',
            title: `Registro rápido - ${serviceLabel[serviceType] || serviceType}`,
            description: `Cliente: ${customerName(customer)} | Equipo: ${deviceLabel(device)} | ${args.reportedIssue}`,
          },
        },
      },
      include: { customer: true, device: true },
    })

    await tx.auditLog.create({
      data: {
        action: 'create',
        entity: 'WorkOrder',
        entityId: workOrder.id,
        description: `Registro rápido (asistente) - ${code} - ${customerName(customer)}`,
      },
    })

    const followUp = new Date()
    followUp.setDate(followUp.getDate() + 7)
    const reminder = await tx.reminder.create({
      data: {
        customerId: customer.id,
        workOrderId: workOrder.id,
        type: 'follow_up',
        title: `Seguimiento - ${code}`,
        message: `Hola ${customer.firstName}, ¿cómo va el equipo ${deviceLabel(device)} que recibimos? Si tiene alguna duda, estamos para ayudarle.`,
        dueDate: followUp,
        channel: 'whatsapp',
        status: 'pending',
        priority: 'normal',
        daysAfter: 7,
      },
    })

    return { workOrder, customer, device, reminder }
  })

  return {
    ok: true,
    message: `Registrado ${customerName(result.customer)} con ${deviceLabel(result.device)}. Orden **${result.workOrder.code}** creada y recordatorio de seguimiento agendado a los 7 días.`,
    data: {
      workOrderId: result.workOrder.id,
      workOrderCode: result.workOrder.code,
      customerId: result.customer.id,
      customerName: customerName(result.customer),
      deviceId: result.device.id,
      deviceLabel: deviceLabel(result.device),
      reminderId: result.reminder.id,
    },
  }
}

async function executeCrearCliente(args: Record<string, unknown>): Promise<ExecResult> {
  requireFields(args, ['firstName', 'lastName'])
  const phone = args.phone ? normalizePhone(String(args.phone)) : null

  if (phone) {
    const existing = await db.customer.findFirst({ where: { phone } })
    if (existing) {
      return {
        ok: true,
        message: `El cliente **${customerName(existing)}** ya existe (teléfono ${existing.phone}). No creé un duplicado.`,
        data: { customerId: existing.id, customerName: customerName(existing), duplicated: true },
      }
    }
  }

  const customer = await db.customer.create({
    data: {
      firstName: String(args.firstName),
      lastName: String(args.lastName),
      documentId: args.documentId ? String(args.documentId) : null,
      phone,
      email: args.email ? String(args.email) : null,
      address: args.address ? String(args.address) : null,
      notes: args.notes ? String(args.notes) : null,
    },
  })

  return {
    ok: true,
    message: `Cliente **${customerName(customer)}** creado${phone ? ` (${phone})` : ''}.`,
    data: { customerId: customer.id, customerName: customerName(customer) },
  }
}

async function executeCrearEquipo(args: Record<string, unknown>): Promise<ExecResult> {
  const customer = await resolveCustomer(args)
  if (!customer) throw new Error('No encontré el cliente. Pásame un id, teléfono o nombre.')

  const deviceType = String(args.type || args.deviceType || 'other')
  if (!VALID_DEVICE_TYPES.includes(deviceType)) {
    throw new Error(`Tipo de equipo inválido: "${deviceType}". Válidos: ${VALID_DEVICE_TYPES.join(', ')}`)
  }

  const device = await db.device.create({
    data: {
      customerId: customer.id,
      type: deviceType,
      brand: args.brand ? String(args.brand) : null,
      model: args.model ? String(args.model) : null,
      serial: args.serial ? String(args.serial) : null,
      accessories: args.accessories ? String(args.accessories) : null,
      notes: args.notes ? String(args.notes) : null,
    },
  })

  return {
    ok: true,
    message: `Equipo **${deviceLabel(device)}** registrado a nombre de ${customerName(customer)}.`,
    data: { deviceId: device.id, deviceLabel: deviceLabel(device), customerId: customer.id },
  }
}

async function executeCrearOrdenServicio(args: Record<string, unknown>): Promise<ExecResult> {
  requireFields(args, ['reportedIssue'])

  const customer = await resolveCustomer(args)
  if (!customer) throw new Error('No encontré el cliente. Pásame un id, teléfono o nombre.')

  const device = await resolveDevice(args, customer.id)
  if (!device) throw new Error(`No encontré un equipo para ${customerName(customer)}. Describe el equipo o regístralo.`)

  const technician = await resolveTechnician(args)

  const year = new Date().getFullYear()
  let scheduledVisitAt: Date | null = null
  if (args.scheduledVisitAt) scheduledVisitAt = new Date(String(args.scheduledVisitAt))

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.workshopSetting.update({
      where: { id: 'default' },
      data: { counterWorkOrder: { increment: 1 } },
    })
    const code = `OT-${year}-${String(updated.counterWorkOrder).padStart(3, '0')}`

    const wo = await tx.workOrder.create({
      data: {
        code,
        customerId: customer.id,
        deviceId: device.id,
        technicianId: technician?.id || null,
        serviceType: String(args.serviceType || 'revision'),
        scheduledVisitAt,
        priority: String(args.priority || 'normal'),
        reportedIssue: String(args.reportedIssue),
        timeline: {
          create: {
            eventType: 'status_change',
            fromStatus: '',
            toStatus: 'received',
            title: 'Orden creada por el asistente',
            description: `Cliente: ${customerName(customer)} | Equipo: ${deviceLabel(device)} | ${args.reportedIssue}`,
          },
        },
      },
      include: { customer: true, device: true },
    })

    await tx.auditLog.create({
      data: {
        action: 'create',
        entity: 'WorkOrder',
        entityId: wo.id,
        description: `Orden creada por el asistente - ${code} - ${customerName(customer)}`,
      },
    })

    return wo
  })

  return {
    ok: true,
    message: `Orden **${result.code}** creada para ${customerName(customer)} (${deviceLabel(device)})${technician ? `, asignada a ${technician.name}` : ''}.`,
    data: {
      workOrderId: result.id,
      workOrderCode: result.code,
      customerId: customer.id,
      deviceId: device.id,
      deviceLabel: deviceLabel(device),
      technicianId: technician?.id || null,
    },
  }
}

async function executeActualizarEstado(args: Record<string, unknown>): Promise<ExecResult> {
  const wo = await resolveWorkOrder(args)
  if (!wo) throw new Error('No encontré la orden de trabajo. Pásame su código o id.')

  const status = String(args.status)
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Estado inválido: "${status}". Válidos: ${VALID_STATUSES.join(', ')}`)
  }
  if (wo.status === status) {
    return {
      ok: true,
      message: `La orden **${wo.code}** ya estaba en estado **${(WORK_ORDER_STATUS as Record<string, { label: string }>)[status].label}**.`,
      data: { workOrderId: wo.id, workOrderCode: wo.code, status },
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.workOrder.update({
      where: { id: wo.id },
      data: { status },
    })
    await tx.workOrderEvent.create({
      data: {
        workOrderId: wo.id,
        eventType: 'status_change',
        fromStatus: wo.status,
        toStatus: status,
        title: 'Cambio de estado por el asistente',
        description: `De ${(WORK_ORDER_STATUS as Record<string, { label: string }>)[wo.status].label} a ${(WORK_ORDER_STATUS as Record<string, { label: string }>)[status].label}`,
      },
    })
    await tx.auditLog.create({
      data: {
        action: 'status_change',
        entity: 'WorkOrder',
        entityId: wo.id,
        description: `Asistente: ${wo.code} ${wo.status} -> ${status}`,
      },
    })
    return u
  })

  return {
    ok: true,
    message: `Orden **${wo.code}** actualizada a **${(WORK_ORDER_STATUS as Record<string, { label: string }>)[status].label}**.`,
    data: { workOrderId: wo.id, workOrderCode: wo.code, from: wo.status, to: status },
  }
}

async function executeAsignarTecnico(args: Record<string, unknown>): Promise<ExecResult> {
  const wo = await resolveWorkOrder(args)
  if (!wo) throw new Error('No encontré la orden de trabajo. Pásame su código o id.')

  const technician = await resolveTechnician(args)
  if (!technician) throw new Error('No encontré el técnico. Pásame su id o nombre.')

  const updated = await db.$transaction(async (tx) => {
    const u = await tx.workOrder.update({
      where: { id: wo.id },
      data: { technicianId: technician.id },
    })
    await tx.workOrderEvent.create({
      data: {
        workOrderId: wo.id,
        eventType: 'assignment',
        title: 'Técnico asignado por el asistente',
        description: `Asignado a ${technician.name}`,
      },
    })
    await tx.auditLog.create({
      data: {
        action: 'update',
        entity: 'WorkOrder',
        entityId: wo.id,
        description: `Asistente: técnico ${technician.name} asignado a ${wo.code}`,
      },
    })
    return u
  })

  return {
    ok: true,
    message: `Técnico **${technician.name}** asignado a la orden **${wo.code}**.`,
    data: { workOrderId: wo.id, workOrderCode: wo.code, technicianId: technician.id, technicianName: technician.name },
  }
}

async function executeCrearRecordatorio(args: Record<string, unknown>): Promise<ExecResult> {
  const customer = await resolveCustomer(args)
  if (!customer) throw new Error('No encontré el cliente. Pásame un id, teléfono o nombre.')

  const type = String(args.type || 'follow_up')
  if (!VALID_REMINDER_TYPES.includes(type)) {
    throw new Error(`Tipo de recordatorio inválido: "${type}". Válidos: ${VALID_REMINDER_TYPES.join(', ')}`)
  }

  let dueDate: Date
  if (args.dueDate) {
    dueDate = new Date(String(args.dueDate))
  } else if (args.daysAfter !== undefined && args.daysAfter !== null) {
    dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + Number(args.daysAfter))
  } else {
    const days = (REMINDER_TYPES as Record<string, { defaultDays: number }>)[type]?.defaultDays ?? 7
    dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + days)
  }

  let workOrderId: string | null = null
  if (args.workOrderId || args.workOrderCode || args.code) {
    const wo = await resolveWorkOrder(args)
    workOrderId = wo?.id || null
  }

  const title = args.title ? String(args.title) : `${(REMINDER_TYPES as Record<string, { label: string }>)[type].label} - ${customerName(customer)}`

  const reminder = await db.reminder.create({
    data: {
      customerId: customer.id,
      workOrderId,
      type,
      title,
      message: args.message ? String(args.message) : null,
      dueDate,
      channel: String(args.channel || 'whatsapp'),
      status: 'pending',
      priority: String(args.priority || 'normal'),
      daysAfter: args.daysAfter !== undefined ? Number(args.daysAfter) : null,
    },
  })

  return {
    ok: true,
    message: `Recordatorio **${reminder.title}** creado para ${customerName(customer)} (vence ${dueDate.toLocaleDateString('es-CO')}).`,
    data: {
      reminderId: reminder.id,
      reminderTitle: reminder.title,
      customerId: customer.id,
      workOrderId,
      dueDate: dueDate.toISOString(),
    },
  }
}

async function executeCrearCotizacion(args: Record<string, unknown>): Promise<ExecResult> {
  const wo = await resolveWorkOrder(args)
  if (!wo) throw new Error('No encontré la orden de trabajo. Pásame su código o id.')

  if (!Array.isArray(args.items) || args.items.length === 0) {
    throw new Error('Debe incluir al menos un ítem (repuesto o mano de obra) para la cotización.')
  }

  const settings = await db.workshopSetting.findFirst({ where: { id: 'default' } })
  const taxRate = settings?.taxRate || 0
  let subtotal = 0
  const items = (args.items as any[]).map((it) => {
    const qty = Number(it.quantity) || 1
    const unit = Number(it.unitPrice) || 0
    const total = qty * unit
    subtotal += total
    return {
      itemType: String(it.itemType || 'other'),
      description: String(it.description || ''),
      quantity: qty,
      unitPrice: unit,
      total,
      partId: it.partId ? String(it.partId) : null,
    }
  })
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax
  const year = new Date().getFullYear()
  const sendImmediately = Boolean(args.sendImmediately)

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.workshopSetting.update({
      where: { id: 'default' },
      data: { counterQuote: { increment: 1 } },
    })
    const code = `COT-${year}-${String(updated.counterQuote).padStart(3, '0')}`

    const quote = await tx.quote.create({
      data: {
        workOrderId: wo.id,
        code,
        status: sendImmediately ? 'sent' : 'draft',
        approvalToken: randomUUID(),
        notes: args.notes ? String(args.notes) : null,
        validUntil: args.validUntil ? new Date(String(args.validUntil)) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        subtotal,
        tax,
        total,
        ...(sendImmediately ? { sentAt: new Date() } : {}),
        items: { create: items },
      },
    })

    await logQuoteEvent(tx, {
      quoteId: quote.id,
      eventType: 'created',
      toStatus: quote.status,
      description: `Cotización ${code} creada por el asistente para la orden ${wo.code}. Total: $${total.toFixed(0)}`,
    })

    if (sendImmediately) {
      await logQuoteEvent(tx, {
        quoteId: quote.id,
        eventType: 'sent',
        fromStatus: 'draft',
        toStatus: 'sent',
        description: `Cotización ${code} enviada al cliente`,
      })
      await tx.workOrder.update({
        where: { id: wo.id },
        data: { status: 'quoted' },
      })
      await tx.workOrderEvent.create({
        data: {
          workOrderId: wo.id,
          eventType: 'status_change',
          fromStatus: wo.status,
          toStatus: 'quoted',
          title: 'Cotización enviada',
          description: `Cotización ${code} enviada al cliente`,
        },
      })
    }

    await tx.auditLog.create({
      data: {
        action: 'create',
        entity: 'Quote',
        entityId: quote.id,
        description: `Cotización ${code} creada por el asistente para ${wo.code}`,
      },
    })

    return { quote, code }
  })

  return {
    ok: true,
    message: `Cotización **${result.code}** creada para la orden **${wo.code}** por $${total.toLocaleString('es-CO')}${sendImmediately ? ' y marcada como enviada' : ' (borrador)'}.`,
    data: {
      quoteId: result.quote.id,
      quoteCode: result.code,
      workOrderId: wo.id,
      total,
      status: sendImmediately ? 'sent' : 'draft',
    },
  }
}

async function executeCrearFactura(args: Record<string, unknown>): Promise<ExecResult> {
  const wo = await resolveWorkOrder(args)
  if (!wo) throw new Error('No encontré la orden de trabajo. Pásame su código o id.')

  const existing = await db.invoice.findUnique({ where: { workOrderId: wo.id } })
  if (existing) {
    return {
      ok: true,
      message: `La orden **${wo.code}** ya tiene la factura **${existing.code}**. No creé una duplicada.`,
      data: { invoiceId: existing.id, invoiceCode: existing.code, workOrderId: wo.id, duplicated: true },
    }
  }

  const settings = await db.workshopSetting.findFirst({ where: { id: 'default' } })
  const taxRate = settings?.taxRate || 0

  let itemsData: any[]
  if (Array.isArray(args.items) && args.items.length > 0) {
    itemsData = (args.items as any[]).map((it) => {
      const qty = Number(it.quantity) || 1
      const unit = Number(it.unitPrice) || 0
      return {
        itemType: String(it.itemType || 'other'),
        description: String(it.description || ''),
        quantity: qty,
        unitPrice: unit,
        total: qty * unit,
      }
    })
  } else {
    const approved = await db.quote.findFirst({
      where: { workOrderId: wo.id, status: 'approved' },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    if (approved?.items.length) {
      itemsData = approved.items.map((it) => ({
        itemType: it.itemType,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      }))
    } else {
      itemsData = [
        {
          itemType: 'other',
          description: `Servicio de reparación - ${wo.code}`,
          quantity: 1,
          unitPrice: wo.totalAmount || 0,
          total: wo.totalAmount || 0,
        },
      ]
    }
  }

  const subtotal = itemsData.reduce((sum, it) => sum + it.total, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax
  const year = new Date().getFullYear()

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.workshopSetting.update({
      where: { id: 'default' },
      data: { counterInvoice: { increment: 1 } },
    })
    const code = `FAC-${year}-${String(updated.counterInvoice).padStart(3, '0')}`

    const invoice = await tx.invoice.create({
      data: {
        code,
        workOrderId: wo.id,
        customerId: wo.customerId,
        subtotal,
        tax,
        total,
        paid: args.paid !== undefined ? Number(args.paid) : 0,
        paymentMethod: args.paymentMethod ? String(args.paymentMethod) : null,
        status: args.status ? String(args.status) : 'pending',
        notes: args.notes ? String(args.notes) : null,
        paidAt: args.paid !== undefined && Number(args.paid) >= total ? new Date() : null,
        items: { create: itemsData },
      },
    })

    await tx.workOrder.update({
      where: { id: wo.id },
      data: {
        totalAmount: total,
        totalPaid: args.paid !== undefined ? Number(args.paid) : 0,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'create',
        entity: 'Invoice',
        entityId: invoice.id,
        description: `Factura ${code} creada por el asistente para ${wo.code}`,
      },
    })

    return { invoice, code }
  })

  return {
    ok: true,
    message: `Factura **${result.code}** creada para la orden **${wo.code}** por $${total.toLocaleString('es-CO')}.`,
    data: {
      invoiceId: result.invoice.id,
      invoiceCode: result.code,
      workOrderId: wo.id,
      total,
      status: result.invoice.status,
    },
  }
}

async function executeRegistrarPago(args: Record<string, unknown>): Promise<ExecResult> {
  let invoice
  if (args.invoiceId || args.invoiceCode) {
    invoice = args.invoiceId
      ? await db.invoice.findUnique({ where: { id: String(args.invoiceId) } })
      : await db.invoice.findUnique({ where: { code: String(args.invoiceCode) } })
  } else {
    const wo = await resolveWorkOrder(args)
    invoice = wo ? await db.invoice.findUnique({ where: { workOrderId: wo.id } }) : null
  }
  if (!invoice) throw new Error('No encontré la factura asociada a la orden. Pásame el código de factura o de orden.')

  const amount = Number(args.amount)
  if (!amount || amount <= 0) throw new Error('El monto del pago debe ser mayor que 0.')

  const newPaid = Math.min(invoice.total, (invoice.paid || 0) + amount)
  const status = newPaid >= invoice.total ? 'paid' : 'partial'

  const result = await db.$transaction(async (tx) => {
    const inv = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paid: newPaid,
        status,
        paymentMethod: args.paymentMethod ? String(args.paymentMethod) : invoice.paymentMethod,
        paidAt: status === 'paid' ? new Date() : invoice.paidAt,
      },
    })
    await tx.workOrder.update({
      where: { id: invoice.workOrderId },
      data: { totalPaid: newPaid },
    })
    await tx.auditLog.create({
      data: {
        action: 'update',
        entity: 'Invoice',
        entityId: invoice.id,
        description: `Asistente: pago de $${amount.toLocaleString('es-CO')} registrado en ${invoice.code}`,
      },
    })
    return inv
  })

  const saldo = (result.total - newPaid).toLocaleString('es-CO')
  return {
    ok: true,
    message: `Pago de $${amount.toLocaleString('es-CO')} registrado en **${invoice.code}**. Estado: ${status === 'paid' ? 'Pagada ✅' : `Pago parcial, saldo $${saldo}`}.`,
    data: {
      invoiceId: invoice.id,
      invoiceCode: invoice.code,
      workOrderId: invoice.workOrderId,
      paid: newPaid,
      total: result.total,
      status,
    },
  }
}

async function executeCrearTareaDiaria(args: Record<string, unknown>): Promise<ExecResult> {
  requireFields(args, ['title'])

  let taskDate = new Date()
  taskDate.setHours(0, 0, 0, 0)
  if (args.taskDate) {
    const d = new Date(String(args.taskDate))
    if (!isNaN(d.getTime())) {
      taskDate = d
      taskDate.setHours(0, 0, 0, 0)
    }
  }

  let assigneeId: string | null = null
  if (args.assigneeId || args.assigneeName) {
    const t = await resolveTechnician(args)
    assigneeId = t?.id || null
  }

  const task = await db.dailyTask.create({
    data: {
      title: String(args.title),
      description: args.description ? String(args.description) : null,
      assigneeId,
      taskDate,
      priority: String(args.priority || 'normal'),
      isRecurring: Boolean(args.isRecurring),
      recurringRule: args.recurringRule ? String(args.recurringRule) : null,
      sortOrder: Number(args.sortOrder) || 0,
    },
  })

  return {
    ok: true,
    message: `Tarea diaria **${task.title}** creada para el ${taskDate.toLocaleDateString('es-CO')}.`,
    data: { taskId: task.id, taskTitle: task.title, taskDate: taskDate.toISOString() },
  }
}
