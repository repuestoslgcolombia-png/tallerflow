'use client'

import { useState } from 'react'
import {
  Bell,
  AlertTriangle,
  Package,
  PackageX,
  FileClock,
  Receipt,
  CheckCircle2,
  Flame,
  CalendarClock,
  X,
  CheckCheck,
  Settings,
} from 'lucide-react'
import { useNotifications } from '@/lib/hooks/api'
import { useAppStore, type View } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, any> = {
  AlertTriangle,
  Bell,
  Package,
  PackageX,
  FileClock,
  Receipt,
  CheckCircle2,
  Flame,
  CalendarClock,
}

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    border: 'border-l-rose-400',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-l-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-400',
  },
  sky: {
    bg: 'bg-sky-100 dark:bg-sky-950/40',
    text: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
    border: 'border-l-sky-400',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    border: 'border-l-violet-400',
  },
}

function timeAgoShort(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 30) return `${days}d`
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

export function NotificationBell() {
  const { data, isLoading } = useNotifications()
  const { navigate } = useAppStore()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const allNotifications = data?.notifications || []
  const notifications = allNotifications.filter((n: any) => !dismissed.has(n.id))
  const stats = data?.stats

  const unreadCount = notifications.length
  const highCount = notifications.filter((n: any) => n.priority === 'high').length

  const handleAction = (n: any) => {
    setOpen(false)
    if (n.actionViewId) {
      navigate(n.actionView as View, { workOrderId: n.actionViewId })
    } else {
      navigate(n.actionView as View)
    }
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed((prev) => new Set(prev).add(id))
  }

  const handleDismissAll = () => {
    setDismissed(new Set(notifications.map((n: any) => n.id)))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Bell className={cn('size-5 transition-transform', open && 'rotate-12')} />
          {unreadCount > 0 && (
            <>
              <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
              {highCount > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 animate-ping rounded-full bg-rose-400" />
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[calc(100vw-1.5rem)] p-0 sm:w-96"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleDismissAll}
                title="Marcar todas como leídas"
              >
                <CheckCheck className="size-3.5" />
                <span className="hidden sm:inline">Marcar leídas</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats summary */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-4 gap-1 border-b bg-muted/30 px-2 py-2">
            <StatPill count={stats.byType.reminders} label="Recordatorios" color="amber" icon={Bell} onClick={() => { setOpen(false); navigate('reminders') }} />
            <StatPill count={stats.byType.stock} label="Stock" color="rose" icon={Package} onClick={() => { setOpen(false); navigate('inventory') }} />
            <StatPill count={stats.byType.quotes} label="Cotiz." color="sky" icon={FileClock} onClick={() => { setOpen(false); navigate('quotes') }} />
            <StatPill count={stats.byType.orders} label="Órdenes" color="emerald" icon={CheckCircle2} onClick={() => { setOpen(false); navigate('work-orders') }} />
          </div>
        )}

        {/* Lista de notificaciones */}
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium">¡Todo al día!</p>
            <p className="text-xs text-muted-foreground">No tienes notificaciones pendientes</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-2">
              {notifications.map((n: any) => {
                const Icon = ICON_MAP[n.icon] || Bell
                const colors = COLOR_MAP[n.color] || COLOR_MAP.sky
                return (
                  <button
                    key={n.id}
                    onClick={() => handleAction(n)}
                    className={cn(
                      'group relative flex w-full items-start gap-3 rounded-lg border-l-2 p-2.5 text-left transition-colors hover:bg-muted/50',
                      colors.border
                    )}
                  >
                    <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', colors.bg, colors.text)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug">{n?.title ?? ''}</p>
                        <button
                          onClick={(e) => handleDismiss(n.id, e)}
                          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                          aria-label="Descartar"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.description}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{timeAgoShort(n.timestamp)}</span>
                        <span className={cn('flex items-center gap-1 text-[10px] font-medium', colors.text)}>
                          {n.actionLabel}
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <Separator />
        <div className="flex items-center justify-between px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setOpen(false); navigate('settings') }}
          >
            <Settings className="size-3.5" />
            Configuración
          </Button>
          <span className="text-[10px] text-muted-foreground">
            Actualizado cada 60s
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StatPill({ count, label, color, icon: Icon, onClick }: {
  count: number
  label: string
  color: string
  icon: any
  onClick: () => void
}) {
  if (count === 0) return null
  const colors = COLOR_MAP[color] || COLOR_MAP.sky
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded-md p-1.5 transition-colors hover:bg-muted"
    >
      <div className={cn('flex size-7 items-center justify-center rounded-md', colors.bg, colors.text)}>
        <Icon className="size-3.5" />
      </div>
      <span className="text-xs font-bold leading-none">{count}</span>
      <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
    </button>
  )
}
