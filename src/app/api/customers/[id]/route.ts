import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

// GET /api/customers/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        devices: { orderBy: { createdAt: 'desc' } },
        workOrders: {
          include: { device: true },
          orderBy: { createdAt: 'desc' },
        },
        invoices: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!customer) return notFound('Cliente no encontrado')
    return ok(customer)
  } catch (e) {
    return serverError('Error al obtener cliente', e)
  }
}

// PUT /api/customers/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    if (!body.firstName || !body.lastName) {
      return badRequest('Nombre y apellido son obligatorios')
    }

    const customer = await db.customer.update({
      where: { id },
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

    return ok(customer)
  } catch (e) {
    return serverError('Error al actualizar cliente', e)
  }
}

// DELETE /api/customers/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.customer.findUnique({ where: { id } })
    if (!existing) return notFound('Cliente no encontrado')

    // Verificar si tiene órdenes - no eliminar si tiene
    const workOrders = await db.workOrder.count({ where: { customerId: id } })
    if (workOrders > 0) {
      return badRequest(`No se puede eliminar: el cliente tiene ${workOrders} orden(es) de trabajo`)
    }

    await db.customer.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError('Error al eliminar cliente', e)
  }
}
