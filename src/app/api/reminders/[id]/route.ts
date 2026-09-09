import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const reminder = await tdb.reminder.findUnique({
      where: { id },
      include: {
        customer: true,
        workOrder: { include: { device: true } },
      },
    })
    if (!reminder) return notFound('Recordatorio no encontrado')
    return ok(reminder)
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Recordatorio no encontrado')
    }
    return serverError('Error al obtener recordatorio', e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const body = await req.json()

    const existing = await tdb.reminder.findUnique({ where: { id } })
    if (!existing) return notFound('Recordatorio no encontrado')

    // Acción: marcar como completado
    if (body.action === 'complete') {
      const reminder = await tdb.reminder.update({
        where: { id },
        data: {
          status: 'done',
          completedAt: new Date(),
          completedBy: body.completedBy || 'Sistema',
          completionNotes: body.completionNotes || null,
        },
        include: { customer: true, workOrder: { include: { device: true } } },
      })
      return ok(reminder)
    }

    // Acción: posponer
    if (body.action === 'snooze') {
      if (!body.snoozeUntil) return badRequest('Fecha de posposición requerida')
      const reminder = await tdb.reminder.update({
        where: { id },
        data: {
          status: 'snoozed',
          snoozedUntil: new Date(body.snoozeUntil),
        },
        include: { customer: true, workOrder: { include: { device: true } } },
      })
      return ok(reminder)
    }

    // Acción: cancelar
    if (body.action === 'cancel') {
      const reminder = await tdb.reminder.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { customer: true, workOrder: { include: { device: true } } },
      })
      return ok(reminder)
    }

    // Acción: reactivar (de snoozed/cancelled a pending)
    if (body.action === 'reactivate') {
      const reminder = await tdb.reminder.update({
        where: { id },
        data: {
          status: 'pending',
          snoozedUntil: null,
        },
        include: { customer: true, workOrder: { include: { device: true } } },
      })
      return ok(reminder)
    }

    // Actualización normal de campos
    const reminder = await tdb.reminder.update({
      where: { id },
      data: {
        title: body.title || undefined,
        message: body.message !== undefined ? body.message : undefined,
        type: body.type || undefined,
        channel: body.channel || undefined,
        priority: body.priority || undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        workOrderId: body.workOrderId !== undefined ? body.workOrderId : undefined,
      },
      include: { customer: true, workOrder: { include: { device: true } } },
    })
    return ok(reminder)
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Recordatorio no encontrado')
    }
    return serverError('Error al actualizar recordatorio', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const existing = await tdb.reminder.findUnique({ where: { id } })
    if (!existing) return notFound('Recordatorio no encontrado')

    await tdb.reminder.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Recordatorio no encontrado')
    }
    return serverError('Error al eliminar recordatorio', e)
  }
}
