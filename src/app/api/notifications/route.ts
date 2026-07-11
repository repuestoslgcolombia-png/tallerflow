import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/api'
import { formatCurrency } from '@/lib/constants'

// GET /api/notifications - consolida notificaciones de todos los módulos
export async function GET(_req: NextRequest) {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const notifications: any[] = []

    // ============== 1. RECORDATORIOS VENCIDOS ==============
    const overdueReminders = await db.reminder.findMany({
      where: {
        status: 'pending',
        dueDate: { lt: startOfToday },
      },
      include: { customer: true, workOrder: { include: { device: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    overdueReminders.forEach((r) => {
      const daysOverdue = Math.floor((startOfToday.getTime() - new Date(r.dueDate).getTime()) / (24 * 60 * 60 * 1000))
      notifications.push({
        id: `reminder-overdue-${r.id}`,
        type: 'reminder_overdue',
        priority: 'high',
        icon: 'AlertTriangle',
        color: 'rose',
        title: `Recordatorio vencido: ${r.title}`,
        description: `${r.customer.firstName} ${r.customer.lastName} · ${daysOverdue}d de retraso`,
        actionLabel: 'Ver recordatorios',
        actionView: 'reminders',
        timestamp: r.dueDate,
        entityId: r.id,
      })
    })

    // ============== 2. RECORDATORIOS DE HOY ==============
    const todayReminders = await db.reminder.findMany({
      where: {
        status: 'pending',
        dueDate: { gte: startOfToday, lt: endOfToday },
      },
      include: { customer: true },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    todayReminders.forEach((r) => {
      notifications.push({
        id: `reminder-today-${r.id}`,
        type: 'reminder_today',
        priority: 'medium',
        icon: 'Bell',
        color: 'amber',
        title: `Hoy: ${r.title}`,
        description: `${r.customer.firstName} ${r.customer.lastName}${r.workOrderId ? ' · OT vinculada' : ''}`,
        actionLabel: 'Ver recordatorios',
        actionView: 'reminders',
        timestamp: r.dueDate,
        entityId: r.id,
      })
    })

    // ============== 3. STOCK BAJO ==============
    const lowStockParts = await db.part.findMany({
      where: {
        active: true,
        stock: { lte: 0 },
      },
      take: 5,
    })

    const nearMinStockParts = await db.part.findMany({
      where: {
        active: true,
        stock: { gt: 0 },
      },
    })
    const lowStock = nearMinStockParts.filter((p) => p.stock <= p.minStock)

    lowStockParts.forEach((p) => {
      notifications.push({
        id: `stock-out-${p.id}`,
        type: 'stock_out',
        priority: 'high',
        icon: 'PackageX',
        color: 'rose',
        title: `Sin stock: ${p.name}`,
        description: `SKU: ${p.sku} · ${p.category || 'Sin categoría'}`,
        actionLabel: 'Ver inventario',
        actionView: 'inventory',
        timestamp: p.updatedAt,
        entityId: p.id,
      })
    })

    lowStock.slice(0, 5).forEach((p) => {
      notifications.push({
        id: `stock-low-${p.id}`,
        type: 'stock_low',
        priority: 'medium',
        icon: 'Package',
        color: 'amber',
        title: `Stock bajo: ${p.name}`,
        description: `Stock: ${p.stock} · Mínimo: ${p.minStock} ${p.unit}`,
        actionLabel: 'Ver inventario',
        actionView: 'inventory',
        timestamp: p.updatedAt,
        entityId: p.id,
      })
    })

    // ============== 4. COTIZACIONES POR APROBAR ==============
    const pendingQuotes = await db.quote.findMany({
      where: { status: 'sent' },
      include: { workOrder: { include: { customer: true, device: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    pendingQuotes.forEach((q) => {
      const daysSinceSent = Math.floor((now.getTime() - new Date(q.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      notifications.push({
        id: `quote-pending-${q.id}`,
        type: 'quote_pending',
        priority: daysSinceSent > 3 ? 'high' : 'medium',
        icon: 'FileClock',
        color: daysSinceSent > 3 ? 'amber' : 'sky',
        title: `Cotización ${q.code} esperando aprobación`,
        description: `${q.workOrder.customer.firstName} ${q.workOrder.customer.lastName} · ${formatCurrency(q.total)} · ${daysSinceSent}d enviada`,
        actionLabel: 'Ver cotizaciones',
        actionView: 'quotes',
        timestamp: q.createdAt,
        entityId: q.id,
      })
    })

    // ============== 5. FACTURAS PENDIENTES DE PAGO ==============
    const pendingInvoices = await db.invoice.findMany({
      where: { status: { in: ['pending', 'partial'] } },
      include: { customer: true, workOrder: true },
      orderBy: { issuedAt: 'asc' },
      take: 5,
    })

    pendingInvoices.forEach((inv) => {
      const balance = inv.total - inv.paid
      const daysSinceIssued = Math.floor((now.getTime() - new Date(inv.issuedAt).getTime()) / (24 * 60 * 60 * 1000))
      notifications.push({
        id: `invoice-pending-${inv.id}`,
        type: 'invoice_pending',
        priority: daysSinceIssued > 7 ? 'high' : 'medium',
        icon: 'Receipt',
        color: daysSinceIssued > 7 ? 'rose' : 'amber',
        title: `Factura ${inv.code} sin cobrar`,
        description: `${inv.customer.firstName} ${inv.customer.lastName} · Saldo: ${formatCurrency(balance)} · ${daysSinceIssued}d`,
        actionLabel: 'Ver facturas',
        actionView: 'invoices',
        timestamp: inv.issuedAt,
        entityId: inv.id,
      })
    })

    // ============== 6. ÓRDENES LISTAS PARA ENTREGA ==============
    const readyOrders = await db.workOrder.findMany({
      where: { status: 'ready' },
      include: { customer: true, device: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    readyOrders.forEach((o) => {
      const daysReady = Math.floor((now.getTime() - new Date(o.updatedAt).getTime()) / (24 * 60 * 60 * 1000))
      notifications.push({
        id: `order-ready-${o.id}`,
        type: 'order_ready',
        priority: daysReady > 3 ? 'high' : 'medium',
        icon: 'CheckCircle2',
        color: daysReady > 3 ? 'amber' : 'emerald',
        title: `Equipo listo para entregar: ${o.code}`,
        description: `${o.customer.firstName} ${o.customer.lastName} · ${o.device?.brand} ${o.device?.model} · ${daysReady}d listo`,
        actionLabel: 'Ver orden',
        actionView: 'work-order-detail',
        actionViewId: o.id,
        timestamp: o.updatedAt,
        entityId: o.id,
      })
    })

    // ============== 7. ÓRDENES URGENTES EN PROCESO ==============
    const urgentOrders = await db.workOrder.findMany({
      where: {
        status: { in: ['received', 'diagnosing', 'in_progress'] },
        priority: 'urgent',
      },
      include: { customer: true, device: true, technician: true },
      orderBy: { createdAt: 'asc' },
      take: 3,
    })

    urgentOrders.forEach((o) => {
      const daysWaiting = Math.floor((now.getTime() - new Date(o.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      notifications.push({
        id: `order-urgent-${o.id}`,
        type: 'order_urgent',
        priority: 'high',
        icon: 'Flame',
        color: 'rose',
        title: `URGENTE: ${o.code}`,
        description: `${o.customer.firstName} ${o.customer.lastName} · ${o.device?.brand} ${o.device?.model} · ${daysWaiting}d en taller`,
        actionLabel: 'Ver orden',
        actionView: 'work-order-detail',
        actionViewId: o.id,
        timestamp: o.createdAt,
        entityId: o.id,
      })
    })

    // ============== 8. RECORDATORIOS PRÓXIMOS (7 días) ==============
    const upcomingReminders = await db.reminder.findMany({
      where: {
        status: 'pending',
        dueDate: { gte: endOfToday, lte: next7Days },
      },
      include: { customer: true },
      orderBy: { dueDate: 'asc' },
      take: 3,
    })

    upcomingReminders.forEach((r) => {
      const daysUntil = Math.floor((new Date(r.dueDate).getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000))
      notifications.push({
        id: `reminder-upcoming-${r.id}`,
        type: 'reminder_upcoming',
        priority: 'low',
        icon: 'CalendarClock',
        color: 'sky',
        title: `Próximo: ${r.title}`,
        description: `${r.customer.firstName} ${r.customer.lastName} · en ${daysUntil}d`,
        actionLabel: 'Ver recordatorios',
        actionView: 'reminders',
        timestamp: r.dueDate,
        entityId: r.id,
      })
    })

    // Ordenar por prioridad y timestamp
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    notifications.sort((a, b) => {
      if (priorityOrder[a.priority as keyof typeof priorityOrder] !== priorityOrder[b.priority as keyof typeof priorityOrder]) {
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Agrupar por tipo para stats
    const stats = {
      total: notifications.length,
      high: notifications.filter((n) => n.priority === 'high').length,
      medium: notifications.filter((n) => n.priority === 'medium').length,
      low: notifications.filter((n) => n.priority === 'low').length,
      byType: {
        reminders: notifications.filter((n) => n.type.startsWith('reminder')).length,
        stock: notifications.filter((n) => n.type.startsWith('stock')).length,
        quotes: notifications.filter((n) => n.type === 'quote_pending').length,
        invoices: notifications.filter((n) => n.type === 'invoice_pending').length,
        orders: notifications.filter((n) => n.type.startsWith('order')).length,
      },
    }

    return ok({ notifications, stats })
  } catch (e) {
    return serverError('Error al obtener notificaciones', e)
  }
}
