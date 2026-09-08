import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

// POST /api/whatsapp/render - renderizar una plantilla con variables
// Body: { templateCode, customerId, workOrderId?, customVars? }
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()

    if (!body.templateCode) return badRequest('Código de plantilla es obligatorio')

    // unique compuesto tenantId_code: findFirst plano (la extensión filtra tenant)
    const template = await tdb.whatsAppTemplate.findFirst({
      where: { code: body.templateCode },
    })
    if (!template) return notFound('Plantilla no encontrada')

    // Recopilar variables
    const vars: Record<string, string> = {
      cliente: '',
      equipo: '',
      codigo: '',
      total: '',
      fecha: '',
      taller: 'TallerTech Pro',
      telefono: '',
      ...body.customVars,
    }

    if (body.customerId) {
      const customer = await tdb.customer.findUnique({ where: { id: body.customerId } })
      if (customer) {
        vars.cliente = `${customer.firstName} ${customer.lastName}`
        vars.telefono = customer.phone || ''
      }
    }

    if (body.workOrderId) {
      const wo = await tdb.workOrder.findUnique({
        where: { id: body.workOrderId },
        include: { device: true, quotes: { where: { status: 'approved' }, take: 1 } },
      })
      if (wo) {
        vars.codigo = wo.code
        vars.equipo = wo.device ? `${wo.device.brand} ${wo.device.model}`.trim() : ''
        vars.total = wo.totalAmount > 0 ? `$${new Intl.NumberFormat('es-CO').format(wo.totalAmount)}` : ''
        vars.fecha = wo.estimatedDoneAt
          ? new Date(wo.estimatedDoneAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
          : ''
      }
    }

    // Reemplazar variables {variable} en el body
    let rendered = template.body
    for (const [key, value] of Object.entries(vars)) {
      rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    }

    return ok({
      template,
      rendered,
      variables: vars,
    })
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al renderizar plantilla', e)
  }
}
