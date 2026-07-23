import { db } from '@/lib/db'

async function main() {
  console.log('🌱 Seeding reminders...')

  // Get delivered work orders with customers
  const deliveredOrders = await db.workOrder.findMany({
    where: { status: 'delivered' },
    include: { customer: true, device: true },
  })

  const readyOrders = await db.workOrder.findMany({
    where: { status: 'ready' },
    include: { customer: true, device: true },
  })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
  const daysAhead = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)

  // Clear existing reminders
  await db.reminder.deleteMany({})

  const reminders: any[] = []

  // Reminder 1: Follow-up due TODAY for a delivered order (OT-2024-001)
  if (deliveredOrders[0]) {
    const wo = deliveredOrders[0]
    reminders.push({
      customerId: wo.customerId,
      workOrderId: wo.id,
      type: 'follow_up',
      title: 'Seguimiento post-reparación',
      message: `Hola ${wo.customer.firstName}, ¿cómo va el equipo ${wo.device?.brand} ${wo.device?.model} que reparamos? Si tiene alguna duda, estamos para ayudarte.`,
      dueDate: new Date(today.getTime() + 10 * 60 * 60 * 1000), // today at 10am
      channel: 'whatsapp',
      status: 'pending',
      priority: 'normal',
      daysAfter: 7,
    })
  }

  // Reminder 2: Warranty check due TODAY (high priority)
  if (deliveredOrders[0]) {
    const wo = deliveredOrders[0]
    reminders.push({
      customerId: wo.customerId,
      workOrderId: wo.id,
      type: 'warranty_check',
      title: 'Revisión de garantía próxima a vencer',
      message: `Su garantía por la reparación de ${wo.device?.brand} ${wo.device?.model} está por vencer. ¿Le gustaría una revisión preventiva sin costo?`,
      dueDate: new Date(today.getTime() + 14 * 60 * 60 * 1000), // today at 2pm
      channel: 'phone',
      status: 'pending',
      priority: 'high',
      daysAfter: 25,
    })
  }

  // Reminder 3: OVERDUE - follow up from 3 days ago (not contacted)
  if (readyOrders[0]) {
    const wo = readyOrders[0]
    reminders.push({
      customerId: wo.customerId,
      workOrderId: wo.id,
      type: 'follow_up',
      title: 'Seguimiento post-reparación (vencido)',
      message: `Hola ${wo.customer.firstName}, su equipo ${wo.device?.brand} ${wo.device?.model} está listo. ¿Lo ha retirado ya?`,
      dueDate: daysAgo(2),
      channel: 'whatsapp',
      status: 'pending',
      priority: 'high',
      daysAfter: 7,
    })
  }

  // Reminder 4: Service review due in 2 days
  if (deliveredOrders[0]) {
    const wo = deliveredOrders[0]
    reminders.push({
      customerId: wo.customerId,
      workOrderId: wo.id,
      type: 'service_review',
      title: 'Solicitud de reseña del servicio',
      message: '¿Cómo calificaría el servicio recibido? Su opinión nos ayuda a mejorar. ¡Gracias!',
      dueDate: daysAhead(2),
      channel: 'email',
      status: 'pending',
      priority: 'low',
      daysAfter: 3,
    })
  }

  // Reminder 5: Maintenance due in 1 week
  if (deliveredOrders[0]) {
    const wo = deliveredOrders[0]
    reminders.push({
      customerId: wo.customerId,
      workOrderId: wo.id,
      type: 'maintenance',
      title: 'Mantenimiento preventivo programado',
      message: `Es momento del mantenimiento preventivo de su ${wo.device?.brand} ${wo.device?.model}. Contáctenos para agendar.`,
      dueDate: daysAhead(7),
      channel: 'whatsapp',
      status: 'pending',
      priority: 'normal',
      daysAfter: 90,
    })
  }

  // Reminder 6: COMPLETED reminder (historical)
  if (deliveredOrders[0]) {
    const wo = deliveredOrders[0]
    reminders.push({
      customerId: wo.customerId,
      workOrderId: wo.id,
      type: 'follow_up',
      title: 'Seguimiento post-reparación (completado)',
      message: `Hola ${wo.customer.firstName}, ¿cómo va su equipo?`,
      dueDate: daysAgo(10),
      channel: 'whatsapp',
      status: 'done',
      priority: 'normal',
      daysAfter: 7,
      completedAt: daysAgo(8),
      completedBy: 'María Fernández',
      completionNotes: 'Cliente muy satisfecho. El equipo funciona perfectamente. No requiere más seguimiento.',
    })
  }

  // Reminder 7: SNOOZED reminder
  if (readyOrders[0]) {
    const wo = readyOrders[0]
    reminders.push({
      customerId: wo.customerId,
      workOrderId: wo.id,
      type: 'service_review',
      title: 'Solicitud de reseña (pospuesta)',
      message: '¿Cómo calificaría el servicio?',
      dueDate: daysAgo(5),
      channel: 'email',
      status: 'snoozed',
      priority: 'low',
      daysAfter: 3,
      snoozedUntil: daysAhead(3),
    })
  }

  // Reminder 8: Custom reminder without work order
  const customers = await db.customer.findMany({ take: 2 })
  if (customers[1]) {
    reminders.push({
      customerId: customers[1].id,
      type: 'custom',
      title: 'Llamar por cotización de equipo adicional',
      message: 'El cliente preguntó por reparación de una tablet. Llamar para dar seguimiento.',
      dueDate: new Date(today.getTime() + 16 * 60 * 60 * 1000), // today at 4pm
      channel: 'phone',
      status: 'pending',
      priority: 'normal',
    })
  }

  for (const r of reminders) {
    await db.reminder.create({ data: r })
  }

  console.log(`✅ ${reminders.length} recordatorios creados`)
  console.log(`   - Pendientes hoy: ${reminders.filter(r => r.status === 'pending' && new Date(r.dueDate) >= today && new Date(r.dueDate) < new Date(today.getTime() + 86400000)).length}`)
  console.log(`   - Vencidos: ${reminders.filter(r => r.status === 'pending' && new Date(r.dueDate) < today).length}`)
  console.log(`   - Pospuestos: ${reminders.filter(r => r.status === 'snoozed').length}`)
  console.log(`   - Completados: ${reminders.filter(r => r.status === 'done').length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
