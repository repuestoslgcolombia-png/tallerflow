'use client'

import { useState } from 'react'
import { useDailyAgenda, useDailyTaskMutations } from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import { formatDate, formatDateTime, formatTime, timeAgo, formatCurrency, WORK_ORDER_STATUS, PRIORITY, DEVICE_TYPES, REMINDER_TYPES } from '@/lib/constants'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { StatusBadge, PriorityBadge } from '@/components/tallerflow/badges'
import { cn } from '@/lib/utils'
import {
  Sun, Moon, ListChecks, ClipboardList, Bell, Package, AlertTriangle, Clock, ArrowRight,
  CheckCircle2, X, Plus, Loader2, AlertCircle, Wrench, User,
  Tv, Refrigerator, WashingMachine, Snowflake, Flame, Wind, FlameKindling, Sparkles,
  CalendarDays, CalendarClock, MessageSquare, Phone, Mail, Star, ShieldCheck, ShoppingBag,
  TrendingUp, Wallet,
} from 'lucide-react'

function getDeviceIcon(type: string) {
  const icons: Record<string, any> = {
    washing_machine: WashingMachine, refrigerator: Refrigerator, freezer: Snowflake,
    gas_dryer: Flame, air_conditioner: Wind, tv: Tv, other: Wrench,
  }
  const Icon = icons[type] || Wrench
  return Icon
}

function getReminderIcon(type: string) {
  const icons: Record<string, any> = {
    follow_up: MessageSquare, warranty_check: ShieldCheck,
    service_review: Star, maintenance: Wrench, custom: Bell,
  }
  const Icon = icons[type] || Bell
  return Icon
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Buenos días', icon: Sun }
  if (hour < 18) return { text: 'Buenas tardes', icon: Sun }
  return { text: 'Buenas noches', icon: Moon }
}

