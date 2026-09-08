import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'
import { ensureDefaultRules, TRIGGER_LABELS, ACTION_LABELS } from '@/lib/automations'

// GET /api/whatsapp/automations - listar reglas de automatización (con seed inicial)
export async function GET(_req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    await ensureDefaultRules(session.tenantId)

    const rules = await tdb.automationRule.findMany({
      orderBy: [{ trigger: 'asc' }, { action: 'asc' }],
    })

    return ok(
      rules.map((rule) => ({
        ...rule,
        triggerLabel: TRIGGER_LABELS[rule.trigger] || rule.trigger,
        actionLabel: ACTION_LABELS[rule.action] || rule.action,
      }))
    )
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al listar automatizaciones', e)
  }
}

// POST /api/whatsapp/automations - acciones: test
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()
    const { action } = body

    if (action === 'test') {
      const { ruleId, phone } = body
      if (!phone) return badRequest('Teléfono es obligatorio para la prueba')

      const rule = await tdb.automationRule.findUnique({ where: { id: ruleId } })
      if (!rule) return notFound('Automatización no encontrada')
      if (!rule.templateCode) return badRequest('Esta automatización no tiene plantilla configurada')

      const template = await tdb.whatsAppTemplate.findFirst({ where: { code: rule.templateCode } })
      if (!template) return notFound('Plantilla no encontrada')

      const cleanPhone = String(phone).replace(/[^0-9]/g, '')
      const message = template.body
        .replace(/\{cliente\}/g, 'Cliente de Prueba')
        .replace(/\{equipo\}/g, 'Lavadora LG Test')
        .replace(/\{codigo\}/g, 'OT-TEST-001')
        .replace(/\{total\}/g, '$100.000')
        .replace(/\{fecha\}/g, new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }))
        .replace(/\{taller\}/g, 'TallerTech Pro')
        .replace(/\{telefono\}/g, phone)

      const waMeUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

      await db.whatsAppMessage.create({
        data: {
          toPhone: cleanPhone,
          toName: 'Cliente de Prueba',
          message,
          status: 'sent',
          channel: 'whatsapp',
          sentBy: 'Prueba',
        },
      })

      await db.automationLog.create({
        data: {
          ruleId: rule.id,
          trigger: `${rule.trigger} (prueba)`,
          phone: cleanPhone,
          message,
          status: 'sent',
        },
      })

      return ok({ sent: true, waMeUrl, message })
    }

    return badRequest(`Acción no soportada: ${action}`)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error en automatización', e)
  }
}
