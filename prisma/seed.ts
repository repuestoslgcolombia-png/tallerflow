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
        type: 'laptop',
        brand: 'Lenovo',
        model: 'ThinkPad T480',
        serial: 'PF1ABCD12',
        accessories: 'Cargador original, funda negra',
        notes: 'Equipo para uso de oficina.',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[1].id,
        type: 'phone',
        brand: 'Samsung',
        model: 'Galaxy S21',
        serial: 'RG8XYZ99',
        accessories: 'Cable USB-C',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[2].id,
        type: 'desktop',
        brand: 'Dell',
        model: 'OptiPlex 7090',
        serial: 'DL7SFF44',
        notes: 'Equipo de diseño gráfico.',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[3].id,
        type: 'laptop',
        brand: 'HP',
        model: 'Pavilion 15',
        serial: 'HP15PQN21',
        accessories: 'Cargador',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[4].id,
        type: 'printer',
        brand: 'Epson',
        model: 'EcoTank L3250',
        serial: 'EPSL325055',
      },
    }),
    db.device.create({
      data: {
        customerId: customers[5].id,
        type: 'phone',
        brand: 'Apple',
        model: 'iPhone 13',
        serial: 'IPHN13ABCD',
        accessories: 'Cargador, audífonos',
      },
    }),
  ])

  // ============== REPUESTOS / INVENTARIO ==============
  const parts = await Promise.all([
    db.part.create({
      data: {
        sku: 'SSD-256-01',
        name: 'SSD 256GB SATA',
        description: 'Disco sólido SATA 2.5" 256GB',
        category: 'Almacenamiento',
        stock: 8,
        minStock: 3,
        unitCost: 85000,
        unitPrice: 130000,
        location: 'Estante A-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'SSD-512-02',
        name: 'SSD 512GB NVMe',
        description: 'Disco sólido M.2 NVMe 512GB',
        category: 'Almacenamiento',
        stock: 5,
        minStock: 2,
        unitCost: 165000,
        unitPrice: 240000,
        location: 'Estante A-2',
      },
    }),
    db.part.create({
      data: {
        sku: 'RAM-8-DDR4',
        name: 'Memoria RAM 8GB DDR4',
        description: 'Memoria SO-DIMM 8GB DDR4 2666MHz',
        category: 'Memoria',
        stock: 12,
        minStock: 4,
        unitCost: 70000,
        unitPrice: 110000,
        location: 'Estante B-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'RAM-16-DDR4',
        name: 'Memoria RAM 16GB DDR4',
        description: 'Memoria SO-DIMM 16GB DDR4 3200MHz',
        category: 'Memoria',
        stock: 4,
        minStock: 2,
        unitCost: 135000,
        unitPrice: 210000,
        location: 'Estante B-2',
      },
    }),
    db.part.create({
      data: {
        sku: 'BAT-LP-LEN01',
        name: 'Batería Lenovo ThinkPad T480',
        description: 'Batería interna original Lenovo',
        category: 'Batería',
        stock: 2,
        minStock: 3,
        unitCost: 180000,
        unitPrice: 280000,
        location: 'Estante C-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'PAN-SAM-S21',
        name: 'Pantalla Samsung Galaxy S21',
        description: 'Pantalla OLED original Samsung S21',
        category: 'Pantalla',
        stock: 1,
        minStock: 2,
        unitCost: 320000,
        unitPrice: 480000,
        location: 'Estante D-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'CAR-USB-65W',
        name: 'Cargador USB-C 65W',
        description: 'Cargador universal USB-C 65W',
        category: 'Cargador',
        stock: 10,
        minStock: 5,
        unitCost: 45000,
        unitPrice: 78000,
        location: 'Estante E-1',
      },
    }),
    db.part.create({
      data: {
        sku: 'PAS-TERMAL',
        name: 'Pasta térmica premium',
        description: 'Pasta térmica conductiva 4g',
        category: 'Otros',
        stock: 6,
        minStock: 3,
        unitCost: 18000,
        unitPrice: 35000,
        unit: 'gramo',
        location: 'Estante F-1',
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
      reportedIssue: 'Equipo muy lento al iniciar. Se cuelga al abrir varias aplicaciones.',
      diagnosisText: 'Disco HDD con sectores dañados y 4GB de RAM insuficientes. Se recomienda cambiar a SSD y ampliar RAM.',
      receivedAt: daysAgo(15),
      estimatedDoneAt: daysAgo(12),
      deliveredAt: daysAgo(11),
      totalAmount: 380000,
      totalPaid: 380000,
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', description: 'Equipo ingresado en recepción', createdBy: receptionist.name, createdAt: daysAgo(15) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', description: 'Asignado a técnico Javier Ramírez', createdBy: admin.name, createdAt: daysAgo(14) },
          { eventType: 'diagnosis_update', title: 'Diagnóstico completado', description: 'Disco HDD dañado, RAM insuficiente', createdBy: tech1.name, createdAt: daysAgo(14) },
          { eventType: 'status_change', fromStatus: 'diagnosing', toStatus: 'approved', title: 'Cotización aprobada', description: 'Cliente aprobó vía enlace', createdBy: 'Andrés Quintero', createdAt: daysAgo(13) },
          { eventType: 'status_change', fromStatus: 'approved', toStatus: 'in_progress', title: 'Reparación iniciada', createdBy: tech1.name, createdAt: daysAgo(13) },
          { eventType: 'status_change', fromStatus: 'in_progress', toStatus: 'ready', title: 'Equipo listo', description: 'SSD instalado, RAM ampliada, sistema optimizado', createdBy: tech1.name, createdAt: daysAgo(12) },
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
      reportedIssue: 'Pantalla rota tras caída. No responde al tacto.',
      diagnosisText: 'Pantalla OLED dañada, touchscreen no funcional. Requiere reemplazo completo del módulo.',
      receivedAt: daysAgo(5),
      estimatedDoneAt: daysAhead(1),
      totalAmount: 520000,
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', createdBy: receptionist.name, createdAt: daysAgo(5) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', createdBy: admin.name, createdAt: daysAgo(4) },
          { eventType: 'diagnosis_update', title: 'Diagnóstico completado', description: 'Pantalla OLED rota', createdBy: tech2.name, createdAt: daysAgo(4) },
          { eventType: 'status_change', fromStatus: 'diagnosing', toStatus: 'approved', title: 'Cotización aprobada', description: 'Cliente aprobó en tienda', createdBy: 'Valentina Rojas', createdAt: daysAgo(3) },
          { eventType: 'status_change', fromStatus: 'approved', toStatus: 'in_progress', title: 'Reparación iniciada', createdBy: tech2.name, createdAt: daysAgo(3) },
          { eventType: 'note', title: 'Pantalla solicitada', description: 'Pantalla original en camino, llega mañana', createdBy: tech2.name, createdAt: daysAgo(1) },
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
      reportedIssue: 'Equipo se apaga solo después de 30 min de uso. Refrigeración ruidosa.',
      diagnosisText: 'Pasta térmica seca, ventilador con polvo acumulado. Posible daño en disipador. Limpieza profunda y reaplicación de pasta térmica.',
      receivedAt: daysAgo(3),
      estimatedDoneAt: daysAhead(3),
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', createdBy: receptionist.name, createdAt: daysAgo(3) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', createdBy: admin.name, createdAt: daysAgo(2) },
          { eventType: 'diagnosis_update', title: 'Diagnóstico completado', description: 'Sistema de refrigeración comprometido', createdBy: tech1.name, createdAt: daysAgo(2) },
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
      reportedIssue: 'No enciende. Solo parpadea la luz de carga.',
      receivedAt: daysAgo(1),
      estimatedDoneAt: daysAhead(4),
      timeline: {
        create: [
          { eventType: 'status_change', fromStatus: '', toStatus: 'received', title: 'Orden recibida', description: 'Cliente requiere urgente para trabajo', createdBy: receptionist.name, createdAt: daysAgo(1) },
          { eventType: 'status_change', fromStatus: 'received', toStatus: 'diagnosing', title: 'Diagnóstico iniciado', description: 'Posible falla en placa madre', createdBy: admin.name, createdAt: daysAgo(1) },
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
      reportedIssue: 'Impresora no imprime en color. Tinta aparentemente llena.',
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
      reportedIssue: 'Batería se descarga muy rápido. No dura media hora.',
      diagnosisText: 'Batería con ciclos agotados. Capacidad al 32%. Reemplazo de batería.',
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
      findings: 'Disco HDD con sectores dañados detectados en test SMART. 4GB RAM insuficientes para Windows 11. Sistema con más de 80 procesos en segundo plano.',
      rootCause: 'Hardware obsoleto + falta de mantenimiento.',
      recommendation: 'Migrar a SSD 256GB, ampliar RAM a 8GB, optimización de sistema operativo incluida.',
      laborHours: 1.5,
      laborCost: 60000,
    },
  })

  await db.diagnosis.create({
    data: {
      workOrderId: wo2.id,
      authorId: tech2.id,
      findings: 'Pantalla OLED con grietas visibles. Touchscreen no responde. Cristal exterior intacto pero matriz dañada internamente.',
      rootCause: 'Impacto físico por caída.',
      recommendation: 'Reemplazo de módulo completo de pantalla OLED.',
      laborHours: 2,
      laborCost: 80000,
    },
  })

  await db.diagnosis.create({
    data: {
      workOrderId: wo3.id,
      authorId: tech1.id,
      findings: 'Pasta térmica completamente seca. Ventilador con exceso de polvo. Temperaturas CPU llegan a 95°C en load.',
      rootCause: 'Falta de mantenimiento preventivo. Equipo con 3+ años sin service.',
      recommendation: 'Limpieza profunda, reaplicación de pasta térmica premium, revisión de ventilador.',
      laborHours: 1,
      laborCost: 50000,
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
      notes: 'Incluye migración de datos y optimización del sistema.',
      validUntil: daysAgo(10),
      subtotal: 319327,
      tax: 60673,
      total: 380000,
      approvedAt: daysAgo(13),
      approvedBy: 'Andrés Quintero',
      items: {
        create: [
          { itemType: 'part', description: 'SSD 256GB SATA', quantity: 1, unitPrice: 130000, total: 130000, partId: parts[0].id },
          { itemType: 'part', description: 'Memoria RAM 8GB DDR4', quantity: 1, unitPrice: 110000, total: 110000, partId: parts[2].id },
          { itemType: 'labor', description: 'Instalación y migración de datos', quantity: 1.5, unitPrice: 40000, total: 60000 },
          { itemType: 'labor', description: 'Optimización del sistema', quantity: 1, unitPrice: 25000, total: 25000 },
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
          { itemType: 'part', description: 'Pantalla Samsung Galaxy S21', quantity: 1, unitPrice: 480000, total: 480000, partId: parts[5].id },
          { itemType: 'labor', description: 'Reemplazo de pantalla', quantity: 1, unitPrice: 40000, total: 40000 },
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
          { itemType: 'part', description: 'Pasta térmica premium', quantity: 1, unitPrice: 35000, total: 35000, partId: parts[7].id },
          { itemType: 'labor', description: 'Limpieza profunda y mantenimiento', quantity: 1, unitPrice: 50000, total: 50000 },
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
          { itemType: 'labor', description: 'Reemplazo de batería iPhone 13', quantity: 1, unitPrice: 280000, total: 280000 },
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
    data: { partId: parts[0].id, workOrderId: wo1.id, movementType: 'out', quantity: 1, reason: 'Uso en OT-2024-001', unitCost: 85000, createdBy: tech1.name },
  })
  await db.inventoryMovement.create({
    data: { partId: parts[2].id, workOrderId: wo1.id, movementType: 'out', quantity: 1, reason: 'Uso en OT-2024-001', unitCost: 70000, createdBy: tech1.name },
  })

  // Movimientos de entrada iniciales
  await db.inventoryMovement.createMany({
    data: [
      { partId: parts[0].id, movementType: 'in', quantity: 10, reason: 'Compra inicial', unitCost: 85000 },
      { partId: parts[1].id, movementType: 'in', quantity: 6, reason: 'Compra inicial', unitCost: 165000 },
      { partId: parts[2].id, movementType: 'in', quantity: 15, reason: 'Compra inicial', unitCost: 70000 },
      { partId: parts[3].id, movementType: 'in', quantity: 5, reason: 'Compra inicial', unitCost: 135000 },
      { partId: parts[4].id, movementType: 'in', quantity: 3, reason: 'Compra inicial', unitCost: 180000 },
      { partId: parts[5].id, movementType: 'in', quantity: 2, reason: 'Compra inicial', unitCost: 320000 },
      { partId: parts[6].id, movementType: 'in', quantity: 12, reason: 'Compra inicial', unitCost: 45000 },
      { partId: parts[7].id, movementType: 'in', quantity: 8, reason: 'Compra inicial', unitCost: 18000 },
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
