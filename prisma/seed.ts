import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

async function main() {
  console.log('🌱 Iniciando seed de TallerFlow...')

  // Limpiar datos existentes
  await db.auditLog.deleteMany()
  await db.inventoryMovement.deleteMany()
  await db.quoteItem.deleteMany()
  await db.quote.deleteMany()
  await db.invoice.deleteMany()
  await db.diagnosis.deleteMany()
  await db.workOrderEvent.deleteMany()
  await db.workOrder.deleteMany()
  await db.device.deleteMany()
  await db.part.deleteMany()
  await db.customer.deleteMany()
  await db.user.deleteMany()
  await db.workshopSetting.deleteMany()

  // ============== CONFIGURACIÓN DEL TALLER ==============
  await db.workshopSetting.create({
    data: {
      id: 'default',
      name: 'TallerTech Pro',
      phone: '+57 300 123 4567',
      email: 'contacto@tallertechpro.com',
      address: 'Calle 45 #23-18, Bogotá, Colombia',
      taxRate: 19,
      currency: 'COP',
      currencySymbol: '$',
      counterWorkOrder: 12,
      counterQuote: 8,
      counterInvoice: 5,
    },
  })

  // ============== USUARIOS ==============
  const admin = await db.user.create({
    data: {
      email: 'admin@tallertechpro.com',
      name: 'Carlos Mendoza',
      role: 'admin',
      phone: '+57 300 111 1111',
    },
  })

  const tech1 = await db.user.create({
    data: {
      email: 'javier@tallertechpro.com',
      name: 'Javier Ramírez',
      role: 'technician',
      phone: '+57 300 222 2222',
    },
  })

  const tech2 = await db.user.create({
    data: {
      email: 'laura@tallertechpro.com',
      name: 'Laura Gómez',
      role: 'technician',
      phone: '+57 300 333 3333',
    },
  })

  const receptionist = await db.user.create({
    data: {
      email: 'maria@tallertechpro.com',
      name: 'María Fernández',
      role: 'receptionist',
      phone: '+57 300 444 4444',
    },
  })

  // ============== CLIENTES ==============
  const customers = await Promise.all([
    db.customer.create({
      data: {
        firstName: 'Andrés',
        lastName: 'Quintero',
        documentId: '1018456327',
        phone: '+57 311 555 0001',
        email: 'andres.quintero@email.com',
        address: 'Cra 7 #80-25, Bogotá',
        notes: 'Cliente frecuente, trabaja desde casa.',
      },
    }),
    db.customer.create({
      data: {
        firstName: 'Valentina',
        lastName: 'Rojas',
        documentId: '1020998431',
        phone: '+57 311 555 0002',
        email: 'valen.rojas@email.com',
        address: 'Calle 100 #15-40, Bogotá',
      },
    }),
    db.customer.create({
      data: {
        firstName: 'Roberto',
        lastName: 'Salazar',
        documentId: '79543210',
        phone: '+57 311 555 0003',
        email: 'rsalazar@email.com',
        address: 'Av. Caracas #14-09, Bogotá',
        notes: 'Pequeña empresa - requiere factura.',
      },
    }),
    db.customer.create({
      data: {
        firstName: 'Daniela',
        lastName: 'Morales',
        documentId: '1031778855',
        phone: '+57 311 555 0004',
        email: 'daniela.m@email.com',
      },
    }),
    db.customer.create({
      data: {
        firstName: 'Esteban',
        lastName: 'Cárdenas',
        documentId: '1019988776',
        phone: '+57 311 555 0005',
        email: 'esteban.c@email.com',
      },
    }),
    db.customer.create({
      data: {
        firstName: 'Camila',
        lastName: 'Ortega',
        documentId: '1040556677',
        phone: '+57 311 555 0006',
        email: 'camila.ortega@email.com',
      },
    }),
  ])

  // ============== EQUIPOS ==============
  const devices = await Promise.all([
    db.device.create({
      data: {
        customerId: customers[0].id,
        type: 'washing_machine',
        brand: 'LG',
        model: 'WM14T60H0N',
        serial: 'LGWM14T60H0N01',
        accessories: 'Manguera de entrada, manguera de desagüe, manual',
        notes: 'Lavadora de carga frontal, 14 kg.',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[1].id,
        type: 'refrigerator',
        brand: 'Samsung',
        model: 'RT46K6635BS',
        serial: 'SAMRT46K663501',
        accessories: 'Repisas de vidrio, cajones, manual',
        notes: 'Nevera dos puertas, 460L, Frost Free.',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[2].id,
        type: 'air_conditioner',
        brand: 'Midea',
        model: 'MSABAU-12HRDN1',
        serial: 'MDMSABAU12HR01',
        notes: 'Aire acondicionado split 12.000 BTU, inverter.',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[3].id,
        type: 'gas_dryer',
        brand: 'Whirlpool',
        model: 'WGD5000DW',
        serial: 'WHLWGD5000DW01',
        accessories: 'Tubo de escape, kit de montaje',
        notes: 'Secadora a gas de 7 cu ft.',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[4].id,
        type: 'tv',
        brand: 'Sony',
        model: 'Bravia KD-55X80J',
        serial: 'SNYKD55X80J001',
        accessories: 'Control remoto, cable de alimentación, soporte',
        notes: 'TV LED 55" 4K Smart TV.',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[5].id,
        type: 'freezer',
        brand: 'Haceb',
        model: 'CHF362GIB',
        serial: 'HCBCHF362GIB01',
        accessories: 'Cestas, manual',
        notes: 'Congelador horizontal de 362L.',
      },
    }),
  ])

  // ============== REPUESTOS / INVENTARIO ==============
  const parts = await Promise.all([
    db.part.create({
      data: {
        sku: 'BMB-LAV-LG01',
        name: 'Bomba de agua para lavadora LG',
        description: 'Bomba de desagüe universal lavadoras LG 14kg',
        category: 'Lavadoras',
        stock: 6,
        minStock: 3,
        unitCost: 45000,
        unitPrice: 85000,
        location: 'Estante A-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'CINT-LAV-UNI',
        name: 'Kit correas lavadora (universal)',
        description: 'Set de 3 correas universales para lavadora automática',
        category: 'Lavadoras',
        stock: 12,
        minStock: 4,
        unitCost: 18000,
        unitPrice: 42000,
        location: 'Estante A-2',
      },
    }),
    db.part.create({
      data: {
        sku: 'TERM-NEV-SAM',
        name: 'Termostato nevera Samsung',
        description: 'Termostato digital para neveras Samsung RT46',
        category: 'Neveras',
        stock: 4,
        minStock: 2,
        unitCost: 55000,
        unitPrice: 110000,
        location: 'Estante B-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'COMP-NEV-12',
        name: 'Compresor nevera 1/4 HP',
        description: 'Compresor refrigerante 1/4 HP universal R134a',
        category: 'Neveras',
        stock: 2,
        minStock: 2,
        unitCost: 280000,
        unitPrice: 450000,
        location: 'Estante B-2',
      },
    }),
    db.part.create({
      data: {
        sku: 'CAP-AC-MIDEA',
        name: 'Capacitor AC Midea 35µF',
        description: 'Capacitor de arranque 35µF 450V para split Midea',
        category: 'Aires acondicionados',
        stock: 8,
        minStock: 3,
        unitCost: 22000,
        unitPrice: 55000,
        location: 'Estante C-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'MOT-AC-12K',
        name: 'Motor ventilador AC 12.000 BTU',
        description: 'Motor de ventilador interior para split 12K',
        category: 'Aires acondicionados',
        stock: 3,
        minStock: 2,
        unitCost: 95000,
        unitPrice: 165000,
        location: 'Estante C-2',
      },
    }),
    db.part.create({
      data: {
        sku: 'VAL-SEC-GAS',
        name: 'Válvula de gas secadora Whirlpool',
        description: 'Válvula solenoide de gas para secadora WGD5000',
        category: 'Secadoras a gas',
        stock: 2,
        minStock: 2,
        unitCost: 75000,
        unitPrice: 135000,
        location: 'Estante D-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'ENC-SEC-GAS',
        name: 'Encendedor piloto secadora',
        description: 'Kit encendedor/piloto universal secadoras a gas',
        category: 'Secadoras a gas',
        stock: 5,
        minStock: 3,
        unitCost: 38000,
        unitPrice: 78000,
        location: 'Estante D-2',
      },
    }),
    db.part.create({
      data: {
        sku: 'PAN-TV-LED-55',
        name: 'Display LED TV 55" universal',
        description: 'Panel LED retrofit 55" tiras universales',
        category: 'TVs',
        stock: 1,
        minStock: 2,
        unitCost: 320000,
        unitPrice: 580000,
        location: 'Estante E-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'FUENTE-TV-UNI',
        name: 'Fuente de poder TV universal',
        description: 'Fuente switching universal para TV LED 32"-55"',
        category: 'TVs',
        stock: 7,
        minStock: 3,
        unitCost: 48000,
        unitPrice: 95000,
        location: 'Estante E-2',
      },
    }),
    db.part.create({
      data: {
        sku: 'GAS-R134A',
        name: 'Gas refrigerante R134a 500g',
        description: 'Recarga de gas refrigerante R134a 500g con manómetro',
        category: 'Refrigeración',
        stock: 10,
        minStock: 4,
        unitCost: 65000,
        unitPrice: 120000,
        location: 'Estante F-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'GAS-R410A',
        name: 'Gas refrigerante R410A 5kg',
        description: 'Cilindro de gas R410A para aire acondicionado inverter',
        category: 'Refrigeración',
        stock: 3,
        minStock: 2,
        unitCost: 185000,
        unitPrice: 320000,
        location: 'Estante F-2',
      },
    }),
  ])

  // ============== ÓRDENES DE TRABAJO ==============
  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
  const daysAhead = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)

  // OT 1 - Entregada y pagada
  const wo1 = await db.workOrder.create({
    data: {
      code: 'OT-2024-001',
      customerId: customers[0].id,
      deviceId: devices[0].id,
      technicianId: tech1.id,
      status: 'delivered',
      priority: 'normal',
      reportedIssue: 'Lavadora no centrifuga y hace ruido extraño al girar el tambor.',
      diagnosisText: 'Correa del tambor deteriorada y rodamientos con desgaste. Bomba de agua funcionando correctamente. Reemplazo de kit de correas y rodamientos.',
      receivedAt: daysAgo(15),
      estimatedDoneAt: daysAgo(12),
      deliveredAt: daysAgo(11),
      totalAmount: 380000,
      totalPaid: 380000,
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', description: 'Equipo ingresado en recepción', createdBy: receptionist.name, createdAt: daysAgo(15) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', description: 'Asignado a técnico Javier Ramírez', createdBy: admin.name, createdAt: daysAgo(14) },
          { eventType: 'diagnosis_update', title: 'Diagnóstico completado', description: 'Correa y rodamientos dañados', createdBy: tech1.name, createdAt: daysAgo(14) },
          { eventType: 'status_change', fromStatus: 'diagnosing', toStatus: 'approved', title: 'Cotización aprobada', description: 'Cliente aprobó vía enlace', createdBy: 'Andrés Quintero', createdAt: daysAgo(13) },
          { eventType: 'status_change', fromStatus: 'approved', toStatus: 'in_progress', title: 'Reparación iniciada', createdBy: tech1.name, createdAt: daysAgo(13) },
          { eventType: 'status_change', fromStatus: 'in_progress', toStatus: 'ready', title: 'Equipo listo', description: 'Kit de correas instalado, rodamientos reemplazados', createdBy: tech1.name, createdAt: daysAgo(12) },
          { eventType: 'status_change', fromStatus: 'ready', toStatus: 'delivered', title: 'Equipo entregado', description: 'Pago recibido: $380,000', createdBy: receptionist.name, createdAt: daysAgo(11) },
        ],
      },
    },
  })

  // OT 2 - En progreso
  const wo2 = await db.workOrder.create({
    data: {
      code: 'OT-2024-002',
      customerId: customers[1].id,
      deviceId: devices[1].id,
      technicianId: tech2.id,
      status: 'in_progress',
      priority: 'high',
      reportedIssue: 'Nevera no enfría. Compressor funciona pero no baja la temperatura.',
      diagnosisText: 'Fuga de gas refrigerante en el evaporador. Compresor en buen estado. Requiere recarga de gas R134a y soldadura del escape.',
      receivedAt: daysAgo(5),
      estimatedDoneAt: daysAhead(1),
      totalAmount: 520000,
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', createdBy: receptionist.name, createdAt: daysAgo(5) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', createdBy: admin.name, createdAt: daysAgo(4) },
          { eventType: 'diagnosis_update', title: 'Diagnóstico completado', description: 'Fuga de gas refrigerante detectada', createdBy: tech2.name, createdAt: daysAgo(4) },
          { eventType: 'status_change', fromStatus: 'diagnosing', toStatus: 'approved', title: 'Cotización aprobada', description: 'Cliente aprobó en tienda', createdBy: 'Valentina Rojas', createdAt: daysAgo(3) },
          { eventType: 'status_change', fromStatus: 'approved', toStatus: 'in_progress', title: 'Reparación iniciada', createdBy: tech2.name, createdAt: daysAgo(3) },
          { eventType: 'note', title: 'Gas solicitado', description: 'Cilindro R134a en camino, llega mañana', createdBy: tech2.name, createdAt: daysAgo(1) },
        ],
      },
    },
  })

  // OT 3 - Cotizada, esperando aprobación
  const wo3 = await db.workOrder.create({
    data: {
      code: 'OT-2024-003',
      customerId: customers[2].id,
      deviceId: devices[2].id,
      technicianId: tech1.id,
      status: 'quoted',
      priority: 'normal',
      reportedIssue: 'Aire acondicionado no enfría. Solo sale aire ambiente. Gotea agua por la unidad interior.',
      diagnosisText: 'Filtro de aire saturado y nivel de gas bajo. Posible obstrucción en línea de drenaje. Limpieza profunda, recarga de gas R410A y limpieza de drenaje.',
      receivedAt: daysAgo(3),
      estimatedDoneAt: daysAhead(3),
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', createdBy: receptionist.name, createdAt: daysAgo(3) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', createdBy: admin.name, createdAt: daysAgo(2) },
          { eventType: 'diagnosis_update', title: 'Diagnóstico completado', description: 'Gas bajo y filtro saturado', createdBy: tech1.name, createdAt: daysAgo(2) },
          { eventType: 'status_change', fromStatus: 'diagnosing', toStatus: 'quoted', title: 'Cotización enviada', description: 'Enlace enviado al cliente por email', createdBy: receptionist.name, createdAt: daysAgo(2) },
        ],
      },
    },
  })

  // OT 4 - Recibida, en diagnóstico
  const wo4 = await db.workOrder.create({
    data: {
      code: 'OT-2024-004',
      customerId: customers[3].id,
      deviceId: devices[3].id,
      technicianId: tech2.id,
      status: 'diagnosing',
      priority: 'urgent',
      reportedIssue: 'Secadora a gas no calienta. El tambor gira pero no seca la ropa.',
      receivedAt: daysAgo(1),
      estimatedDoneAt: daysAhead(4),
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', description: 'Cliente requiere urgente para trabajo', createdBy: receptionist.name, createdAt: daysAgo(1) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', description: 'Posible falla en válvula de gas o encendedor piloto', createdBy: admin.name, createdAt: daysAgo(1) },
        ],
      },
    },
  })

  // OT 5 - Recibida recientemente
  const wo5 = await db.workOrder.create({
    data: {
      code: 'OT-2024-005',
      customerId: customers[4].id,
      deviceId: devices[4].id,
      status: 'received',
      priority: 'low',
      reportedIssue: 'TV no enciende. Luz indicadora parpadea 3 veces y se apaga.',
      receivedAt: daysAgo(0),
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', createdBy: receptionist.name, createdAt: daysAgo(0) },
        ],
      },
    },
  })

  // OT 6 - Lista para entrega
  const wo6 = await db.workOrder.create({
    data: {
      code: 'OT-2024-006',
      customerId: customers[5].id,
      deviceId: devices[5].id,
      technicianId: tech1.id,
      status: 'ready',
      priority: 'normal',
      reportedIssue: 'Congelador no congela. Motor funciona pero la temperatura sube.',
      diagnosisText: 'Termostato defectuoso y sello de puerta dañado. Compresor funcionando pero no regula bien. Reemplazo de termostato y sello de puerta.',
      receivedAt: daysAgo(4),
      estimatedDoneAt: daysAgo(1),
      totalAmount: 280000,
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', createdBy: receptionist.name, createdAt: daysAgo(4) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', createdBy: admin.name, createdAt: daysAgo(4) },
          { eventType: 'diagnosis_update', title: 'Diagnóstico completado', description: 'Batería agotada', createdBy: tech1.name, createdAt: daysAgo(3) },
          { eventType: 'status_change', fromStatus: 'diagnosing', toStatus: 'approved', title: 'Cotización aprobada', description: 'Cliente aprobó vía WhatsApp', createdBy: 'Camila Ortega', createdAt: daysAgo(3) },
          { eventType: 'status_change', fromStatus: 'approved', toStatus: 'in_progress', title: 'Reparación iniciada', createdBy: tech1.name, createdAt: daysAgo(2) },
          { eventType: 'status_change', fromStatus: 'in_progress', toStatus: 'ready', title: 'Equipo listo', description: 'Batería reemplazada, pruebas OK', createdBy: tech1.name, createdAt: daysAgo(1) },
        ],
      },
    },
  })

  // ============== DIAGNÓSTICOS ==============
  await db.diagnosis.create({
    data: {
      workOrderId: wo1.id,
      authorId: tech1.id,
      findings: 'Correa del tambor con grietas y elongación. Rodamientos con desgaste evidente, producen ruido al giro. Bomba de agua y motor eléctrico en buen estado. Tarjeta electrónica funcionando correctamente.',
      rootCause: 'Desgaste natural por uso prolongado sin mantenimiento preventivo.',
      recommendation: 'Reemplazo de kit de correas universales y cambio de rodamientos del tambor. Limpieza interna del depósito.',
      laborHours: 2.5,
      laborCost: 90000,
    },
  })

  await db.diagnosis.create({
    data: {
      workOrderId: wo2.id,
      authorId: tech2.id,
      findings: 'Fuga de gas refrigerante R134a detectada con detector electrónico en el evaporador. Compresor arranca y funciona correctamente. Condensador sin obstrucciones. Termostato digital responde bien.',
      rootCause: 'Corrosión microperforante en tubería del evaporador por humedad.',
      recommendation: 'Soldadura del escape, recarga de gas R134a 500g, revisión de sellos y prueba de estanqueidad.',
      laborHours: 3,
      laborCost: 100000,
    },
  })

  await db.diagnosis.create({
    data: {
      workOrderId: wo3.id,
      authorId: tech1.id,
      findings: 'Filtro de aire completamente saturado de polvo. Nivel de gas R410A bajo (manómetro marca 45 psi, debería ser 120 psi). Línea de drenaje obstruida causando goteo. Ventilador interior funciona bien.',
      rootCause: 'Falta de mantenimiento preventivo y fuga lenta de gas en conexión flare.',
      recommendation: 'Limpieza profunda de filtros y batería, recarga de gas R410A 5kg, limpieza de línea de drenaje, revisión de conexiones flare.',
      laborHours: 2,
      laborCost: 80000,
    },
  })

  // ============== COTIZACIONES ==============
  // Cotización OT-001 (aprobada)
  await db.quote.create({
    data: {
      workOrderId: wo1.id,
      code: 'COT-2024-001',
      status: 'approved',
      approvalToken: randomUUID(),
      notes: 'Incluye kit de correas y mano de obra de instalación.',
      validUntil: daysAgo(10),
      subtotal: 319327,
      tax: 60673,
      total: 380000,
      approvedAt: daysAgo(13),
      approvedBy: 'Andrés Quintero',
      items: {
        create: [
          { itemType: 'part', description: 'Kit correas lavadora (universal)', quantity: 1, unitPrice: 42000, total: 42000, partId: parts[1].id },
          { itemType: 'labor', description: 'Reemplazo de rodamientos del tambor', quantity: 2.5, unitPrice: 36000, total: 90000 },
          { itemType: 'labor', description: 'Limpieza interna y prueba', quantity: 1, unitPrice: 35000, total: 35000 },
          { itemType: 'part', description: 'Bomba de agua para lavadora LG', quantity: 1, unitPrice: 85000, total: 85000, partId: parts[0].id },
        ],
      },
    },
  })

  // Cotización OT-002 (aprobada)
  await db.quote.create({
    data: {
      workOrderId: wo2.id,
      code: 'COT-2024-002',
      status: 'approved',
      approvalToken: randomUUID(),
      validUntil: daysAhead(5),
      subtotal: 436974,
      tax: 83026,
      total: 520000,
      approvedAt: daysAgo(3),
      approvedBy: 'Valentina Rojas',
      items: {
        create: [
          { itemType: 'part', description: 'Gas refrigerante R134a 500g', quantity: 1, unitPrice: 120000, total: 120000, partId: parts[10].id },
          { itemType: 'labor', description: 'Soldadura de evaporador y recarga de gas', quantity: 3, unitPrice: 40000, total: 120000 },
        ],
      },
    },
  })

  // Cotización OT-003 (enviada, esperando aprobación)
  await db.quote.create({
    data: {
      workOrderId: wo3.id,
      code: 'COT-2024-003',
      status: 'sent',
      approvalToken: randomUUID(),
      validUntil: daysAhead(5),
      subtotal: 71428,
      tax: 13572,
      total: 85000,
      items: {
        create: [
          { itemType: 'part', description: 'Capacitor AC Midea 35µF', quantity: 1, unitPrice: 55000, total: 55000, partId: parts[4].id },
          { itemType: 'labor', description: 'Limpieza de filtros y drenaje', quantity: 1, unitPrice: 30000, total: 30000 },
        ],
      },
    },
  })

  // Cotización OT-006 (aprobada)
  await db.quote.create({
    data: {
      workOrderId: wo6.id,
      code: 'COT-2024-004',
      status: 'approved',
      approvalToken: randomUUID(),
      validUntil: daysAhead(10),
      subtotal: 235294,
      tax: 44706,
      total: 280000,
      approvedAt: daysAgo(3),
      approvedBy: 'Camila Ortega',
      items: {
        create: [
          { itemType: 'labor', description: 'Reemplazo de termostato y sello de puerta', quantity: 1, unitPrice: 280000, total: 280000 },
        ],
      },
    },
  })

  // ============== FACTURAS ==============
  await db.invoice.create({
    data: {
      code: 'FAC-2024-001',
      workOrderId: wo1.id,
      customerId: customers[0].id,
      subtotal: 319327,
      tax: 60673,
      total: 380000,
      paid: 380000,
      paymentMethod: 'card',
      status: 'paid',
      paidAt: daysAgo(11),
      notes: 'Factura electrónica',
    },
  })

  // ============== MOVIMIENTOS DE INVENTARIO ==============
  await db.inventoryMovement.create({
    data: { partId: parts[0].id, workOrderId: wo1.id, movementType: 'out', quantity: 1, reason: 'Uso en OT-2024-001', unitCost: 45000, createdBy: tech1.name },
  })
  await db.inventoryMovement.create({
    data: { partId: parts[1].id, workOrderId: wo1.id, movementType: 'out', quantity: 1, reason: 'Uso en OT-2024-001', unitCost: 18000, createdBy: tech1.name },
  })

  // Movimientos de entrada iniciales
  await db.inventoryMovement.createMany({
    data: [
      { partId: parts[0].id, movementType: 'in', quantity: 10, reason: 'Compra inicial', unitCost: 45000 },
      { partId: parts[1].id, movementType: 'in', quantity: 15, reason: 'Compra inicial', unitCost: 18000 },
      { partId: parts[2].id, movementType: 'in', quantity: 6, reason: 'Compra inicial', unitCost: 55000 },
      { partId: parts[3].id, movementType: 'in', quantity: 3, reason: 'Compra inicial', unitCost: 280000 },
      { partId: parts[4].id, movementType: 'in', quantity: 10, reason: 'Compra inicial', unitCost: 22000 },
      { partId: parts[5].id, movementType: 'in', quantity: 4, reason: 'Compra inicial', unitCost: 95000 },
      { partId: parts[6].id, movementType: 'in', quantity: 3, reason: 'Compra inicial', unitCost: 75000 },
      { partId: parts[7].id, movementType: 'in', quantity: 6, reason: 'Compra inicial', unitCost: 38000 },
      { partId: parts[8].id, movementType: 'in', quantity: 2, reason: 'Compra inicial', unitCost: 320000 },
      { partId: parts[9].id, movementType: 'in', quantity: 8, reason: 'Compra inicial', unitCost: 48000 },
      { partId: parts[10].id, movementType: 'in', quantity: 12, reason: 'Compra inicial', unitCost: 65000 },
      { partId: parts[11].id, movementType: 'in', quantity: 4, reason: 'Compra inicial', unitCost: 185000 },
    ],
  })

  // ============== AUDIT LOG ==============
  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'create',
      entity: 'WorkOrder',
      entityId: wo1.id,
      description: 'Orden de trabajo OT-2024-001 creada',
    },
  })

  console.log('✅ Seed completado!')
  console.log(`   - ${await db.user.count()} usuarios`)
  console.log(`   - ${await db.customer.count()} clientes`)
  console.log(`   - ${await db.device.count()} equipos`)
  console.log(`   - ${await db.workOrder.count()} órdenes de trabajo`)
  console.log(`   - ${await db.part.count()} repuestos`)
  console.log(`   - ${await db.quote.count()} cotizaciones`)
  console.log(`   - ${await db.invoice.count()} facturas`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
