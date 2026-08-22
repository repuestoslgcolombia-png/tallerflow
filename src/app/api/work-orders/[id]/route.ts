import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'
import { WORK_ORDER_STATUS, WorkOrderStatusKey } from '@/lib/constants'
import { runTrigger } from '@/lib/automations'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const workOrder = await db.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        device: { include: { customer: true } },
        technician: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        quotes: { include: { items: { include: { part: true } } }, orderBy: { createdAt: 'desc' } },
        diagnosis: { include: { author: true } },
        invoice: true,
        partsUsed: { include: { part: true } },
      },
    })
    if (!workOrder) return notFound('Orden no encontrada')
    return ok(workOrder)
  } catch (e) {
    return serverError('Error al obtener orden', e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.workOrder.findUnique({ where: { id } })
    if (!existing) return notFound('Orden no encontrada')

    const workOrder = await db.workOrder.update({
      where: { id },
      data: {
        technicianId: body.technicianId !== undefined ? body.technicianId : undefined,
        priority: body.priority || undefined,
        reportedIssue: body.reportedIssue || undefined,
        diagnosisText: body.diagnosisText !== undefined ? body.diagnosisText : undefined,
        internalNotes: body.internalNotes !== undefined ? body.internalNotes : undefined,
        estimatedDoneAt: body.estimatedDoneAt !== undefined
          ? body.estimatedDoneAt ? new Date(body.estimatedDoneAt) : null
          : undefined,
      },
      include: {
        customer: true,
        device: true,
        technician: true,
      },
    })

    return ok(workOrder)
  } catch (e) {
    return serverError('Error al actualizar orden', e)
  }
}

// Cambiar estado de la orden
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { action, ...rest } = body

    const existing = await db.workOrder.findUnique({ where: { id } })
    if (!existing) return notFound('Orden no encontrada')

    if (action === 'change_status') {
      const newStatus = body.status as WorkOrderStatusKey
      if (!WORK_ORDER_STATUS[newStatus]) {
        return badRequest(`Estado inválido: ${body.status}`)
      }

      const workOrder = await db.$transaction(async (tx) => {
        const wo = await tx.workOrder.update({
          where: { id },
          data: {
            status: newStatus,
            deliveredAt: newStatus === 'delivered' ? new Date() : existing.deliveredAt,
          },
        })

        const statusInfo = WORK_ORDER_STATUS[newStatus]
        await tx.workOrderEvent.create({
          data: {
            workOrderId: id,
            eventType: 'status_change',
            fromStatus: existing.status,
            toStatus: newStatus,
            title: statusInfo.label,
            description: body.note || statusInfo.description,
            createdBy: body.createdBy || 'Sistema',
          },
        })

        return wo
      })

      if (['ready', 'delivered'].includes(newStatus)) {
        await runTrigger(newStatus === 'ready' ? 'order_ready' : 'order_delivered', { workOrderId: id })
      }

      return ok(workOrder)
    }

    if (action === 'add_note') {
      const event = await db.workOrderEvent.create({
        data: {
          workOrderId: id,
          eventType: 'note',
          title: body.title || 'Nota agregada',
          description: body.note,
          createdBy: body.createdBy || 'Sistema',
        },
      })
      return ok(event)
    }

    if (action === 'assign_technician') {
      const workOrder = await db.$transaction(async (tx) => {
        const wo = await tx.workOrder.update({
          where: { id },
          data: { technicianId: body.technicianId || null },
        })
        const tech = body.technicianId
          ? await tx.user.findUnique({ where: { id: body.technicianId } })
          : null
        await tx.workOrderEvent.create({
          data: {
            workOrderId: id,
            eventType: 'assignment',
            title: tech ? 'Técnico asignado' : 'Técnico removido',
            description: tech ? `Asignado a ${tech.name}` : 'Sin técnico asignado',
            createdBy: body.createdBy || 'Sistema',
          },
        })
        return wo
      })
      return ok(workOrder)
    }

    return badRequest(`Acción no soportada: ${action}`)
  } catch (e) {
    return serverError('Error al actualizar orden', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.workOrder.findUnique({ where: { id } })
    if (!existing) return notFound('Orden no encontrada')

    // Solo se pueden eliminar órdenes en estado recibida o cancelada
    if (!['received', 'cancelled'].includes(existing.status)) {
      return badRequest('Solo se pueden eliminar órdenes en estado Recibida o Cancelada')
    }

    await db.workOrder.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError('Error al eliminar orden', e)
  }
}
