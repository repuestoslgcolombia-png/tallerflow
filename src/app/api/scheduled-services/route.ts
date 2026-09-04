import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/api'

// GET /api/scheduled-services - consolida visitas técnicas y mantenimientos programados
export async function GET(_req: NextRequest) {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)
    const endOfWeek = new Date(startOfToday)
    endOfWeek.setDate(endOfWeek.getDate() + 7)
    const overdueWindow = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 1) Visitas técnicas programadas (órdenes activas con fecha de visita)
    const visits = await db.workOrder.findMany({
      where: {
        scheduledVisitAt: { not: null },
        status: { in: ['received', 'diagnosing', 'quoted', 'approved', 'in_progress', 'ready'] },
      },
      include: { customer: true, device: true, technician: true },
      orderBy: { scheduledVisitAt: 'asc' },
    })

    // 2) Mantenimientos / garantías programados (recordatorios pendientes)
    const reminders = await db.reminder.findMany({
      where: {
        status: 'pending',
        type: { in: ['maintenance', 'warranty_check'] },
        dueDate: { gte: overdueWindow },
      },
      include: { customer: true, workOrder: { include: { device: true } } },
      orderBy: { dueDate: 'asc' },
    })

    function daysTo(date: Date): number {
      const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return Math.round((target.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000))
    }

    function classify(date: Date): string {
      const d = daysTo(date)
      if (d < 0) return 'overdue'
      if (d === 0) return 'today'
      if (d === 1) return 'tomorrow'
      if (d <= 7) return 'this_week'
      return 'later'
    }

    const items = [
      ...visits.map((v) => ({
        id: v.id,
        kind: 'visit',
        date: v.scheduledVisitAt,
        daysTo: daysTo(v.scheduledVisitAt!),
        customer: { firstName: v.customer.firstName, lastName: v.customer.lastName },
        device: v.device ? `${v.device?.brand || ''} ${v.device?.model || ''}`.trim() : null,
        deviceType: v.device?.type || null,
        code: v.code,
        technician: v.technician?.name || null,
        status: v.status,
        priority: v.priority,
        typeLabel: 'Visita técnica',
        alert: classify(v.scheduledVisitAt!),
      })),
      ...reminders.map((r) => ({
        id: r.id,
        kind: 'maintenance',
        date: r.dueDate,
        daysTo: daysTo(r.dueDate),
        customer: { firstName: r.customer.firstName, lastName: r.customer.lastName },
        device: r.workOrder?.device
          ? `${r.workOrder.device.brand || ''} ${r.workOrder.device.model || ''}`.trim()
          : null,
        deviceType: r.workOrder?.device?.type || null,
        code: r.workOrder?.code || null,
        workOrderId: r.workOrderId,
        type: r.type,
        typeLabel: r.type === 'maintenance' ? 'Mantenimiento' : 'Garantía',
        title: r.title,
        alert: classify(r.dueDate),
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const stats = {
      overdue: items.filter((i) => i.alert === 'overdue').length,
      today: items.filter((i) => i.alert === 'today').length,
      thisWeek: items.filter((i) => ['today', 'tomorrow', 'this_week'].includes(i.alert)).length,
      upcoming: items.filter((i) => i.alert === 'later').length,
    }

    return ok({ items, stats })
  } catch (e) {
    return serverError('Error al obtener servicios programados', e)
  }
}