export function DailyAgendaView() {
  const { data, isLoading, error } = useDailyAgenda()
  const { navigate } = useAppStore()
  const { create: createTask, update: updateTask, remove: removeTask } = useDailyTaskMutations()
  const greeting = getGreeting()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <p className="font-medium text-foreground">Error al cargar la agenda</p>
        <p className="text-sm text-muted-foreground">Intenta recargar la página</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Recargar</Button>
      </Card>
    )
  }

  const stats = data?.stats || {}
  const workOrdersToday = data?.workOrdersToday || []
  const completedToday = data?.completedToday || []
  const workshopFlow = data?.workshopFlow || []
  const remindersToday = data?.remindersToday || []
  const overdueReminders = data?.overdueReminders || []
  const ordersReady = data?.ordersReady || []
  const lowStockParts = data?.lowStockParts || []
  const nearMinStock = data?.nearMinStock || []
  const pendingQuotes = data?.pendingQuotes || []
  const pendingInvoices = data?.pendingInvoices || []
  const overdueInvoices = data?.overdueInvoices || []
  const dailyTasks = data?.dailyTasks || []
  const scheduledVisits = data?.scheduledVisits || []
  const accounting = data?.accounting || null
  const today = new Date()

  function handleToggleTask(task: any) {
    updateTask.mutate({ id: task.id, data: { isCompleted: !task.isCompleted } })
  }

  function handleAddTask() {
    if (!newTaskTitle.trim()) return
    setIsSavingTask(true)
    createTask.mutate(
      { title: newTaskTitle.trim(), taskDate: today.toISOString() },
      {
        onSettled: () => {
          setNewTaskTitle('')
          setIsAddingTask(false)
          setIsSavingTask(false)
        },
      }
    )
  }

  function handleUpdateTaskTitle(id: string) {
    if (!editTaskTitle.trim()) return
    updateTask.mutate(
      { id, data: { title: editTaskTitle.trim() } },
      { onSettled: () => { setEditingTaskId(null); setEditTaskTitle('') } }
    )
  }

  const alertCount =
    (lowStockParts.length > 0 ? 1 : 0) +
    (nearMinStock.length > 0 ? 1 : 0) +
    (pendingQuotes.length > 0 ? 1 : 0) +
    (overdueInvoices.length > 0 ? 1 : 0)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            {greeting.icon === Sun ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {greeting.text}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(today)} · {today.toLocaleDateString('es-CO', { weekday: 'long' })}
            </p>
          </div>
        </div>
        {alertCount > 0 && (
          <div className="hidden items-center gap-2 rounded-full bg-rose-50 px-4 py-1.5 text-xs text-rose-700 sm:flex dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {alertCount} {alertCount === 1 ? 'alerta pendiente' : 'alertas pendientes'}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={ClipboardList}
          label="Órdenes hoy"
          value={stats.workOrdersToday || 0}
          color="sky"
          onClick={() => navigate('work-orders')}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completadas hoy"
          value={stats.completedToday || 0}
          color="emerald"
          onClick={() => navigate('work-orders')}
        />
        <StatCard
          icon={Bell}
          label="Recordatorios"
          value={stats.remindersToday || 0}
          sub={`${stats.overdueReminders || 0} vencidos`}
          color="amber"
          onClick={() => navigate('reminders')}
        />
        <StatCard
          icon={CheckCircle2}
          label="Para entregar"
          value={stats.ordersReady || 0}
          color="teal"
          onClick={() => navigate('work-orders')}
        />
        <StatCard
          icon={AlertTriangle}
          label="Urgentes"
          value={stats.urgentOrders || 0}
          color="rose"
          onClick={() => navigate('work-orders')}
        />
        <StatCard
          icon={ListChecks}
          label="Tareas"
          value={`${stats.dailyTasksDone || 0}/${stats.dailyTasksTotal || 0}`}
          color="violet"
          onClick={() => navigate('daily-agenda')}
        />
      </div>

      {/* Flujo del taller (visión global) */}
      <WorkshopFlowCard flow={workshopFlow} onOpenOrders={() => navigate('work-orders')} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Checklist + Work Orders Today */}
        <div className="space-y-6 lg:col-span-2">
          {/* Checklist */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-medium">Tareas del día</h2>
                <Badge variant="outline" className="ml-1 text-xs">
                  {stats.dailyTasksDone}/{stats.dailyTasksTotal}
                </Badge>
              </div>
              {stats.dailyTasksTotal > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {Math.round(((stats.dailyTasksDone || 0) / stats.dailyTasksTotal) * 100)}%
                </span>
              )}
            </div>
            {(stats.dailyTasksTotal || 0) > 0 && (
              <div className="px-4 pt-3">
                <Progress
                  value={((stats.dailyTasksDone || 0) / stats.dailyTasksTotal) * 100}
                  className="h-1.5"
                />
              </div>
            )}
            <div className="divide-y">
              {dailyTasks.length === 0 && !isAddingTask && (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                  <p>Sin tareas para hoy</p>
                  <Button variant="outline" size="sm" onClick={() => setIsAddingTask(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Agregar tarea
                  </Button>
                </div>
              )}
              {dailyTasks.map((task: any) => (
                <div key={task.id} className="group flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50">
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={() => handleToggleTask(task)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    {editingTaskId === task.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateTaskTitle(task.id)
                            if (e.key === 'Escape') { setEditingTaskId(null); setEditTaskTitle('') }
                          }}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateTaskTitle(task.id)} className="h-8" aria-label="Guardar">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </Button>
                      </div>
                    ) : (
                      <p
                        className={`text-sm ${task.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                        onDoubleClick={() => { setEditingTaskId(task.id); setEditTaskTitle(task?.title ?? '') }}
                      >
                        {task?.title ?? ''}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {task.assignee && <span>{task.assignee.name}</span>}
                      {task.priority === 'high' && (
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 text-[10px] px-1.5 py-0 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800">
                          Alta
                        </Badge>
                      )}
                      {task.priority === 'urgent' && (
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 text-[10px] px-1.5 py-0 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800">
                          Urgente
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => removeTask.mutate(task.id)}
                      aria-label="Eliminar tarea"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
              {isAddingTask && (
                <div className="flex gap-2 px-4 py-2.5">
                  <Input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Nueva tarea…"
                    className="h-9 text-sm"
                    autoFocus
                    disabled={isSavingTask}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask()
                      if (e.key === 'Escape') { setIsAddingTask(false); setNewTaskTitle('') }
                    }}
                  />
                  <Button size="sm" onClick={handleAddTask} disabled={isSavingTask || !newTaskTitle.trim()} className="h-9">
                    {isSavingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
                  </Button>
                </div>
              )}
              {dailyTasks.length > 0 && !isAddingTask && (
                <div className="px-4 py-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setIsAddingTask(true)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Agregar tarea
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Órdenes del día */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-sky-500" />
                <h2 className="text-sm font-medium">Órdenes del día</h2>
                <Badge variant="outline" className="ml-1 text-xs">{workOrdersToday.length}</Badge>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('work-orders')}>
                Ver todas <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            {workOrdersToday.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
                <CalendarDays className="h-7 w-7 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Sin órdenes recibidas ni visitas programadas para hoy
                </p>
              </div>
            ) : (
            <div className="divide-y">
              {workOrdersToday.map((wo: any) => {
                const DeviceIcon = getDeviceIcon(wo.device?.type)
                return (
                  <div
                    key={wo.id}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                    onClick={() => navigate('work-order-detail', { workOrderId: wo.id })}
                  >
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      wo.isScheduledVisit
                        ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400'
                        : 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400'
                    )}>
                      <DeviceIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{wo.code}</span>
                        <StatusBadge status={wo.status} />
                        <PriorityBadge priority={wo.priority} />
                        {wo.isScheduledVisit ? (
                          <Badge variant="outline" className="border-violet-200 bg-violet-50 px-1.5 py-0 text-[10px] text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-400">
                            <CalendarDays className="mr-0.5 h-2.5 w-2.5" />
                            Visita {wo.scheduledVisitAt && formatTime(wo.scheduledVisitAt)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-sky-200 bg-sky-50 px-1.5 py-0 text-[10px] text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-400">
                            Recibida hoy
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm font-medium">
                        {wo.device?.brand} {wo.device?.model}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {wo.customer?.firstName} {wo.customer?.lastName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      {timeAgo(wo.createdAt)}
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </Card>

          {/* Completadas hoy */}
          <CompletedTodayCard orders={completedToday} onOpenOrder={(id: string) => navigate('work-order-detail', { workOrderId: id })} />
        </div>

        {/* Right column: Reminders + Ready Orders + Alerts */}
        <div className="space-y-6">
          {/* Contabilidad del mes */}
          {accounting && <AccountingCard accounting={accounting} onOpen={() => navigate('invoices')} />}

          {/* Servicios programados */}
          <ScheduledServicesCard
            visits={scheduledVisits}
            reminders={[...overdueReminders, ...remindersToday].filter((r: any) =>
              ['maintenance', 'warranty_check'].includes(r.type)
            )}
            onOpenAll={() => navigate('scheduled-services')}
            onOpenVisit={(id: string) => navigate('work-order-detail', { workOrderId: id })}
            onOpenReminder={() => navigate('reminders')}
          />

          {/* Reminders Today */}
          {(remindersToday.length > 0 || overdueReminders.length > 0) && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-medium">Recordatorios</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('reminders')}>
                  Ver <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="divide-y max-h-[320px] overflow-y-auto">
                {overdueReminders.slice(0, 3).map((r: any) => {
                  const RemindIcon = getReminderIcon(r.type)
                  return (
                    <div key={r.id} className="flex items-start gap-3 border-l-2 border-rose-400 px-4 py-2.5">
                      <RemindIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-rose-700 dark:text-rose-400">Vencido</p>
                        <p className="text-sm">{r?.title ?? ''}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.customer?.firstName} {r.customer?.lastName}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {remindersToday.map((r: any) => {
                  const RemindIcon = getReminderIcon(r.type)
                  return (
                    <div key={r.id} className="flex items-start gap-3 border-l-2 border-amber-400 px-4 py-2.5">
                      <RemindIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{r?.title ?? ''}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">Hoy</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.customer?.firstName} {r.customer?.lastName}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Orders Ready */}
          {ordersReady.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-medium">Listas para entregar</h2>
                  <Badge variant="outline" className="ml-1 text-xs">{ordersReady.length}</Badge>
                </div>
              </div>
              <div className="divide-y">
                {ordersReady.map((wo: any) => {
                  const DeviceIcon = getDeviceIcon(wo.device?.type)
                  return (
                    <div
                      key={wo.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                      onClick={() => navigate('work-order-detail', { workOrderId: wo.id })}
                    >
                      <DeviceIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{wo.code} · {wo.device?.brand} {wo.device?.model}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {wo.customer?.firstName} {wo.customer?.lastName}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Alerts */}
          {(lowStockParts.length > 0 || nearMinStock.length > 0 || pendingQuotes.length > 0 || overdueInvoices.length > 0) && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h2 className="text-sm font-medium">Alertas</h2>
              </div>
              <div className="divide-y">
                {lowStockParts.length > 0 && (
                  <div className="px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-3.5 w-3.5 text-rose-500" />
                      <span className="font-medium text-rose-700 dark:text-rose-400">
                        {lowStockParts.length} repuesto{lowStockParts.length > 1 ? 's' : ''} sin stock
                      </span>
                    </div>
                    <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => navigate('inventory')}>
                      Ir a inventario <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
                {nearMinStock.length > 0 && (
                  <div className="px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-amber-700 dark:text-amber-400">
                        {nearMinStock.length} repuesto{nearMinStock.length > 1 ? 's' : ''} cerca del mínimo
                      </span>
                    </div>
                  </div>
                )}
                {pendingQuotes.length > 0 && (
                  <div className="px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <ShoppingBag className="h-3.5 w-3.5 text-sky-500" />
                      <span className="text-sky-700 dark:text-sky-400">
                        {pendingQuotes.length} cotización{pendingQuotes.length > 1 ? 'es' : ''} por aprobar
                      </span>
                    </div>
                    <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => navigate('quotes')}>
                      Ir a cotizaciones <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
                {overdueInvoices.length > 0 && (
                  <div className="px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      <span className="text-rose-700 dark:text-rose-400">
                        {overdueInvoices.length} factura{overdueInvoices.length > 1 ? 's' : ''} vencida{overdueInvoices.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button variant="link" size="sm" className="h-auto px-0 text-xs" onClick={() => navigate('invoices')}>
                      Ir a facturas <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Quick actions */}
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-2 h-9" onClick={() => navigate('work-orders')}>
                <Plus className="h-3.5 w-3.5 text-sky-500" /> Nueva orden
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2 h-9" onClick={() => navigate('customers')}>
                <User className="h-3.5 w-3.5 text-emerald-500" /> Nuevo cliente
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2 h-9" onClick={() => navigate('inventory')}>
                <Package className="h-3.5 w-3.5 text-amber-500" /> Nuevo repuesto
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2 h-9" onClick={() => navigate('reminders')}>
                <Bell className="h-3.5 w-3.5 text-violet-500" /> Recordatorio
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: any; label: string; value: string | number; sub?: string; color: string; onClick?: () => void
}) {
  const colorMap: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
  }

  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50 sm:p-4"
      onClick={onClick}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorMap[color] || colorMap.sky}`}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tabular-nums sm:text-xl">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {sub && <p className="truncate text-[11px] text-rose-600 dark:text-rose-400">{sub}</p>}
      </div>
    </div>
  )
}

// ============== Flujo del taller (visión global) ==============
const FLOW_STAGES = ['received', 'diagnosing', 'quoted', 'approved', 'in_progress', 'ready'] as const

function WorkshopFlowCard({
  flow,
  onOpenOrders,
}: {
  flow: { status: string; count: number }[]
  onOpenOrders: () => void
}) {
  const counts: Record<string, number> = {}
  for (const item of flow) counts[item.status] = item.count
  const stages = FLOW_STAGES.map((s) => ({
    key: s,
    conf: (WORK_ORDER_STATUS as any)[s],
    count: counts[s] || 0,
  }))
  const total = stages.reduce((sum, s) => sum + s.count, 0)
  const maxCount = Math.max(1, ...stages.map((s) => s.count))

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-medium">Flujo del taller</h2>
          <Badge variant="outline" className="ml-1 text-xs">
            {total} activa{total === 1 ? '' : 's'}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onOpenOrders}>
          Ver órdenes <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      {/* Barra segmentada proporcional */}
      {total > 0 ? (
        <div className="px-4 pt-4">
          <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
            {stages
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.key}
                  className={cn('h-full first:rounded-l-full last:rounded-r-full transition-all', s.conf?.dot)}
                  style={{ width: `${(s.count / total) * 100}%` }}
                  title={`${s.conf.label}: ${s.count}`}
                />
              ))}
          </div>
        </div>
      ) : null}

      {/* Etapas */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-3 lg:grid-cols-6">
        {stages.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={onOpenOrders}
            className="group flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex w-full items-center justify-between gap-1.5">
              <span className={cn('size-2 shrink-0 rounded-full', s.count > 0 ? s.conf?.dot : 'bg-muted-foreground/25')} />
              <span className="text-base font-bold leading-none tabular-nums">{s.count}</span>
            </div>
            <span className={cn('truncate text-[11px]', s.count > 0 ? 'font-medium' : 'text-muted-foreground')}>
              {s.conf?.label}
            </span>
          </button>
        ))}
      </div>

      {total === 0 && (
        <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
          No hay órdenes activas en el taller — buen momento para hacer mantenimiento preventivo.
        </p>
      )}
    </Card>
  )
}

