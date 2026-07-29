'use client'

import { useState } from 'react'
import {
  Bell,
  BellRing,
  Phone,
  MessageCircle,
  Mail,
  Smartphone,
  ShieldCheck,
  Star,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  MoreHorizontal,
  ChevronRight,
  AlertTriangle,
  Pause,
  Trash2,
  Pencil,
  Calendar,
  CalendarClock,
  BellOff,
  Play,
  History,
  User as UserIcon,
} from 'lucide-react'
import { useReminders, useReminderMutations, useCustomers, useWorkOrders } from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import {
  REMINDER_TYPES,
  REMINDER_STATUS,
  REMINDER_CHANNELS,
  PRIORITY,
  formatDate,
  formatDateTime,
  fullName,
  getInitials,
  type ReminderTypeKey,
} from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ReminderStatusBadge, PriorityBadge } from '@/components/tallerflow/badges'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TYPE_ICON_MAP: Record<string, any> = {
  follow_up: Phone,
  warranty_check: ShieldCheck,
  service_review: Star,
  maintenance: Wrench,
  custom: Bell,
}

const CHANNEL_ICON_MAP: Record<string, any> = {
  whatsapp: MessageCircle,
  email: Mail,
  phone: Phone,
  sms: Smartphone,
}

const REMINDER_TYPE_KEYS = Object.keys(REMINDER_TYPES) as ReminderTypeKey[]
const STATUS_KEYS = Object.keys(REMINDER_STATUS)

function getDateStr(date: Date | string): string {
  return new Date(date).toISOString().split('T')[0]
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return getDateStr(d)
}

