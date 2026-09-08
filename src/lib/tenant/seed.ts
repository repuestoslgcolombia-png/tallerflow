import { db } from '@/lib/db'

// Semillas por-taller: settings + plantillas WhatsApp base + automatizaciones base.
// Copiadas de los valores que usaba el singleton WorkshopSetting del piloto.

export async function seedTenantDefaults(tenantId: string): Promise<void> {
  // Settings del taller
  await db.workshopSetting.create({
    data: {
      tenantId,
      name: 'Mi Taller',
      currency: 'COP',
      currencySymbol: '$',
      taxRate: 19,
    },
  })

  // Plantillas WhatsApp base (isSystem=true, no editables)
  const templates = [
    {
      code: 'order_received',
      name: 'Orden recibida',
      category: 'orders',
      body: 'Hola {cliente}, recibimos tu {equipo} con nosotros. Tu orden {orden} está en proceso. ¡Te avisaremos!',
    },
    {
      code: 'quote_sent',
      name: 'Cotización enviada',
      category: 'quotes',
      body: 'Hola {cliente}, te enviamos la cotización {cotizacion} para tu {equipo}. Puedes revisarla y aprobarla aquí: {link}',
    },
    {
      code: 'order_ready',
      name: 'Orden lista',
      category: 'orders',
      body: 'Hola {cliente}, tu {equipo} está listo. Puedes pasar a recogerlo cuando gustes. Total: {total}.',
    },
    {
      code: 'order_delivered',
      name: 'Orden entregada',
      category: 'orders',
      body: 'Hola {cliente}, gracias por confiar en nosotros. Tu {equipo} fue entregado. Cualquier inconveniente, ¡escríbenos!',
    },
    {
      code: 'follow_up',
      name: 'Seguimiento post-servicio',
      category: 'reminders',
      body: 'Hola {cliente}, ¿cómo va tu {equipo} después del servicio? Queremos saber que todo esté perfecto.',
    },
    {
      code: 'warranty_check',
      name: 'Revisión de garantía',
      category: 'reminders',
      body: 'Hola {cliente}, tu garantía por el servicio de {equipo} está por vencer. ¿Quieres una revisión?',
    },
    {
      code: 'maintenance',
      name: 'Mantenimiento programado',
      category: 'reminders',
      body: 'Hola {cliente}, es momento del mantenimiento de tu {equipo}. ¿Agendamos tu visita?',
    },
  ]

  await db.whatsAppTemplate.createMany({
    data: templates.map((t) => ({
      ...t,
      tenantId,
      isSystem: true,
      active: true,
    })),
  })

  // Automatizaciones base (deshabilitadas por defecto: el dueño las activa)
  const automations = [
    { trigger: 'order_received', action: 'send_whatsapp', templateCode: 'order_received', delayMinutes: 0 },
    { trigger: 'quote_sent', action: 'send_whatsapp', templateCode: 'quote_sent', delayMinutes: 0 },
    { trigger: 'order_ready', action: 'send_whatsapp', templateCode: 'order_ready', delayMinutes: 0 },
    { trigger: 'order_delivered', action: 'send_whatsapp', templateCode: 'order_delivered', delayMinutes: 0 },
    { trigger: 'quote_approved', action: 'create_reminder', reminderType: 'warranty_check', daysOffset: 30 },
  ]

  await db.automationRule.createMany({
    data: automations.map((r) => ({
      ...r,
      tenantId,
      enabled: false,
    })),
  })
}
