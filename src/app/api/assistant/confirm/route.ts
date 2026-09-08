import { NextRequest } from 'next/server'
import { consumePendingAction } from '@/lib/assistant/pending'
import { executeAction } from '@/lib/assistant/executor'
import { badRequest, notFound, serverError, ok } from '@/lib/api'
import { requireTenantSession, TenantSessionError } from '@/lib/tenant'

export async function POST(req: NextRequest) {
  try {
    // La sesión resuelve el taller: TODAS las acciones de Hermes quedan
    // dentro del taller del usuario autenticado
    const session = await requireTenantSession()

    const body = await req.json()
    if (!body?.pendingId) return badRequest('Falta el identificador de la acción pendiente.')

    const pending = await consumePendingAction(String(body.pendingId))
    if (!pending) {
      return notFound(
        'La acción pendiente expiró o ya fue procesada. Pídele al asistente que repita la acción.'
      )
    }

    try {
      const result = await executeAction(pending.action, pending.args, session.tenantId)
      return ok(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo ejecutar la acción.'
      return ok({ ok: false, error: msg, action: pending.action })
    }
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al confirmar la acción', e)
  }
}
