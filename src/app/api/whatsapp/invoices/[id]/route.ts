import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'
import { formatCurrency } from '@/lib/constants'

// POST /api/whatsapp/invoices/[id]/send
// Genera el mensaje de factura y lo registra como enviado
// El frontend usará la URL devuelta para abrir wa.me
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const body = await req.json()

    const invoice = await tdb.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        workOrder: { include: { device: true } },
        items: true,
      },
    })
    if (!invoice) return notFound('Factura no encontrada')

    // Obtener configuración del taller para el nombre y moneda
    const settings = await tdb.workshopSetting.findFirst()
    const tallerName = settings?.name || 'TallerFlow'
    const symbol = settings?.currencySymbol || '$'
    const warrantyPolicy = settings?.warrantyPolicy || ''

    // Verificar conexión de WhatsApp (1 por tenant)
    const conn = await tdb.whatsAppConnection.findFirst()

    // Construir el mensaje de factura
    const customerName = `${invoice.customer.firstName} ${invoice.customer.lastName}`
    const balance = invoice.total - invoice.paid

    const statusLabel: Record<string, string> = {
      pending: '⏳ Pendiente',
      paid: '✅ Pagada',
      partial: '🔄 Pago parcial',
      cancelled: '❌ Anulada',
    }

    let message = `🧾 *${tallerName}*

Hola *${customerName}*, aquí están los detalles de tu factura:

📋 *Factura:* ${invoice.code}
📅 *Fecha:* ${new Date(invoice.issuedAt).toLocaleDateString('es-CO')}
`

    if (invoice.workOrder) {
      message += `🔧 *Equipo:* ${invoice.workOrder.device?.brand || ''} ${invoice.workOrder.device?.model || ''}
📋 *Orden:* ${invoice.workOrder.code}
`
    }

    message += `\n━━━━━━━━━━━━━━━\n`

    // Items
    if (invoice.items && invoice.items.length > 0) {
      message += `*DETALLE:*\n`
      invoice.items.forEach((item: any, idx: number) => {
        message += `${idx + 1}. ${item.description}
   ${item.quantity} x ${formatCurrency(item.unitPrice, symbol)} = ${formatCurrency(item.total, symbol)}
`
      })
    }

    message += `\n━━━━━━━━━━━━━━━
*Subtotal:* ${formatCurrency(invoice.subtotal, symbol)}
*IVA${invoice.tax > 0 && invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}:* ${formatCurrency(invoice.tax, symbol)}
*TOTAL:* ${formatCurrency(invoice.total, symbol)}
`

    if (invoice.paid > 0 && balance > 0) {
      message += `*Pagado:* ${formatCurrency(invoice.paid, symbol)}
*SALDO PENDIENTE:* ${formatCurrency(balance, symbol)}
`
    }

    message += `\n*Estado:* ${statusLabel[invoice.status] || invoice.status}
`

    if (invoice.notes) {
      message += `\n📝 *Notas:* ${invoice.notes}
`
    }

    if (warrantyPolicy) {
      message += `\n📜 *Política de garantías:*
${warrantyPolicy}
`
    }

    message += `\nSi tienes alguna pregunta, no dudes en contactarnos.
¡Gracias por tu preferencia! 🙏`

    // Limpiar el teléfono del cliente
    const phone = (invoice.customer.phone || '').replace(/[^0-9]/g, '')

    if (!phone) {
      return badRequest('El cliente no tiene un número de teléfono registrado')
    }

    // Construir URL de wa.me
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`

    // Registrar el mensaje en el historial
    const template = await tdb.whatsAppTemplate.findFirst({ where: { code: 'invoice_sent' } })

    const messageRecord = await db.whatsAppMessage.create({
      data: {
        customerId: invoice.customerId,
        workOrderId: invoice.workOrderId || null,
        templateId: template?.id || null,
        toPhone: phone,
        toName: customerName,
        message,
        status: 'sent',
        channel: 'whatsapp',
        sentBy: conn?.displayName || 'Sistema',
      },
      include: {
        customer: true,
        template: true,
      },
    })

    return ok({
      whatsappUrl,
      message,
      messageRecord,
      phone,
      connected: conn?.status === 'connected',
      businessName: conn?.businessName || tallerName,
    })
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al enviar factura por WhatsApp', e)
  }
}
