import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, created, notFound } from '@/lib/api'

// GET /api/whatsapp/messages - listar mensajes enviados
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    const workOrderId = searchParams.get('workOrderId')
    const limit = Number(searchParams.get('limit')) || 50

    const messages = await db.whatsAppMessage.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(workOrderId ? { workOrderId } : {}),
      },
      include: {
        customer: true,
        workOrder: { include: { device: true } },
        template: true,
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
    })

    return ok(messages)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al listar mensajes', e)
  }
}

// POST /api/whatsapp/messages - registrar envío de mensaje
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()

    if (!body.customerId) return badRequest('Cliente es obligatorio')
    if (!body.message) return badRequest('Mensaje es obligatorio')
    if (!body.toPhone) return badRequest('Teléfono de destino es obligatorio')

    const customer = await tdb.customer.findUnique({ where: { id: body.customerId } })
    if (!customer) return notFound('Cliente no encontrado')

    const message = await db.whatsAppMessage.create({
      data: {
        customerId: body.customerId,
        workOrderId: body.workOrderId || null,
        reminderId: body.reminderId || null,
        templateId: body.templateId || null,
        toPhone: body.toPhone,
        toName: body.toName || `${customer.firstName} ${customer.lastName}`,
        message: body.message,
        status: body.status || 'sent',
        channel: body.channel || 'whatsapp',
        sentBy: body.sentBy || 'Sistema',
      },
      include: {
        customer: true,
        workOrder: { include: { device: true } },
        template: true,
      },
    })

    return created(message)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al registrar mensaje', e)
  }
}
