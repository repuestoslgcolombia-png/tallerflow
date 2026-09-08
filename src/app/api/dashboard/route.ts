import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, serverError } from '@/lib/api'
import { WORK_ORDER_STATUS } from '@/lib/constants'

// GET /api/dashboard - métricas para el dashboard
export async function GET(_req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)

    // Conteos por estado
    const statusCounts = await tdb.workOrder.groupBy({
      by: ['status'],
      _count: { _all: true },
    })

    const statusMap: Record<string, number> = {}
    statusCounts.forEach((s) => (statusMap[s.status] = s._count._all))

    // Totales
    const totalCustomers = await tdb.customer.count()
    const totalDevices = await tdb.device.count()
    const totalWorkOrders = await tdb.workOrder.count()
    const totalParts = await tdb.part.count({ where: { active: true } })

    // Ingresos del mes (facturas pagadas)
    const paidInvoices = await tdb.invoice.findMany({
      where: {
        status: 'paid',
        paidAt: { gte: startOfMonth },
      },
      select: { total: true, paid: true },
    })
    const monthRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0)

    // Valor pendiente por aprobar (cotizaciones enviadas)
    const pendingQuotes = await tdb.quote.findMany({
      where: { status: 'sent' },
      select: { total: true },
    })
    const pendingQuoteValue = pendingQuotes.reduce((sum, q) => sum + q.total, 0)

    // Valor en proceso (órdenes activas)
    const activeOrders = await tdb.workOrder.findMany({
      where: {
        status: { in: ['received', 'diagnosing', 'quoted', 'approved', 'in_progress', 'ready'] },
      },
      select: { totalAmount: true },
    })
    const activeOrdersValue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // Repuestos con stock bajo
    const lowStockParts = await tdb.part.findMany({
      where: { active: true, stock: { lte: 0 } },
    })
    const partsNearMinStock = await tdb.part.findMany({
      where: { active: true },
    })
    const lowStock = partsNearMinStock.filter((p) => p.stock <= p.minStock)

    // Órdenes recientes (últimas 5)
    const recentOrders = await tdb.workOrder.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        device: true,
        technician: true,
      },
    })

    // Distribución por prioridad
    const priorityCounts = await tdb.workOrder.groupBy({
      by: ['priority'],
      _count: { _all: true },
    })
    const priorityMap: Record<string, number> = {}
    priorityCounts.forEach((p) => (priorityMap[p.priority] = p._count._all))

    // Técnicos con carga de trabajo
    const technicianWorkloads = await tdb.user.findMany({
      where: { role: 'technician', active: true },
      include: {
        workOrders: {
          where: {
            status: { in: ['diagnosing', 'approved', 'in_progress'] },
          },
          select: { id: true, status: true },
        },
      },
    })
    const techLoad = technicianWorkloads.map((t) => ({
      id: t.id,
      name: t.name,
      activeOrders: t.workOrders.length,
    }))

    // Tasa de aprobación de cotizaciones (últimos 30 días)
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const quotes30 = await tdb.quote.findMany({
      where: { createdAt: { gte: last30 } },
      select: { status: true },
    })
    const approvedCount = quotes30.filter((q) => q.status === 'approved').length
    const quoteApprovalRate = quotes30.length > 0 ? (approvedCount / quotes30.length) * 100 : 0

    // Datos para gráfico de órdenes por día (últimos 14 días)
    const days: { date: string; label: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      day.setHours(0, 0, 0, 0)
      const next = new Date(day)
      next.setDate(day.getDate() + 1)

      const count = await tdb.workOrder.count({
        where: { createdAt: { gte: day, lt: next } },
      })

      days.push({
        date: day.toISOString(),
        label: day.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
        count,
      })
    }

    // Status labels
    const statusLabels = Object.entries(WORK_ORDER_STATUS).map(([key, val]) => ({
      key,
      label: val.label,
      color: val.dot,
      count: statusMap[key] || 0,
    }))

    // ============== RECORDATORIOS ==============
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const remindersToday = await tdb.reminder.findMany({
      where: {
        status: 'pending',
        dueDate: { gte: startOfToday, lt: endOfToday },
      },
      include: {
        customer: true,
        workOrder: { include: { device: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    const overdueReminders = await tdb.reminder.count({
      where: {
        status: 'pending',
        dueDate: { lt: startOfToday },
      },
    })

    const pendingRemindersCount = await tdb.reminder.count({
      where: { status: 'pending' },
    })

    return ok({
      totals: {
        customers: totalCustomers,
        devices: totalDevices,
        workOrders: totalWorkOrders,
        parts: totalParts,
        monthRevenue,
        pendingQuoteValue,
        activeOrdersValue,
        quoteApprovalRate: Math.round(quoteApprovalRate),
        pendingReminders: pendingRemindersCount,
        overdueReminders,
      },
      statusDistribution: statusLabels,
      priorityDistribution: priorityMap,
      recentOrders,
      lowStockParts: lowStock.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
        category: p.category,
      })),
      technicianWorkloads: techLoad,
      ordersTimeline: days,
      remindersToday,
    })
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return new Response(JSON.stringify({ error: e.message }), { status: 401 })
    }
    return serverError('Error al obtener dashboard', e)
  }
}
