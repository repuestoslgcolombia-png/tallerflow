import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, created } from '@/lib/api'

// GET /api/customers - listar clientes (con búsqueda opcional)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const customers = await db.customer.findMany({
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
    return serverError('Error al listar clientes', e)
  }
}

// POST /api/customers - crear cliente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.firstName || !body.lastName) {
      return badRequest('Nombre y apellido son obligatorios')
    }

    const customer = await db.customer.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        documentId: body.documentId || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
      },
      include: { _count: { select: { devices: true, workOrders: true } } },
    })

    return created(customer)
  } catch (e) {
    return serverError('Error al crear cliente', e)
  }
}
