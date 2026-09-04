import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/api'
import { sweepDueReminders } from '@/lib/automations'
import { ensureAccountingPeriods, daysToMonthEnd } from '@/lib/accounting'

export async function GET(_req: NextRequest) {
  try {
    // "Cron" ligero: al abrir la app se envían los WhatsApp de recordatorios vencidos
    await sweepDueReminders()
    // Cierre/rollover de contabilidad mensual (meses vencidos → closed, mes actual → open)
    const accounting = await ensureAccountingPeriods()

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const [
      workOrdersTodayRaw,
      remindersToday,
      overdueReminders,
      ordersReady,
      lowStockParts,
      pendingQuotes,
      pendingInvoices,
      overdueInvoices,
      dailyTasks,
      completedToday,
      workshopFlowRaw,
      scheduledVisitsRaw,
    ] = await Promise.all([
      db.workOrder.findMany({
        where: {
          OR: [
            { createdAt: { gte: startOfToday, lt: endOfToday } },
            { scheduledVisitAt: { gte: startOfToday, lt: endOfToday } },
          ],
        },
        include: { customer: true, device: true, technician: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.reminder.findMany({
        where: { status: 'pending', dueDate: { gte: startOfToday, lt: endOfToday } },
        include: { customer: true, workOrder: { include: { device: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      db.reminder.findMany({
        where: { status: 'pending', dueDate: { lt: startOfToday } },
        include: { customer: true, workOrder: { include: { device: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      db.workOrder.findMany({
        where: { status: 'ready' },
        include: { customer: true, device: true },
        orderBy: { updatedAt: 'desc' },
      }),
      db.part.findMany({
        where: { active: true, stock: { lte: 0 } },
        orderBy: { name: 'asc' },
      }),
      db.quote.findMany({
        where: { status: 'sent' },
        include: { workOrder: { include: { customer: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.invoice.findMany({
        where: { status: 'pending' },
        include: { customer: true, workOrder: true },
        orderBy: { issuedAt: 'desc' },
      }),
      db.invoice.findMany({
        where: {
          OR: [
            { status: 'pending', issuedAt: { lt: startOfToday } },
            { status: 'partial', issuedAt: { lt: startOfToday } },
          ],
        },
        include: { customer: true, workOrder: true },
        orderBy: { issuedAt: 'asc' },
      }),
      db.dailyTask.findMany({
        where: { taskDate: { gte: startOfToday, lt: endOfToday } },
        include: { assignee: true },
        orderBy: [{ isCompleted: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      db.workOrder.findMany({
        where: { deliveredAt: { gte: startOfToday, lt: endOfToday } },
        include: { customer: true, device: true, technician: true },
        orderBy: { deliveredAt: 'desc' },
      }),
      db.workOrder.groupBy({
        by: ['status'],
        _count: true,
        where: { status: { notIn: ['delivered', 'cancelled'] } },
      }),
      db.workOrder.findMany({
        where: {
          scheduledVisitAt: {
            gte: startOfToday,
            lt: new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { in: ['received', 'diagnosing', 'quoted', 'approved', 'in_progress', 'ready'] },
        },
        include: { customer: true, device: true, technician: true },
        orderBy: { scheduledVisitAt: 'asc' },
        take: 10,
      }),
    ])

    // Marcar el origen de cada orden del día: recibida hoy o visita programada hoy
    const workOrdersToday = workOrdersTodayRaw.map((wo) => ({
      ...wo,
      isScheduledVisit:
        !!wo.scheduledVisitAt &&
        wo.scheduledVisitAt >= startOfToday &&
        wo.scheduledVisitAt < endOfToday &&
        wo.createdAt < startOfToday,
    }))

    const workshopFlow = workshopFlowRaw.map((g) => ({ status: g.status, count: g._count }))

    const urgentOrders = await db.workOrder.count({
      where: {
        priority: 'urgent',
        status: { in: ['received', 'diagnosing', 'approved', 'in_progress'] },
      },
    })

    const partsNearMinStock = await db.part.findMany({
      where: { active: true },
    })
    const nearMinStock = partsNearMinStock.filter((p) => p.stock > 0 && p.stock <= p.minStock)

    const scheduledVisits = scheduledVisitsRaw.map((wo) => ({
      id: wo.id,
      code: wo.code,
      scheduledVisitAt: wo.scheduledVisitAt,
      status: wo.status,
      priority: wo.priority,
      customer: wo.customer,
      device: wo.device,
      technician: wo.technician,
    }))

    return ok({
      workOrdersToday,
      completedToday,
      workshopFlow,
      remindersToday,
      overdueReminders,
      ordersReady,
      lowStockParts: lowStockParts.map((p) => ({
        id: p.id, name: p.name, sku: p.sku, stock: p.stock, minStock: p.minStock, category: p.category,
      })),
      nearMinStock: nearMinStock.map((p) => ({
        id: p.id, name: p.name, sku: p.sku, stock: p.stock, minStock: p.minStock, category: p.category,
      })),
      pendingQuotes: pendingQuotes.map((q) => ({
        id: q.id, code: q.code, total: q.total, customer: q.workOrder.customer,
      })),
      pendingInvoices: pendingInvoices.map((i) => ({
        id: i.id, code: i.code, total: i.total, paid: i.paid, customer: i.customer,
      })),
      overdueInvoices: overdueInvoices.map((i) => ({
        id: i.id, code: i.code, total: i.total, paid: i.paid, customer: i.customer, status: i.status,
      })),
      dailyTasks,
      urgentOrders,
      stats: {
        workOrdersToday: workOrdersToday.length,
        completedToday: completedToday.length,
        activeWorkshopOrders: workshopFlow.reduce((s: number, g) => s + g.count, 0),
        workshopFlow,
        remindersToday: remindersToday.length,
        overdueReminders: overdueReminders.length,
        ordersReady: ordersReady.length,
        lowStock: lowStockParts.length,
        nearMinStock: nearMinStock.length,
        pendingQuotes: pendingQuotes.length,
        pendingInvoices: pendingInvoices.length,
        overdueInvoices: overdueInvoices.length,
        dailyTasksTotal: dailyTasks.length,
        dailyTasksDone: dailyTasks.filter((t) => t.isCompleted).length,
        urgentOrders,
      },
      scheduledVisits,
      accounting: {
        year: accounting.year,
        month: accounting.month,
        invoiced: accounting.invoiced,
        collected: accounting.collected,
        outstanding: accounting.outstanding,
        expenses: accounting.expenses,
        profit: accounting.profit,
        status: accounting.status,
        daysToClose: daysToMonthEnd(),
      },
      date: startOfToday.toISOString(),
    })
  } catch (e) {
    return serverError('Error al obtener agenda diaria', e)
  }
}