// ============== Completadas hoy ==============
function CompletedTodayCard({
  orders,
  onOpenOrder,
}: {
  orders: any[]
  onOpenOrder: (id: string) => void
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-medium">Completadas hoy</h2>
          <Badge variant="outline" className="ml-1 text-xs">{orders.length}</Badge>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
          <Sparkles className="h-7 w-7 text-muted-foreground/50" />
          <p className="text-sm font-medium">Aún no hay entregas hoy</p>
          <p className="text-xs text-muted-foreground">Las órdenes entregadas aparecerán aquí</p>
        </div>
      ) : (
        <div className="divide-y">
          {orders.map((wo: any) => {
            const DeviceIcon = getDeviceIcon(wo.device?.type)
            return (
              <div
                key={wo.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                onClick={() => onOpenOrder(wo.id)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <DeviceIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {wo.code} · {wo.device?.brand} {wo.device?.model}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {wo.customer?.firstName} {wo.customer?.lastName}
                    {wo.technician?.name && ` · Técnico: ${wo.technician.name}`}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <p>{formatDateTime(wo.deliveredAt)}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Entregada</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ============== Contabilidad del mes ==============
function AccountingCard({ accounting, onOpen }: { accounting: any; onOpen: () => void }) {
  const monthLabel = new Date(accounting.year, accounting.month - 1, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })
  const isOpen = accounting.status === 'open'
  const rows = [
    { label: 'Ingresos', value: formatCurrency(accounting.collected), tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Facturado', value: formatCurrency(accounting.invoiced), tone: 'text-sky-600 dark:text-sky-400' },
    { label: 'Por cobrar', value: formatCurrency(accounting.outstanding), tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Utilidad', value: formatCurrency(accounting.profit), tone: 'text-violet-600 dark:text-violet-400' },
  ]

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-medium">Contabilidad del mes</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onOpen}>
          Ver <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-sm font-medium capitalize">{monthLabel}</span>
          <Badge
            variant="outline"
            className={cn(
              'px-1.5 py-0 text-[10px]',
              isOpen
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950/30 dark:text-slate-400'
            )}
          >
            {isOpen ? 'En curso' : 'Cerrado'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {rows.map((r) => (
            <div key={r.label} className="rounded-lg border bg-muted/20 p-2">
              <p className="text-[11px] text-muted-foreground">{r.label}</p>
              <p className={cn('text-sm font-bold tabular-nums', r.tone)}>{r.value}</p>
            </div>
          ))}
        </div>
        {isOpen && (
          <p className="mt-2.5 text-[11px] text-muted-foreground">
            <TrendingUp className="mr-1 inline h-3 w-3 text-emerald-500" />
            {accounting.daysToClose > 0
              ? `Se cierra automáticamente en ${accounting.daysToClose} día(s)`
              : 'Último día del mes'}
          </p>
        )}
      </div>
    </Card>
  )
}

// ============== Servicios programados (visitas + mantenimientos) ==============
function ScheduledServicesCard({
  visits,
  reminders,
  onOpenAll,
  onOpenVisit,
  onOpenReminder,
}: {
  visits: any[]
  reminders: any[]
  onOpenAll: () => void
  onOpenVisit: (id: string) => void
  onOpenReminder: () => void
}) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const items = [
    ...visits.map((v) => {
      const device = v.device || {}
      return {
        kind: 'visit',
        id: v.id,
        date: v.scheduledVisitAt,
        code: v.code,
        customer: v.customer,
        deviceText: [device.brand, device.model].filter(Boolean).join(' '),
      }
    }),
    ...reminders.map((r) => {
      const device = r.workOrder?.device || {}
      return {
        kind: r.type === 'warranty_check' ? 'warranty' : 'maintenance',
        id: r.id,
        date: r.dueDate,
        title: r.title,
        customer: r.customer,
        deviceText: [device.brand, device.model].filter(Boolean).join(' '),
      }
    }),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  if (items.length === 0) return null

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-medium">Servicios programados</h2>
          <Badge variant="outline" className="ml-1 text-xs">{items.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onOpenAll}>
          Ver todos <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="divide-y">
        {items.map((it) => {
          const d = new Date(it.date)
          const isOverdue = d < todayStart
          const isToday = !isOverdue && d.toDateString() === todayStart.toDateString()
          const Icon = it.kind === 'visit' ? CalendarClock : it.kind === 'warranty' ? ShieldCheck : Wrench
          return (
            <div
              key={`${it.kind}-${it.id}`}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
              onClick={() => (it.kind === 'visit' ? onOpenVisit(it.id) : onOpenReminder())}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  isOverdue
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                    : isToday
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {it.kind === 'visit' ? it.code : it.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {it.customer?.firstName} {it.customer?.lastName}
                  {it.deviceText ? ` · ${it.deviceText}` : ''}
                </p>
                <p
                  className={cn(
                    'text-[11px]',
                    isOverdue ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                  )}
                >
                  {isOverdue ? 'Vencido' : isToday ? 'Hoy' : formatDate(it.date)} · {formatTime(it.date)}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
          )
        })}
      </div>
    </Card>
  )
}
