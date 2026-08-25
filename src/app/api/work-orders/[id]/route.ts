import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'
import { WORK_ORDER_STATUS, getNextStatuses, WorkOrderStatusKey, REMINDER_TYPES } from '@/lib/constants'
import { runTrigger } from '@/lib/automations'

// Crea recordatorios de entrega (mantenimiento, referencia, etc.) con dedupe por orden+tipo
async function createDeliveryReminders(
  tx: Prisma.TransactionClient,
  workOrderId: string,
  customerId: string,
  reminders: Array<{ type?: string; daysAfter?: number; channel?: string }>
) {
  const wo = await tx.workOrder.findUnique({
    where: { id: workOrderId },
    include: { customer: true, device: true },
  })
  if (!wo) return

  const customerName = wo.customer ? `${wo.customer.firstName} ${wo.customer.lastName}` : ''
  const equipo = wo.device ? `${wo.device.brand} ${wo.device.model}`.trim() : 'equipo'

  for (const r of reminders) {
    const type = r?.type && REMINDER_TYPES[r.type as keyof typeof REMINDER_TYPES] ? r.type : null
    if (!type) continue

    const days = typeof r.daysAfter === 'number' && r.daysAfter >= 0
      ? r.daysAfter
      : REMINDER_TYPES[type as keyof typeof REMINDER_TYPES].defaultDays

    // Dedupe: no duplicar si ya existe un recordatorio del mismo tipo para esta orden
    const existingReminder = await tx.reminder.findFirst({
      where: { workOrderId, type },
    })
    if (existingReminder) continue

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + days)

    const titles: Record<string, string> = {
      maintenance: `Próximo mantenimiento - ${customerName}`,
      service_review: `Solicitud de reseña - ${customerName}`,
      follow_up: `Seguimiento postservicio - ${customerName}`,
      warranty_check: `Verificar garantía - ${customerName}`,
    }

    const messages: Record<string, string> = {
      maintenance: `Recordar próximo mantenimiento de ${equipo} (${wo.code}) a ${customerName}.`,
      service_review: `Solicitar referencia/reseña del servicio a ${customerName} (${wo.code}, ${equipo}).`,
      follow_up: `Contactar a ${customerName} para seguimiento de ${equipo} (${wo.code}).`,
      warranty_check: `Verificar garantía de ${equipo} (${wo.code}) de ${customerName}.`,
    }

    await tx.reminder.create({
      data: {
        customerId,
        workOrderId,
        type,
        title: titles[type] || REMINDER_TYPES[type as keyof typeof REMINDER_TYPES].label,
        message: messages[type] || null,
        dueDate,
        channel: r.channel || 'whatsapp',
        status: 'pending',
        priority: 'normal',
        daysAfter: days,
      },
    })
  }
}

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
      const currentKey = existing.status as WorkOrderStatusKey
      // Flujo según tipo de servicio (mantenimiento/instalación usan flujo corto)
      const allowed = getNextStatuses(currentKey, existing.serviceType)
      if (newStatus !== currentKey && !allowed.includes(newStatus)) {
        return badRequest(
          `Transición inválida: de "${WORK_ORDER_STATUS[currentKey]?.label || currentKey}" solo se puede pasar a ${allowed.map((s) => `"${WORK_ORDER_STATUS[s].label}"`).join(', ') || 'ningún estado'}`
        )
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

        // Recordatorios explícitos solicitados desde la UI al entregar
        if (newStatus === 'delivered' && Array.isArray(body.reminders)) {
          await createDeliveryReminders(tx, id, existing.customerId, body.reminders)
        }

        return wo
      })

      if (['ready', 'delivered'].includes(newStatus)) {
        await runTrigger(newStatus === 'ready' ? 'order_ready' : 'order_delivered', {
          workOrderId: id,
          // Si la UI ya creó los recordatorios, no duplicar con las reglas automáticas
          skipAutoReminders: newStatus === 'delivered' && body.skipAutoReminders === true,
        })
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
