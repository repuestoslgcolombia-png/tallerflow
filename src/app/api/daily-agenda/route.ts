import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/api'
import { sweepDueReminders } from '@/lib/automations'

export async function GET(_req: NextRequest) {
  try {
    // "Cron" ligero: al abrir la app se envían los WhatsApp de recordatorios vencidos
    await sweepDueReminders()

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const [
      workOrdersToday,
      remindersToday,
      overdueReminders,
      ordersReady,
      lowStockParts,
      pendingQuotes,
      pendingInvoices,
      overdueInvoices,
      dailyTasks,
    ] = await Promise.all([
      db.workOrder.findMany({
        where: { createdAt: { gte: startOfToday, lt: endOfToday } },
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
    ])

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

    return ok({
      workOrdersToday,
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
      date: startOfToday.toISOString(),
    })
  } catch (e) {
    return serverError('Error al obtener agenda diaria', e)
  }
}
