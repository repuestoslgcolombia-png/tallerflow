import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, notFound, serverError } from '@/lib/api'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const body = await req.json()

    const existing = await tdb.dailyTask.findUnique({ where: { id } })
    if (!existing) return notFound('Tarea no encontrada')

    const data: Record<string, unknown> = {}

    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId
    if (body.priority !== undefined) data.priority = body.priority
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
    if (body.taskDate !== undefined) data.taskDate = new Date(body.taskDate)

    if (body.isCompleted !== undefined) {
      data.isCompleted = body.isCompleted
      data.completedAt = body.isCompleted ? new Date() : null
      data.completedBy = body.isCompleted ? (body.completedBy || null) : null
    }

    const task = await tdb.dailyTask.update({
      where: { id },
      data,
      include: { assignee: true },
    })

    return ok(task)
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Tarea no encontrada')
    }
    return serverError('Error al actualizar tarea', e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params

    const existing = await tdb.dailyTask.findUnique({ where: { id } })
    if (!existing) return notFound('Tarea no encontrada')

    await tdb.dailyTask.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Tarea no encontrada')
    }
    return serverError('Error al eliminar tarea', e)
  }
}
