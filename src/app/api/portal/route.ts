import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'
import { randomBytes } from 'crypto'

// GET /api/portal?customerId=xxx - obtener token activo del cliente o crear uno nuevo
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) return badRequest('customerId es obligatorio')

    const customer = await db.customer.findUnique({ where: { id: customerId } })
    if (!customer) return notFound('Cliente no encontrado')

    // Buscar token activo existente o crear uno nuevo
    let portal = await db.portalToken.findFirst({
      where: { customerId, active: true },
    })

    if (!portal) {
      portal = await db.portalToken.create({
        data: {
          customerId,
          token: randomBytes(16).toString('hex'),
          active: true,
        },
      })
    }

    return ok({
      token: portal.token,
      active: portal.active,
      createdAt: portal.createdAt,
      lastAccessAt: portal.lastAccessAt,
    })
  } catch (e) {
    return serverError('Error al obtener portal', e)
  }
}

// POST /api/portal - regenerar token (revoca el anterior)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId } = body

    if (!customerId) return badRequest('customerId es obligatorio')

    const customer = await db.customer.findUnique({ where: { id: customerId } })
    if (!customer) return notFound('Cliente no encontrado')

    // Revocar tokens anteriores
    await db.portalToken.updateMany({
      where: { customerId, active: true },
      data: { active: false },
    })

    // Crear nuevo token
    const portal = await db.portalToken.create({
      data: {
        customerId,
        token: randomBytes(16).toString('hex'),
        active: true,
      },
    })

    return ok({
      token: portal.token,
      message: 'Nuevo link de portal generado. El link anterior quedó invalidado.',
    })
  } catch (e) {
    return serverError('Error al regenerar portal', e)
  }
}
