import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, created } from '@/lib/api'

// GET /api/devices
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search') || ''

    const devices = await tdb.device.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(search
          ? {
              OR: [
                { brand: { contains: search } },
                { model: { contains: search } },
                { serial: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        _count: { select: { workOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(devices)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al listar equipos', e)
  }
}

// POST /api/devices
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()

    if (!body.customerId) return badRequest('Cliente es obligatorio')
    if (!body.type) return badRequest('Tipo de equipo es obligatorio')

    const device = await tdb.device.create({
      data: {
        customerId: body.customerId,
        type: body.type,
        brand: body.brand || null,
        model: body.model || null,
        serial: body.serial || null,
        accessories: body.accessories || null,
        notes: body.notes || null,
      } as any,
      include: { customer: true, _count: { select: { workOrders: true } } },
    })

    return created(device)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al crear equipo', e)
  }
}
