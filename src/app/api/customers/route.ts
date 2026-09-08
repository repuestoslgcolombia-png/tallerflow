import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, created } from '@/lib/api'

// GET /api/customers - listar clientes (con búsqueda opcional)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const customers = await tdb.customer.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
              { documentId: { contains: search } },
            ],
          }
        : {},
      include: {
        _count: { select: { devices: true, workOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(customers)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al listar clientes', e)
  }
}

// POST /api/customers - crear cliente
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()

    if (!body.firstName || !body.lastName) {
      return badRequest('Nombre y apellido son obligatorios')
    }

    const customer = await tdb.customer.create({
      data: {
        // tenantId lo inyecta dbFor() en runtime (RequiredField omite el check de tipos)
        firstName: body.firstName,
        lastName: body.lastName,
        documentId: body.documentId || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
      } as any,
      include: { _count: { select: { devices: true, workOrders: true } } },
    })

    return created(customer)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al crear cliente', e)
  }
}
