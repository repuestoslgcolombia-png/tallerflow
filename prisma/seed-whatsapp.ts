import { db } from '@/lib/db'

async function main() {
  console.log('🌱 Seeding WhatsApp templates...')

  await db.whatsAppTemplate.deleteMany({})

  const templates = [
    {
      code: 'order_received',
      name: 'Orden recibida',
      category: 'orders',
      subject: 'Confirmación de recepción',
      body: `🛠️ *{taller}*

Hola *{cliente}*, confirmamos que hemos recibido tu equipo *{equipo}*.

📋 Orden: *{codigo}*
📅 Fecha estimada de entrega: {fecha}

Te mantendremos informado sobre el estado de la reparación. ¡Gracias por confiar en nosotros!`,
    },
    {
      code: 'quote_sent',
      name: 'Cotización enviada',
      category: 'quotes',
      subject: 'Cotización lista',
      body: `💰 *{taller}*

Hola *{cliente}*, tu cotización está lista.

📋 Orden: *{codigo}*
🖥️ Equipo: *{equipo}*
💵 Total: *{total}*

Puedes revisar y aprobar la cotización en el siguiente enlace, o respondiendo a este mensaje.

¡Quedamos atentos a tu confirmación!`,
    },
    {
      code: 'quote_approved',
      name: 'Cotización aprobada',
      category: 'quotes',
      subject: 'Confirmación de aprobación',
      body: `✅ *{taller}*

Hola *{cliente}*, gracias por aprobar la cotización.

📋 Orden: *{codigo}*
💵 Total: *{total}*

Iniciaremos la reparación de tu *{equipo}* de inmediato. Te avisaremos cuando esté lista.`,
    },
    {
      code: 'order_ready',
      name: 'Equipo listo',
      category: 'orders',
      subject: 'Equipo listo para entrega',
      body: `🎉 *{taller}*

¡Buenas noticias, *{cliente}*!

Tu equipo *{equipo}* (orden *{codigo}*) ya está listo para ser retirado.

📍 Puedes pasar a recogerlo en nuestro taller.
💵 Total a pagar: *{total}*

¡Te esperamos!`,
    },
    {
      code: 'order_delivered',
      name: 'Equipo entregado',
      category: 'orders',
      subject: 'Confirmación de entrega',
      body: `📦 *{taller}*

Hola *{cliente}*, gracias por retirar tu equipo *{equipo}*.

📋 Orden: *{codigo}*
✅ Estado: Entregado

Esperamos que todo funcione perfectamente. Cualquier duda, estamos para ayudarte. ¡Hasta pronto!`,
    },
    {
      code: 'follow_up',
      name: 'Seguimiento post-servicio',
      category: 'reminders',
      subject: '¿Cómo va tu equipo?',
      body: `👋 *{taller}*

Hola *{cliente}*, ¿cómo va tu equipo *{equipo}* que reparamos?

Queremos asegurarnos de que todo funcione correctamente. Si tienes alguna duda o necesitas ayuda, no dudes en contactarnos.

¡Gracias por tu confianza!`,
    },
    {
      code: 'warranty_check',
      name: 'Revisión de garantía',
      category: 'reminders',
      subject: 'Garantía por vencer',
      body: `🛡️ *{taller}*

Hola *{cliente}*, te recordamos que la garantía de la reparación de tu *{equipo}* (orden *{codigo}*) está por vencer.

¿Te gustaría una revisión preventiva sin costo? Contáctanos para agendar.

¡Estamos para servirte!`,
    },
    {
      code: 'service_review',
      name: 'Solicitud de reseña',
      category: 'reminders',
      subject: 'Cuéntanos tu experiencia',
      body: `⭐ *{taller}*

Hola *{cliente}*, nos gustaría conocer tu opinión sobre el servicio que recibiste.

Tu feedback nos ayuda a mejorar y a ofrecer un mejor servicio a todos nuestros clientes.

¡Gracias por tu tiempo!`,
    },
    {
      code: 'maintenance_reminder',
      name: 'Mantenimiento preventivo',
      category: 'reminders',
      subject: 'Recordatorio de mantenimiento',
      body: `🔧 *{taller}*

Hola *{cliente}*, es momento del mantenimiento preventivo de tu *{equipo}*.

El mantenimiento periódico prolonga la vida útil de tu equipo y evita reparaciones costosas.

Contáctanos para agendar una visita. ¡Te esperamos!`,
    },
    {
      code: 'custom_message',
      name: 'Mensaje personalizado',
      category: 'general',
      subject: 'Mensaje del taller',
      body: `*{taller}*

Hola *{cliente}*,

[Escribe aquí tu mensaje personalizado]`,
    },
  ]

  for (const t of templates) {
    await db.whatsAppTemplate.create({
      data: {
        ...t,
        isSystem: true,
        active: true,
      },
    })
  }

  console.log(`✅ ${templates.length} plantillas de WhatsApp creadas`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
