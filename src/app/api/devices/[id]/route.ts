import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const device = await tdb.device.findUnique({
      where: { id },
      include: {
        customer: true,
        workOrders: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!device) return notFound('Equipo no encontrado')
    return ok(device)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al obtener equipo', e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const body = await req.json()

    if (!body.type) return badRequest('Tipo de equipo es obligatorio')

    const device = await tdb.device.update({
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
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al actualizar equipo', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const existing = await tdb.device.findUnique({ where: { id } })
    if (!existing) return notFound('Equipo no encontrado')

    const workOrders = await tdb.workOrder.count({ where: { deviceId: id } })
    if (workOrders > 0) {
      return badRequest(`No se puede eliminar: el equipo tiene ${workOrders} orden(es)`)
    }

    await tdb.device.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al eliminar equipo', e)
  }
}
