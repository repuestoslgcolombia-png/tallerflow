import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError } from '@/lib/api'

// Helper: settings del taller (1 por tenant, id cuid — ya no existe 'default')
async function getOrCreateSettings(tdb: any) {
  let settings = await tdb.workshopSetting.findFirst()
  if (!settings) {
    // tenantId lo inyecta dbFor() en runtime
    settings = await tdb.workshopSetting.create({ data: {} as any })
  }
  return settings
}

// GET /api/settings - obtener configuración del taller
export async function GET(_req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const settings = await getOrCreateSettings(tdb)
    return ok(settings)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al obtener configuración', e)
  }
}

// PUT /api/settings - actualizar configuración
export async function PUT(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()

    if (body.taxRate !== undefined && (Number(body.taxRate) < 0 || Number(body.taxRate) > 100)) {
      return badRequest('La tasa de impuesto debe estar entre 0 y 100')
    }

    const settings = await getOrCreateSettings(tdb)

    const updated = await tdb.workshopSetting.update({
      where: { id: settings.id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        email: body.email !== undefined ? body.email : undefined,
        address: body.address !== undefined ? body.address : undefined,
        taxRate: body.taxRate !== undefined ? Number(body.taxRate) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        currencySymbol: body.currencySymbol !== undefined ? body.currencySymbol : undefined,
        logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
        warrantyPolicy: body.warrantyPolicy !== undefined ? body.warrantyPolicy : undefined,
      },
    })

    return ok(updated)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al actualizar configuración', e)
  }
}
