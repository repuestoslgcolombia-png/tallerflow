import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

// PATCH /api/whatsapp/automations/[id] - actualizar una regla
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const body = await req.json()

    const existing = await tdb.automationRule.findUnique({ where: { id } })
    if (!existing) return notFound('Automatización no encontrada')

    if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
      return badRequest('El campo enabled debe ser booleano')
    }
    if (body.delayMinutes !== undefined && (Number(body.delayMinutes) < 0 || isNaN(Number(body.delayMinutes)))) {
      return badRequest('El retraso debe ser un número positivo')
    }
    if (body.daysOffset !== undefined && body.daysOffset !== null && Number(body.daysOffset) < 1) {
      return badRequest('Los días deben ser al menos 1')
    }

    // Si cambia la plantilla, validar que exista y esté activa
    if (body.templateCode !== undefined && body.templateCode !== null) {
      const template = await tdb.whatsAppTemplate.findFirst({ where: { code: body.templateCode } })
      if (!template) return badRequest(`Plantilla no encontrada: ${body.templateCode}`)
    }

    const rule = await tdb.automationRule.update({
      where: { id },
      data: {
        enabled: body.enabled !== undefined ? body.enabled : undefined,
        templateCode: body.templateCode !== undefined ? body.templateCode : undefined,
        delayMinutes: body.delayMinutes !== undefined ? Number(body.delayMinutes) : undefined,
        daysOffset:
          body.daysOffset !== undefined ? (body.daysOffset === null ? null : Number(body.daysOffset)) : undefined,
      },
    })

    return ok(rule)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al actualizar automatización', e)
  }
}
