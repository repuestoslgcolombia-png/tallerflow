'use client'

import {
  ClipboardList,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Package,
  AlertTriangle,
  Wrench,
  ChevronRight,
  Activity,
  Bell,
  BellRing,
  Phone,
  ShieldCheck,
  Star,
  CheckCircle2,
} from 'lucide-react'
import { useDashboard } from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, PriorityBadge } from '@/components/tallerflow/badges'
import {
  formatCurrency,
  timeAgo,
  WORK_ORDER_STATUS,
  REMINDER_TYPES,
  fullName,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

// Icon mapping for reminder types
const REMINDER_TYPE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  follow_up: Phone,
  warranty_check: ShieldCheck,
  service_review: Star,
  maintenance: Wrench,
  custom: Bell,
}

const REMINDER_TYPE_COLOR_MAP: Record<string, string> = {
  follow_up: 'bg-emerald-100 text-emerald-600',
  warranty_check: 'bg-violet-100 text-violet-600',
  service_review: 'bg-amber-100 text-amber-600',
  maintenance: 'bg-orange-100 text-orange-600',
  custom: 'bg-slate-100 text-slate-600',
}

export function DashboardView() {
  const { data, isLoading } = useDashboard()
  const { navigate } = useAppStore()

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const { totals, statusDistribution, recentOrders, lowStockParts, technicianWorkloads, ordersTimeline } = data
  const maxTimeline = Math.max(...ordersTimeline.map((d: any) => d.count), 1)
  const maxTechLoad = Math.max(...technicianWorkloads.map((t: any) => t.activeOrders), 1)

  const kpis = [
    {
      label: 'Órdenes Activas',
      value: totals.workOrders,
      sub: `${statusDistribution.find((s: any) => s.key === 'in_progress')?.count || 0} en reparación`,
      icon: ClipboardList,
      color: 'bg-orange-100 text-orange-600',
      onClick: () => navigate('work-orders'),
    },
    {
      label: 'Ingresos del Mes',
      value: formatCurrency(totals.monthRevenue),
      sub: 'Facturas pagadas',
      icon: DollarSign,
      color: 'bg-emerald-100 text-emerald-600',
      onClick: () => navigate('quotes'),
    },
    {
      label: 'Por Aprobar',
      value: formatCurrency(totals.pendingQuoteValue),
      sub: 'En cotizaciones enviadas',
      icon: Clock,
      color: 'bg-sky-100 text-sky-600',
      onClick: () => navigate('quotes'),
    },
    {
      label: 'Tasa de Aprobación',
      value: `${totals.quoteApprovalRate}%`,
      sub: 'Últimos 30 días',
      icon: TrendingUp,
      color: 'bg-violet-100 text-violet-600',
      onClick: () => navigate('quotes'),
    },
  ]

  const overdueReminders = totals.overdueReminders || 0

  return (
    <div className="space-y-4">
      {/* Overdue reminders alert banner */}
      {overdueReminders > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BellRing className="size-4 text-rose-600" />
            <span>
              Tienes <strong className="font-bold">{overdueReminders}</strong>{' '}
              recordatorio{overdueReminders === 1 ? '' : 's'} vencido{overdueReminders === 1 ? '' : 's'}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 border-rose-300 bg-white text-rose-700 hover:bg-rose-100 hover:text-rose-800"
            onClick={() => navigate('reminders')}
          >
            Ver <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card
              key={kpi.label}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={kpi.onClick}
            >
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="mt-1 truncate text-xl font-bold lg:text-2xl">{kpi.value}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{kpi.sub}</p>
                  </div>
                  <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', kpi.color)}>
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Orders timeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4 text-muted-foreground" />
                Órdenes Recibidas
              </CardTitle>
              <Badge variant="secondary" className="text-xs">Últimos 14 días</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end justify-between gap-1">
              {ordersTimeline.map((day: any, i: number) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
                  <div className="relative flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-[24px] rounded-t bg-gradient-to-t from-orange-400 to-orange-500 transition-all group-hover:from-orange-500 group-hover:to-orange-600"
                      style={{ height: `${(day.count / maxTimeline) * 100}%`, minHeight: day.count > 0 ? '6px' : '2px' }}
                      title={`${day.count} órdenes`}
                    />
                    <span className="absolute -top-5 text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                      {day.count}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{day.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {statusDistribution.map((s: any) => {
              const max = Math.max(...statusDistribution.map((x: any) => x.count), 1)
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <span className={cn('size-2 shrink-0 rounded-full', s.color)} />
                  <span className="w-24 shrink-0 text-xs text-muted-foreground">{s.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', s.color)}
                      style={{ width: `${(s.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-xs font-semibold">{s.count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders + side panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Órdenes Recientes</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('work-orders')}>
                Ver todas <ArrowUpRight className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y bg-muted/40">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Código</th>
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="hidden px-4 py-2 font-medium sm:table-cell">Equipo</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="hidden px-4 py-2 font-medium md:table-cell">Recibida</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No hay órdenes recientes
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order: any) => (
                      <tr
                        key={order.id}
                        onClick={() => navigate('work-order-detail', { workOrderId: order.id })}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs font-semibold">{order.code}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {order.customer.firstName} {order.customer.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">{order.customer.phone || 'Sin teléfono'}</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-2.5 sm:table-cell">
                          <span className="text-xs">
                            {order.device.brand} {order.device.model}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="hidden px-4 py-2.5 text-xs text-muted-foreground md:table-cell">
                          {timeAgo(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Side panels */}
        <div className="space-y-4">
          {/* Today's reminders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="size-4 text-amber-500" />
                  Recordatorios de Hoy
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate('reminders')}>
                  Ver todos <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!data.remindersToday || data.remindersToday.length === 0) ? (
                <div className="flex flex-col items-center gap-1.5 py-4 text-center">
                  <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">Sin recordatorios para hoy</p>
                </div>
              ) : (
                data.remindersToday.slice(0, 5).map((r: any) => {
                  const TypeIcon = REMINDER_TYPE_ICON_MAP[r.type] || Bell
                  return (
                    <div
                      key={r.id}
                      onClick={() => navigate('reminders')}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md border bg-muted/30 p-2 transition-colors hover:bg-muted/60"
                    >
                      <div
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full',
                          REMINDER_TYPE_COLOR_MAP[r.type] || REMINDER_TYPE_COLOR_MAP.custom
                        )}
                      >
                        <TypeIcon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{r?.title ?? ''}</p>
                        {r.customer && (
                          <p className="truncate text-[10px] text-muted-foreground">
                            {fullName(r.customer.firstName, r.customer.lastName)}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 border-amber-200 bg-amber-50 text-[10px] font-medium text-amber-700">
                        Hoy
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Low stock */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Stock Bajo
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate('inventory')}>
                  Ver <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {lowStockParts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Package className="size-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">Todo el stock está en niveles correctos</p>
                </div>
              ) : (
                lowStockParts.slice(0, 5).map((part: any) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{part.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{part.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-bold', part.stock <= 0 ? 'text-rose-600' : 'text-amber-600')}>
                        {part.stock}
                      </p>
                      <p className="text-[10px] text-muted-foreground">mín: {part.minStock}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Technician workload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="size-4 text-muted-foreground" />
                Carga de Técnicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {technicianWorkloads.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">Sin técnicos activos</p>
              ) : (
                technicianWorkloads.map((tech: any) => (
                  <div key={tech.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{tech.name}</span>
                      <span className="text-muted-foreground">{tech.activeOrders} activa(s)</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${(tech.activeOrders / maxTechLoad) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold">Acciones rápidas</p>
            <p className="text-xs text-muted-foreground">Crea registros nuevos en un clic</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('work-orders')}>
              <ClipboardList className="size-4" /> Nueva Orden
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('customers')}>
              <Package className="size-4" /> Nuevo Cliente
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate('inventory')}>
              <AlertTriangle className="size-4" /> Nuevo Repuesto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