export function RemindersView() {
  const { navigate } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [completing, setCompleting] = useState<any | null>(null)
  const [snoozing, setSnoozing] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: reminders, isLoading } = useReminders({ status: statusFilter === 'all' ? undefined : statusFilter })
  const { data: customers } = useCustomers()
  const { update: updateReminder, remove: removeReminder } = useReminderMutations()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Derived stats from all reminders (fetch all for counting)
  const { data: allReminders } = useReminders({})
  const stats = {
    today: allReminders?.filter((r: any) => r.status === 'pending' && new Date(r.dueDate) >= today && new Date(r.dueDate) < new Date(today.getTime() + 86400000)).length || 0,
    overdue: allReminders?.filter((r: any) => r.status === 'pending' && new Date(r.dueDate) < today).length || 0,
    snoozed: allReminders?.filter((r: any) => r.status === 'snoozed').length || 0,
    done: allReminders?.filter((r: any) => r.status === 'done').length || 0,
  }

  // Filter by search
  const filtered = (reminders || []).filter((r: any) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      r.title?.toLowerCase().includes(s) ||
      `${r.customer?.firstName} ${r.customer?.lastName}`.toLowerCase().includes(s) ||
      r.message?.toLowerCase().includes(s)
    )
  })

  // Sort: overdue first, then by dueDate asc
  const sorted = [...filtered].sort((a: any, b: any) => {
    const aOverdue = a.status === 'pending' && new Date(a.dueDate) < today ? 0 : 1
    const bOverdue = b.status === 'pending' && new Date(b.dueDate) < today ? 0 : 1
    if (aOverdue !== bOverdue) return aOverdue - bOverdue
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  const statCards = [
    { key: 'pending', label: 'Pendientes Hoy', value: stats.today, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { key: 'overdue', label: 'Vencidos', value: stats.overdue, icon: AlertTriangle, color: 'bg-rose-100 text-rose-600' },
    { key: 'snoozed', label: 'Pospuestos', value: stats.snoozed, icon: Pause, color: 'bg-violet-100 text-violet-600' },
    { key: 'done', label: 'Completados', value: stats.done, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, cliente, mensaje..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Nuevo Recordatorio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card
              key={s.key}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setStatusFilter(s.key === 'overdue' ? 'pending' : s.key)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('flex size-10 items-center justify-center rounded-lg', s.color)}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="Todos" />
        {STATUS_KEYS.map((key) => (
          <FilterPill
            key={key}
            active={statusFilter === key}
            onClick={() => setStatusFilter(key)}
            label={(REMINDER_STATUS as any)[key].label}
            dotClass={(REMINDER_STATUS as any)[key].dot}
          />
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <BellRing className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">No hay recordatorios</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'pending' ? 'No tienes recordatorios pendientes. ¡Bien hecho!' : 'Crea el primer recordatorio para dar seguimiento a tus clientes.'}
              </p>
            </div>
            <Button variant="outline" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Crear recordatorio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((reminder: any) => {
            const TypeIcon = TYPE_ICON_MAP[reminder.type] || Bell
            const ChannelIcon = CHANNEL_ICON_MAP[reminder.channel] || MessageCircle
            const isOverdue = reminder.status === 'pending' && new Date(reminder.dueDate) < today
            const isToday = reminder.status === 'pending' &&
              new Date(reminder.dueDate) >= today &&
              new Date(reminder.dueDate) < new Date(today.getTime() + 86400000)
            return (
              <Card
                key={reminder.id}
                className={cn(
                  'transition-shadow hover:shadow-md',
                  isOverdue && 'border-l-4 border-l-rose-400',
                  isToday && 'border-l-4 border-l-amber-400'
                )}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    isOverdue ? 'bg-rose-100 text-rose-600' : isToday ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'
                  )}>
                    <TypeIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">{reminder?.title ?? ''}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <button
                            onClick={() => navigate('customer-detail', { customerId: reminder.customerId })}
                            className="flex items-center gap-1 hover:text-foreground hover:underline"
                          >
                            <UserIcon className="size-3" />
                            {fullName(reminder.customer?.firstName, reminder.customer?.lastName)}
                          </button>
                          {reminder.workOrder && (
                            <>
                              <span>·</span>
                              <button
                                onClick={() => navigate('work-order-detail', { workOrderId: reminder.workOrderId })}
                                className="font-mono hover:text-foreground hover:underline"
                              >
                                {reminder.workOrder.code}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ReminderStatusBadge status={reminder.status} />
                        {reminder.priority !== 'normal' && <PriorityBadge priority={reminder.priority} />}
                      </div>
                    </div>
                    {reminder.message && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{reminder.message}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span className={cn(
                        'flex items-center gap-1',
                        isOverdue ? 'font-semibold text-rose-600' : isToday ? 'font-semibold text-amber-600' : 'text-muted-foreground'
                      )}>
                        <CalendarClock className="size-3.5" />
                        {isOverdue ? 'Vencido: ' : isToday ? 'Hoy: ' : ''}
                        {formatDateTime(reminder.dueDate)}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ChannelIcon className="size-3.5" />
                        {(REMINDER_CHANNELS as any)[reminder.channel]?.label || reminder.channel}
                      </span>
                      {(REMINDER_TYPES as any)[reminder.type]?.label && (
                        <Badge variant="outline" className="text-[10px]">
                          {(REMINDER_TYPES as any)[reminder.type].label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Acciones">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {reminder.status === 'pending' && (
                        <>
                          <DropdownMenuItem onClick={() => setCompleting(reminder)}>
                            <CheckCircle2 className="mr-2 size-4" /> Marcar completado
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSnoozing(reminder)}>
                            <Pause className="mr-2 size-4" /> Posponer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-600"
                            onClick={() => {
                              updateReminder.mutate({ id: reminder.id, data: { action: 'cancel' } })
                            }}
                          >
                            <XCircle className="mr-2 size-4" /> Cancelar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditing(reminder)}>
                            <Pencil className="mr-2 size-4" /> Editar
                          </DropdownMenuItem>
                        </>
                      )}
                      {reminder.status === 'snoozed' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              updateReminder.mutate({ id: reminder.id, data: { action: 'reactivate' } })
                            }}
                          >
                            <Play className="mr-2 size-4" /> Reactivar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCompleting(reminder)}>
                            <CheckCircle2 className="mr-2 size-4" /> Marcar completado
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditing(reminder)}>
                            <Pencil className="mr-2 size-4" /> Editar
                          </DropdownMenuItem>
                        </>
                      )}
                      {reminder.status === 'done' && (
                        <DropdownMenuItem
                          onClick={() => {
                            updateReminder.mutate({ id: reminder.id, data: { action: 'reactivate' } })
                          }}
                        >
                          <History className="mr-2 size-4" /> Reactivar
                        </DropdownMenuItem>
                      )}
                      {reminder.status === 'cancelled' && (
                        <DropdownMenuItem
                          onClick={() => {
                            updateReminder.mutate({ id: reminder.id, data: { action: 'reactivate' } })
                          }}
                        >
                          <Play className="mr-2 size-4" /> Reactivar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-rose-600 focus:text-rose-600"
                        onClick={() => setDeleteId(reminder.id)}
                      >
                        <Trash2 className="mr-2 size-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      {createOpen && (
        <CreateEditReminderDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          customers={customers || []}
        />
      )}

      {/* Edit Dialog */}
      {editing && (
        <CreateEditReminderDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          reminder={editing}
          customers={customers || []}
        />
      )}

      {/* Complete Dialog */}
      {completing && (
        <CompleteDialog
          reminder={completing}
          onClose={() => setCompleting(null)}
        />
      )}

      {/* Snooze Dialog */}
      {snoozing && (
        <SnoozeDialog
          reminder={snoozing}
          onClose={() => setSnoozing(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recordatorio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El recordatorio será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                if (deleteId) removeReminder.mutate(deleteId)
                setDeleteId(null)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilterPill({ active, onClick, label, dotClass }: { active: boolean; onClick: () => void; label: string; dotClass?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'
      )}
    >
      {dotClass && <span className={cn('size-1.5 rounded-full', dotClass)} />}
      {label}
    </button>
  )
}

// ============== Create / Edit Dialog ==============
function CreateEditReminderDialog({
  open,
  onOpenChange,
  reminder,
  customers,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder?: any | null
  customers: any[]
}) {
  const { create, update } = useReminderMutations()
  const isEdit = !!reminder

  const [type, setType] = useState<string>(reminder?.type || 'follow_up')
  const [customerId, setCustomerId] = useState<string>(reminder?.customerId || '')
  const [workOrderId, setWorkOrderId] = useState<string>(reminder?.workOrderId || 'none')
  const [title, setTitle] = useState<string>(reminder?.title || '')
  const [message, setMessage] = useState<string>(reminder?.message || '')
  const [channel, setChannel] = useState<string>(reminder?.channel || 'whatsapp')
  const [priority, setPriority] = useState<string>(reminder?.priority || 'normal')
  const [dueDate, setDueDate] = useState<string>(
    reminder?.dueDate ? getDateStr(reminder.dueDate) : addDays(new Date(), (REMINDER_TYPES as any)[type]?.defaultDays || 1)
  )

  const { data: customerWorkOrders } = useWorkOrders(customerId ? { customerId } : {})

  const handleTypeChange = (newType: string) => {
    setType(newType)
    const conf = (REMINDER_TYPES as any)[newType]
    if (conf) {
      if (!isEdit) {
        setTitle(conf.label)
        setMessage(conf.defaultTemplate)
        setDueDate(addDays(new Date(), conf.defaultDays))
      }
    }
  }

  const valid = customerId.trim() !== '' && title.trim() !== '' && dueDate !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const data = {
      customerId,
      workOrderId: workOrderId === 'none' ? null : workOrderId,
      type,
      title,
      message: message || null,
      dueDate: new Date(dueDate).toISOString(),
      channel,
      priority,
    }
    if (isEdit) {
      update.mutate({ id: reminder.id, data }, { onSuccess: () => onOpenChange(false) })
    } else {
      create.mutate(data, { onSuccess: () => onOpenChange(false) })
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Actualiza los datos del recordatorio.' : 'Programa un seguimiento para tu cliente.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Tipo de recordatorio *</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REMINDER_TYPE_KEYS.map((key) => {
                  const conf = (REMINDER_TYPES as any)[key]
                  const Icon = TYPE_ICON_MAP[key] || Bell
                  return (
                    <SelectItem key={key} value={key}>
                      <Icon className="mr-1.5 size-4" />
                      {conf.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">{(REMINDER_TYPES as any)[type]?.description}</p>
          </div>

          <div className="grid gap-2">
            <Label>Cliente *</Label>
            <Select value={customerId} onValueChange={(v) => { setCustomerId(v); setWorkOrderId('none') }}>
              <SelectTrigger><SelectValue placeholder="Selecciona un cliente..." /></SelectTrigger>
              <SelectContent>
                {customers.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {fullName(c.firstName, c.lastName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customerId && customerWorkOrders && customerWorkOrders.length > 0 && (
            <div className="grid gap-2">
              <Label>Orden de trabajo (opcional)</Label>
              <Select value={workOrderId} onValueChange={setWorkOrderId}>
                <SelectTrigger><SelectValue placeholder="Sin orden específica" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin orden específica</SelectItem>
                  {customerWorkOrders.map((wo: any) => (
                    <SelectItem key={wo.id} value={wo.id}>
                      {wo.code} — {wo.device?.brand} {wo.device?.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Seguimiento post-reparación" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensaje del recordatorio..."
              rows={3}
            />
            <p className="text-[11px] text-muted-foreground">Puedes usar {'{cliente}'} y {'{equipo}'} como variables.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REMINDER_CHANNELS).map(([key, conf]: any) => {
                    const Icon = CHANNEL_ICON_MAP[key] || MessageCircle
                    return (
                      <SelectItem key={key} value={key}>
                        <Icon className="mr-1.5 size-4" />
                        {conf.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY).map(([key, conf]: any) => (
                    <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Fecha del recordatorio *</Label>
            <Input id="dueDate" type="datetime-local" value={dueDate ? dueDate + 'T10:00' : ''} onChange={(e) => setDueDate(e.target.value.split('T')[0])} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={!valid || pending}>
              {pending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear recordatorio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== Complete Dialog ==============
function CompleteDialog({ reminder, onClose }: { reminder: any; onClose: () => void }) {
  const { update } = useReminderMutations()
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate(
      { id: reminder.id, data: { action: 'complete', completionNotes: notes || null } },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            Marcar como completado
          </DialogTitle>
          <DialogDescription>
            Registra el resultado del contacto con el cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-medium">{reminder?.title ?? ''}</p>
            <p className="text-xs text-muted-foreground">
              Cliente: {fullName(reminder.customer?.firstName, reminder.customer?.lastName)}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas de resultado</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Cliente confirmó que el equipo funciona perfectamente. Quedó muy satisfecho."
              rows={4}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={update.isPending} className="gap-1.5">
              <CheckCircle2 className="size-4" />
              {update.isPending ? 'Guardando...' : 'Completar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== Snooze Dialog ==============
function SnoozeDialog({ reminder, onClose }: { reminder: any; onClose: () => void }) {
  const { update } = useReminderMutations()
  const [snoozeUntil, setSnoozeUntil] = useState(addDays(new Date(), 3))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate(
      { id: reminder.id, data: { action: 'snooze', snoozeUntil: new Date(snoozeUntil).toISOString() } },
      { onSuccess: onClose }
    )
  }

  const quickOptions = [1, 3, 7, 14]

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="size-5 text-violet-500" />
            Posponer recordatorio
          </DialogTitle>
          <DialogDescription>
            El recordatorio volverá a estar pendiente en la fecha seleccionada.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-medium">{reminder?.title ?? ''}</p>
            <p className="text-xs text-muted-foreground">
              Vence: {formatDateTime(reminder.dueDate)}
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Nueva fecha</Label>
            <Input type="date" value={snoozeUntil} onChange={(e) => setSnoozeUntil(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickOptions.map((days) => (
              <Button
                key={days}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSnoozeUntil(addDays(new Date(), days))}
              >
                +{days}d
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={update.isPending} className="gap-1.5">
              <Pause className="size-4" />
              {update.isPending ? 'Guardando...' : 'Posponer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
