'use client'

import { useState } from 'react'
import {
  CalendarClock,
  Wrench,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Plus,
  ArrowRight,
  CalendarDays,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react'
import { useScheduledServices } from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import { formatDate, formatTime, fullName, DEVICE_TYPES } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const ALERT_CONFIG: Record<string, { label: string; icon: any; box: string; border: string; badge: string }> = {
  overdue: {
    label: 'Vencido',
    icon: AlertTriangle,
    box: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
    border: 'border-l-rose-400',
    badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400',
  },
  today: {
    label: 'Hoy',
    icon: CalendarClock,
    box: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    border: 'border-l-amber-400',
    badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  },
  tomorrow: {
    label: 'Mañana',
    icon: CalendarClock,
    box: 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400',
    border: 'border-l-sky-400',
    badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400',
  },
  this_week: {
    label: 'Esta semana',
    icon: CalendarDays,
    box: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
    border: 'border-l-violet-400',
    badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-400',
  },
  later: {
    label: 'Próximo',
    icon: CalendarDays,
    box: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    border: 'border-l-emerald-400',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
}

function daysText(item: any): string {
  const d = item.daysTo ?? 0
  if (d < 0) return `Hace ${Math.abs(d)}d`
  if (d === 0) return 'Hoy'
  if (d === 1) return 'Mañana'
  return `En ${d}d`
}

function dateKey(date: string | Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ScheduledServicesView() {
  const { data, isLoading, error } = useScheduledServices()
  const { navigate } = useAppStore()
  const [filter, setFilter] = useState<string>('all')

  const items: any[] = data?.items || []
  const stats = data?.stats || {}

  const filtered = filter === 'all' ? items : items.filter((i) => i.alert === filter)

  // Agrupar por día
  const groups = filtered.reduce<Record<string, any[]>>((acc, item) => {
    const key = dateKey(item.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  const groupKeys = Object.keys(groups).sort()

  const statCards = [
    { key: 'today', label: 'Hoy', value: stats.today || 0, tone: 'amber' },
    { key: 'overdue', label: 'Vencidos', value: stats.overdue || 0, tone: 'rose' },
    { key: 'this_week', label: 'Esta semana', value: stats.thisWeek || 0, tone: 'violet' },
    { key: 'upcoming', label: 'Próximos', value: stats.upcoming || 0, tone: 'emerald' },
  ]

  const toneDot: Record<string, string> = {
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Servicios programados</h1>
          <p className="text-sm text-muted-foreground">
            Visitas técnicas y mantenimientos agendados, con alertas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('reminders')}>
            <Bell className="size-4" /> Recordatorio
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => navigate('work-orders')}>
            <Plus className="size-4" /> Nueva orden
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card
            key={s.key}
            className="cursor-pointer transition-all hover:bg-muted/40 active:scale-[0.98]"
            onClick={() => setFilter(s.key === 'overdue' ? 'overdue' : s.key === 'today' ? 'today' : s.key === 'this_week' ? 'this_week' : 'later')}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              </div>
              <span className={cn('size-2.5 rounded-full', toneDot[s.tone])} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} label="Todas" />
        {['today', 'overdue', 'this_week', 'later'].map((key) => (
          <FilterPill
            key={key}
            active={filter === key}
            onClick={() => setFilter(key)}
            label={ALERT_CONFIG[key].label}
          />
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <AlertTriangle className="size-8 text-rose-500" />
            <p className="text-sm text-muted-foreground">Error al cargar los servicios programados.</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Recargar</Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
              <CheckCircle2 className="size-7" />
            </div>
            <div className="text-center">
              <p className="font-medium">Sin servicios programados</p>
              <p className="text-sm text-muted-foreground">
                {filter === 'all'
                  ? 'Agenda una visita técnica o un mantenimiento para verlos aquí.'
                  : 'No hay servicios que coincidan con este filtro.'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('work-orders')}>
              <Plus className="size-4" /> Programar visita
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupKeys.map((key) => {
            const group = groups[key]
            const groupDate = new Date(group[0].date)
            const isToday = dateKey(groupDate) === dateKey(new Date())
            return (
              <div key={key}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn('size-2 rounded-full', isToday ? 'bg-amber-500' : 'bg-muted-foreground/30')} />
                  <h2 className="text-sm font-semibold capitalize">
                    {isToday ? 'Hoy' : formatDate(groupDate)}
                  </h2>
                  <span className="text-xs text-muted-foreground">{group.length}</span>
                </div>
                <div className="space-y-2">
                  {group.map((item) => (
                    <ScheduledItem key={`${item.kind}-${item.id}`} item={item} onOpen={(i) => {
                      if (i.kind === 'visit') navigate('work-order-detail', { workOrderId: i.id })
                      else if (i.workOrderId) navigate('work-order-detail', { workOrderId: i.workOrderId })
                      else navigate('reminders')
                    }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ScheduledItem({ item, onOpen }: { item: any; onOpen: (i: any) => void }) {
  const conf = ALERT_CONFIG[item.alert] || ALERT_CONFIG.later
  const AlertIcon = conf.icon
  const KindIcon = item.kind === 'visit' ? CalendarClock : item.type === 'warranty_check' ? ShieldCheck : Wrench
  const deviceLabel = (DEVICE_TYPES as any)[item.deviceType]?.label || null

  return (
    <Card
      className={cn('cursor-pointer border-l-4 transition-all hover:bg-muted/40 active:scale-[0.99]', conf.border)}
      onClick={() => onOpen(item)}
    >
      <CardContent className="flex items-center gap-3 p-3 sm:p-4">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', conf.box)}>
          <KindIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {item.kind === 'visit' ? item.code : item.title}
            </span>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', conf.badge)}>
              <AlertIcon className="mr-0.5 size-2.5" />
              {conf.label}
            </Badge>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <UserIcon className="size-3" />
              {fullName(item.customer?.firstName, item.customer?.lastName)}
            </span>
            {item.device && (
              <span className="truncate">
                · {deviceLabel ? `${deviceLabel} ` : ''}{item.device}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3" />
              {formatDate(item.date)} · {formatTime(item.date)}
            </span>
            <span className={cn('font-medium', item.alert === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
              {daysText(item)}
            </span>
          </div>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'
      )}
    >
      {label}
    </button>
  )
}
