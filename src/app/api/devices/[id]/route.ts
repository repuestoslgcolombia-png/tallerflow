import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const device = await db.device.findUnique({
      where: { id },
      include: {
        customer: true,
        workOrders: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!device) return notFound('Equipo no encontrado')
    return ok(device)
  } catch (e) {
    return serverError('Error al obtener equipo', e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    if (!body.type) return badRequest('Tipo de equipo es obligatorio')

    const device = await db.device.update({
      where: { id },
      data: {
        customerId: body.customerId,
        type: body.type,
        brand: body.brand || null,
        model: body.model || null,
        serial: body.serial || null,
        accessories: body.accessories || null,
        notes: body.notes || null,
      },
      include: { customer: true, _count: { select: { workOrders: true } } },
    })

    return ok(device)
  } catch (e) {
    return serverError('Error al actualizar equipo', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.device.findUnique({ where: { id } })
    if (!existing) return notFound('Equipo no encontrado')

    const workOrders = await db.workOrder.count({ where: { deviceId: id } })
    if (workOrders > 0) {
      return badRequest(`No se puede eliminar: el equipo tiene ${workOrders} orden(es)`)
    }

    await db.device.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError('Error al eliminar equipo', e)
  }
}
