'use client'

import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Send,
  Copy,
  Check,
  X,
  Plus,
  Minus,
  Loader2,
  CheckCircle2,
  MessageSquare,
  UserCog,
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  Clock,
  Calendar,
  User as UserIcon,
  Wrench,
  DollarSign,
  Link as LinkIcon,
  Package,
  PackageSearch,
  History,
  AlertTriangle,
  Receipt,
  FileCheck,
  BookOpen,
  Sparkles,
  BookmarkPlus,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { StatusBadge, PriorityBadge, QuoteStatusBadge, InvoiceStatusBadge, ReminderStatusBadge } from '@/components/tallerflow/badges'
import { useAppStore } from '@/store/app-store'
import {
  useWorkOrder,
  useWorkOrderMutations,
  useUsers,
  useQuoteMutations,
  useInvoiceMutations,
  useRepairGuideSuggestions,
  useRepairGuideMutations,
  useSettings,
  useParts,
  usePartMutations,
  useReminders,
} from '@/lib/hooks/api'
import {
  WORK_ORDER_STATUS,
  PRIORITY,
  DEVICE_TYPES,
  QUOTE_STATUS,
  REMINDER_TYPES,
  getNextStatuses,
  getFlowStages,
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  fullName,
  pluralizeUnit,
  type WorkOrderStatusKey,
  type PriorityKey,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

// ============== Device type icon helper ==============
const DEVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  Wrench,
}

function DeviceTypeIcon({ type, className }: { type: string; className?: string }) {
  const conf = (DEVICE_TYPES as any)[type] || DEVICE_TYPES.other
  const Icon = DEVICE_ICONS[conf.icon] || Wrench
  return <Icon className={className} />
}

// ============== Timeline icon helper ==============
function TimelineIcon({ type }: { type: string }) {
  switch (type) {
    case 'status_change':
      return <CheckCircle2 className="size-3.5 text-emerald-500" />
    case 'note':
      return <MessageSquare className="size-3.5 text-sky-500" />
    case 'assignment':
      return <UserCog className="size-3.5 text-violet-500" />
    case 'diagnosis_update':
      return <FileText className="size-3.5 text-amber-500" />
    default:
      return <CheckCircle2 className="size-3.5 text-muted-foreground" />
  }
}

// ============== Main Detail View ==============
export function WorkOrderDetailView() {
  const { navigate, selectedWorkOrderId } = useAppStore()
  const { data, isLoading, isError } = useWorkOrder(selectedWorkOrderId)
  const { patch, remove, update } = useWorkOrderMutations()
  const { update: updateQuote } = useQuoteMutations()
  const { data: settings } = useSettings()
  const { data: orderReminders } = useReminders({ workOrderId: selectedWorkOrderId || undefined })

  const [editOpen, setEditOpen] = React.useState(false)
  const [createQuoteOpen, setCreateQuoteOpen] = React.useState(false)
  const [assignTechOpen, setAssignTechOpen] = React.useState(false)
  const [diagnosisOpen, setDiagnosisOpen] = React.useState(false)
  const [saveGuideOpen, setSaveGuideOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [createInvoiceOpen, setCreateInvoiceOpen] = React.useState(false)
  const [viewQuote, setViewQuote] = React.useState<any | null>(null)
  const [addPartOpen, setAddPartOpen] = React.useState(false)
  const [statusToConfirm, setStatusToConfirm] = React.useState<WorkOrderStatusKey | null>(null)
  const [deliverOpen, setDeliverOpen] = React.useState(false)

  const order: any = data

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('work-orders')}>
          <ArrowLeft className="size-4" /> Volver a Órdenes
        </Button>
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('work-orders')}>
          <ArrowLeft className="size-4" /> Volver a Órdenes
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <AlertTriangle className="size-8 text-rose-500" />
            <p className="text-sm text-muted-foreground">
              No se pudo cargar la orden. Puede que haya sido eliminada.
            </p>
            <Button onClick={() => navigate('work-orders')} variant="outline">
              Volver a Órdenes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConf = WORK_ORDER_STATUS[order.status as WorkOrderStatusKey]
  const nextStatuses = getNextStatuses(order.status as WorkOrderStatusKey, order.serviceType)
  const flowStages = getFlowStages(order.serviceType)
  // Servicios con flujo corto no manejan cotización
  const hasQuoteStage = flowStages.includes('quoted')
  // Revisión usa aprobación manual directa: no se crean cotizaciones nuevas
  const isRevision = order.serviceType === 'revision'
  const canDelete = ['received', 'cancelled'].includes(order.status)
  const balance = (order.totalAmount || 0) - (order.totalPaid || 0)

  const changeStatus = (
    newStatus: WorkOrderStatusKey,
    extra?: { reminders?: Array<{ type: string; daysAfter: number; channel?: string }>; skipAutoReminders?: boolean }
  ) => {
    patch.mutate(
      { id: order.id, data: { action: 'change_status', status: newStatus, ...extra } },
      {
        onSuccess: () => {
          toast.success(`Estado cambiado a "${WORK_ORDER_STATUS[newStatus].label}"`)
          if (extra?.reminders && extra.reminders.length > 0) {
            toast.success(`${extra.reminders.length} recordatorio${extra.reminders.length > 1 ? 's' : ''} programado${extra.reminders.length > 1 ? 's' : ''}`)
          }
        },
      }
    )
  }

  // Estados terminales requieren confirmación porque notifican al cliente por WhatsApp
  const confirmStatus = (newStatus: WorkOrderStatusKey) => {
    if (newStatus === 'delivered') {
      setDeliverOpen(true)
      return
    }
    if (newStatus === 'cancelled') {
      setStatusToConfirm(newStatus)
      return
    }
    changeStatus(newStatus)
  }

  const copyApprovalLink = (q: any) => {
    const url = `${window.location.origin}/?quote=${q.id}&token=${q.approvalToken}`
    navigator.clipboard.writeText(url)
    toast.success('Enlace copiado al portapapeles')
  }

  const sendQuote = (q: any) => {
    updateQuote.mutate(
      { id: q.id, data: { action: 'send' } }
    )
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => navigate('work-orders')}>
        <ArrowLeft className="size-4" /> Volver a Órdenes
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.code}</h1>
            <StatusBadge status={order.status} />
            <PriorityBadge priority={order.priority} />
          </div>
          <p className="text-sm text-muted-foreground">
            Creada {timeAgo(order.createdAt)} · Recibida {formatDateTime(order.receivedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Change status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Cambiar estado
                <ChevronRight className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Cambiar a…</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {nextStatuses.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                  No hay estados siguientes disponibles
                </div>
              ) : (
                nextStatuses.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => confirmStatus(s)}
                    disabled={patch.isPending}
                  >
                    <span className={cn('size-1.5 rounded-full', WORK_ORDER_STATUS[s].dot)} />
                    {WORK_ORDER_STATUS[s].label}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasQuoteStage && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setCreateQuoteOpen(true)}
            >
              <FileText className="size-3.5" />
              Crear cotización
            </Button>
          )}

          {order.status === 'delivered' && !order.invoice && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              onClick={() => setCreateInvoiceOpen(true)}
            >
              <FileCheck className="size-3.5" />
              Generar factura
            </Button>
          )}

          {order.invoice && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate('invoices')}
            >
              <Receipt className="size-3.5" />
              Ver factura
            </Button>
          )}

          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-rose-600 hover:text-rose-700"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-4 lg:col-span-2">
          {/* Información de la Orden */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Información de la Orden</CardTitle>
                <CardDescription>Detalles del problema y diagnóstico</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" />
                Editar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Problema reportado
                </p>
                <p className="text-sm whitespace-pre-wrap">{order.reportedIssue}</p>
              </div>

              {order.diagnosisText && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Diagnóstico
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{order.diagnosisText}</p>
                </div>
              )}

              {order.internalNotes && (
                <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-950/20">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Notas internas
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-200">
                    {order.internalNotes}
                  </p>
                </div>
              )}

              <Separator />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DateField icon={<Calendar className="size-3.5" />} label="Recibida" value={formatDate(order.receivedAt)} />
                <DateField
                  icon={<Clock className="size-3.5" />}
                  label="Estimada"
                  value={order.estimatedDoneAt ? formatDate(order.estimatedDoneAt) : '—'}
                />
                <DateField
                  icon={<Check className="size-3.5" />}
                  label="Entregada"
                  value={order.deliveredAt ? formatDate(order.deliveredAt) : '—'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cliente y Equipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente y Equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Cliente */}
                <button
                  className="group space-y-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40"
                  onClick={() => navigate('customer-detail', { customerId: order.customer?.id })}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700">
                      {(order.customer?.firstName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {fullName(order.customer?.firstName, order.customer?.lastName)}
                      </p>
                      <p className="text-xs text-muted-foreground">Ver detalle</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <div className="space-y-1 text-xs">
                    {order.customer?.phone && (
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <UserIcon className="size-3" /> {order.customer.phone}
                      </p>
                    )}
                    {order.customer?.email && (
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="size-3" /> {order.customer.email}
                      </p>
                    )}
                    {order.customer?.documentId && (
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="size-3" /> {order.customer.documentId}
                      </p>
                    )}
                  </div>
                </button>

                {/* Equipo */}
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <DeviceTypeIcon type={order.device?.type} className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {DEVICE_TYPES[order.device?.type as keyof typeof DEVICE_TYPES]?.label || 'Equipo'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[order.device?.brand, order.device?.model].filter(Boolean).join(' ') || 'Sin modelo'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    {order.device?.serial && (
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-mono">S/N: {order.device.serial}</span>
                      </p>
                    )}
                    {order.device?.accessories && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Accesorios:</span> {order.device.accessories}
                      </p>
                    )}
                    {order.device?.notes && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Notas:</span> {order.device.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-4" />
                Línea de Tiempo
              </CardTitle>
              <CardDescription>Eventos y cambios registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {!order.timeline || order.timeline.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay eventos registrados.
                </p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                  <ul className="space-y-5">
                    {[...order.timeline].reverse().map((ev: any) => (
                      <li key={ev.id} className="relative pl-8">
                        <div className="absolute left-0 top-0.5 flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted">
                          <TimelineIcon type={ev.eventType} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{ev?.title ?? ''}</p>
                            {ev.toStatus && (
                              <StatusBadge status={ev.toStatus} className="py-0" />
                            )}
                          </div>
                          {ev.description && (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {ev.description}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            {ev.createdBy && <span>{ev.createdBy} · </span>}
                            {timeAgo(ev.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cotizaciones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Cotizaciones</CardTitle>
                <CardDescription>
                  {order.quotes?.length || 0} cotización(es) para esta orden
                </CardDescription>
              </div>
              {!isRevision && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCreateQuoteOpen(true)}>
                  <Plus className="size-3.5" /> Nueva
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!order.quotes || order.quotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sin cotizaciones</p>
                    {isRevision ? (
                      <p className="text-xs text-muted-foreground">
                        Aprobación manual — esta orden avanza directamente de Recibida a Aprobada.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Crea una para enviarla al cliente.
                      </p>
                    )}
                  </div>
                  {!isRevision && (
                    <Button size="sm" className="gap-1.5" onClick={() => setCreateQuoteOpen(true)}>
                      <Plus className="size-4" /> Crear cotización
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {order.quotes.map((q: any) => (
                    <div
                      key={q.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-medium">{q.code}</p>
                            <QuoteStatusBadge status={q.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {q.items?.length || 0} ítem(s) · {formatCurrency(q.total || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setViewQuote(q)}>
                          <Eye className="size-3.5" /> Ver
                        </Button>
                        {q.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => sendQuote(q)}
                          >
                            <Send className="size-3.5" /> Enviar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => copyApprovalLink(q)}
                        >
                          <LinkIcon className="size-3.5" /> Enlace
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Estado Actual */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge status={order.status} className="text-sm" />
              {statusConf?.step != null && statusConf.step >= 0 && (
                <div className="space-y-1.5">
                  <StatusStepper statusKey={order.status as WorkOrderStatusKey} stages={flowStages} />
                  <p className="text-xs text-muted-foreground">{statusConf.description}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Avanzar estado
                </p>
                {nextStatuses.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin transiciones disponibles.</p>
                ) : (
                  <div className="grid gap-1.5">
                    {nextStatuses.map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() => confirmStatus(s)}
                        disabled={patch.isPending}
                      >
                        <span className={cn('size-1.5 rounded-full', WORK_ORDER_STATUS[s].dot)} />
                        {WORK_ORDER_STATUS[s].label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Técnico Asignado */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Técnico Asignado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.technician ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-sm font-medium text-violet-700">
                    {(order.technician.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{order.technician.name}</p>
                    {order.technician.email && (
                      <p className="text-xs text-muted-foreground">{order.technician.email}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                    <Wrench className="size-4" />
                  </div>
                  <p className="text-sm">Sin asignar</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={() => setAssignTechOpen(true)}
              >
                <UserCog className="size-3.5" />
                {order.technician ? 'Cambiar técnico' : 'Asignar técnico'}
              </Button>
            </CardContent>
          </Card>

          {/* Recordatorios */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="size-4" />
                Recordatorios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!orderReminders || orderReminders.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sin recordatorios para esta orden. Se programan al entregar el servicio.
                </p>
              ) : (
                <div className="space-y-2">
                  {orderReminders.map((r: any) => (
                    <div key={r.id} className="rounded-md border p-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{r.title}</p>
                        <ReminderStatusBadge status={r.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {REMINDER_TYPES[r.type as keyof typeof REMINDER_TYPES]?.label || r.type} · vence {formatDate(r.dueDate)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={() => navigate('reminders')}
              >
                <Clock className="size-3.5" />
                Ver módulo de Recordatorios
              </Button>
            </CardContent>
          </Card>

          {/* Resumen Financiero */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="size-4" />
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.invoice && (
                <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Receipt className="size-4 text-emerald-600" />
                      <button
                        className="font-mono text-sm font-semibold hover:underline"
                        onClick={() => navigate('invoices')}
                      >
                        {order.invoice.code}
                      </button>
                    </div>
                    <InvoiceStatusBadge status={order.invoice.status} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total factura</span>
                    <span className="font-semibold">{formatCurrency(order.invoice.total)}</span>
                  </div>
                  {order.invoice.paid > 0 && order.invoice.paid < order.invoice.total && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Pagado</span>
                      <span className="text-emerald-600">{formatCurrency(order.invoice.paid)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total orden</span>
                <span className="font-medium tabular-nums">{formatCurrency(order.totalAmount || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pagado</span>
                <span className="font-medium tabular-nums text-emerald-600">
                  {formatCurrency(order.totalPaid || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saldo</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                  )}
                >
                  {formatCurrency(balance)}
                </span>
              </div>
              {order.totalAmount > 0 && (
                <div className="pt-1">
                  {balance <= 0 ? (
                    <Badge className="bg-emerald-100 text-emerald-700">Pagada</Badge>
                  ) : order.totalPaid > 0 ? (
                    <Badge className="bg-sky-100 text-sky-700">Pago parcial</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700">Pendiente de pago</Badge>
                  )}
                </div>
              )}
              {order.status === 'delivered' && !order.invoice && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  onClick={() => setCreateInvoiceOpen(true)}
                >
                  <FileCheck className="size-3.5" />
                  Generar factura
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Diagnóstico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.diagnosis ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Hallazgos</p>
                    <p className="whitespace-pre-wrap">{order.diagnosis.findings}</p>
                  </div>
                  {order.diagnosis.rootCause && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Causa raíz</p>
                      <p className="whitespace-pre-wrap">{order.diagnosis.rootCause}</p>
                    </div>
                  )}
                  {order.diagnosis.recommendation && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Recomendación</p>
                      <p className="whitespace-pre-wrap">{order.diagnosis.recommendation}</p>
                    </div>
                  )}
                  {(order.diagnosis.laborHours > 0 || order.diagnosis.laborCost > 0) && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Horas: <strong className="text-foreground">{order.diagnosis.laborHours}h</strong></span>
                      <span>Mano de obra: <strong className="text-foreground">{formatCurrency(order.diagnosis.laborCost)}</strong></span>
                    </div>
                  )}
                  <Separator />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => setSaveGuideOpen(true)}
                  >
                    <BookmarkPlus className="size-3.5" />
                    Guardar como guía
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Sin diagnóstico.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => setDiagnosisOpen(true)}
                  >
                    <Plus className="size-3.5" /> Agregar diagnóstico
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Base de Conocimiento - Sugerencias */}
          <KnowledgeBaseCard order={order} onCreateGuide={() => setSaveGuideOpen(true)} />

          {/* Repuestos Utilizados */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="size-4" />
                  Repuestos Utilizados
                </CardTitle>
                <CardDescription>
                  Salidas del inventario vinculadas a esta orden
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => setAddPartOpen(true)}>
                <Plus className="size-4" /> Agregar
              </Button>
            </CardHeader>
            <CardContent>
              {!order.partsUsed || order.partsUsed.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setAddPartOpen(true)}
                  className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center transition-colors hover:bg-muted/50"
                >
                  <PackageSearch className="size-7 text-muted-foreground" />
                  <span className="text-sm font-medium">No se han registrado salidas de repuestos</span>
                  <span className="text-xs text-muted-foreground">Haz clic para tomar repuestos del inventario</span>
                </button>
              ) : (
                <>
                  <ul className="divide-y">
                    {order.partsUsed.map((m: any) => {
                      const subtotal = (m.part?.unitPrice || m.part?.unitCost || 0) * (m.quantity || 0)
                      return (
                        <li key={m.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{m.part?.name || 'Repuesto'}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {m.part?.sku}
                              {timeAgo(m.createdAt) && ` · ${timeAgo(m.createdAt)}`}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                              −{m.quantity}
                            </Badge>
                            {subtotal > 0 && (
                              <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                                ≈ {formatCurrency(subtotal, settings?.currencySymbol || '$')}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    El valor es referencial; la cobranza se gestiona vía cotización o factura.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <EditOrderDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        order={order}
      />
      <CreateQuoteDialog
        open={createQuoteOpen}
        onOpenChange={setCreateQuoteOpen}
        workOrderId={order.id}
      />
      <AssignTechDialog
        open={assignTechOpen}
        onOpenChange={setAssignTechOpen}
        order={order}
      />
      <DiagnosisDialog
        open={diagnosisOpen}
        onOpenChange={setDiagnosisOpen}
        order={order}
      />
      <SaveAsGuideDialog
        open={saveGuideOpen}
        onOpenChange={setSaveGuideOpen}
        order={order}
      />
      <AddPartDialog
        open={addPartOpen}
        onOpenChange={setAddPartOpen}
        order={order}
      />

      {/* Entrega de servicio: recordatorios post-entrega */}
      <DeliverOrderDialog
        open={deliverOpen}
        onOpenChange={setDeliverOpen}
        order={order}
        isPending={patch.isPending}
        onConfirm={(reminders) =>
          changeStatus('delivered', { reminders, skipAutoReminders: true })
        }
      />

      {/* Confirmación de estados terminales (notifican al cliente) */}
      <AlertDialog
        open={!!statusToConfirm}
        onOpenChange={(o) => !o && setStatusToConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Marcar la orden como "{statusToConfirm ? WORK_ORDER_STATUS[statusToConfirm].label : ''}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El cliente recibirá una notificación automática por WhatsApp y el cambio quedará registrado en el historial de la orden.
              {statusToConfirm === 'delivered' && ' Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (statusToConfirm) changeStatus(statusToConfirm)
                setStatusToConfirm(null)
              }}
              className={cn(
                statusToConfirm === 'cancelled' && 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-600'
              )}
            >
              Sí, confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ViewQuoteDialog
        quote={viewQuote}
        onOpenChange={(v) => !v && setViewQuote(null)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden {order.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la orden,
              su línea de tiempo, cotizaciones y movimientos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                remove.mutate(order.id, {
                  onSuccess: () => navigate('work-orders'),
                })
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create invoice dialog */}
      {createInvoiceOpen && (
        <CreateInvoiceFromOrderDialog
          open={createInvoiceOpen}
          onOpenChange={setCreateInvoiceOpen}
          order={order}
        />
      )}
    </div>
  )
}

// ============== Sub-components ==============

function DateField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-0.5">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

// ============== Edit Dialog ==============
function EditOrderDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  order: any
}) {
  const { update } = useWorkOrderMutations()
  const { data: users } = useUsers()

  const [reportedIssue, setReportedIssue] = React.useState('')
  const [internalNotes, setInternalNotes] = React.useState('')
  const [priority, setPriority] = React.useState<PriorityKey>('normal')
  const [estimatedDoneAt, setEstimatedDoneAt] = React.useState('')
  const [technicianId, setTechnicianId] = React.useState('')

  React.useEffect(() => {
    if (open && order) {
      setReportedIssue(order.reportedIssue || '')
      setInternalNotes(order.internalNotes || '')
      setPriority(order.priority || 'normal')
      setTechnicianId(order.technicianId || '')
      setEstimatedDoneAt(
        order.estimatedDoneAt ? order.estimatedDoneAt.split('T')[0].slice(0, 10) : ''
      )
    }
  }, [open, order])

  const technicians: any[] = (users || []).filter(
    (u: any) => u.role === 'technician' || u.role === 'admin'
  )

  const handleSave = () => {
    const data: any = {
      reportedIssue: reportedIssue.trim(),
      internalNotes: internalNotes.trim() || null,
      priority,
      technicianId: technicianId || null,
      estimatedDoneAt: estimatedDoneAt
        ? new Date(estimatedDoneAt).toISOString()
        : null,
    }
    update.mutate(
      { id: order.id, data },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Orden</DialogTitle>
          <DialogDescription>Modifica la información de la orden.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Problema reportado</Label>
            <Textarea
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Notas internas</Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as PriorityKey)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY) as PriorityKey[]).map((k) => (
                    <SelectItem key={k} value={k}>{PRIORITY[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Técnico</Label>
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fecha estimada</Label>
            <Input
              type="date"
              value={estimatedDoneAt}
              onChange={(e) => setEstimatedDoneAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={update.isPending} className="gap-2">
            {update.isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Assign Technician Dialog ==============
function AssignTechDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  order: any
}) {
  const { patch } = useWorkOrderMutations()
  const { data: users } = useUsers()
  const [techId, setTechId] = React.useState('')

  React.useEffect(() => {
    if (open && order) setTechId(order.technicianId || '')
  }, [open, order])

  const technicians: any[] = (users || []).filter(
    (u: any) => u.role === 'technician' || u.role === 'admin'
  )

  const handleSave = () => {
    patch.mutate(
      { id: order.id, data: { action: 'assign_technician', technicianId: techId } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Técnico</DialogTitle>
          <DialogDescription>Selecciona el técnico responsable.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Técnico</Label>
          <Select value={techId} onValueChange={setTechId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!techId || patch.isPending} className="gap-2">
            {patch.isPending && <Loader2 className="size-4 animate-spin" />}
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Deliver Order Dialog ==============
function DeliverOrderDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  isPending,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  order: any
  onConfirm: (reminders: Array<{ type: string; daysAfter: number; channel?: string }>) => void
  isPending: boolean
}) {
  const [maintenanceEnabled, setMaintenanceEnabled] = React.useState(true)
  const [maintenanceDays, setMaintenanceDays] = React.useState(180)
  const [reviewEnabled, setReviewEnabled] = React.useState(true)
  const [reviewDays, setReviewDays] = React.useState(3)

  React.useEffect(() => {
    if (open) {
      setMaintenanceEnabled(true)
      setMaintenanceDays(180)
      setReviewEnabled(true)
      setReviewDays(3)
    }
  }, [open])

  const maintenanceDue = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + (maintenanceDays || 0))
    return d
  }, [maintenanceDays])

  const reviewDue = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + (reviewDays || 0))
    return d
  }, [reviewDays])

  const handleConfirm = () => {
    const reminders: Array<{ type: string; daysAfter: number; channel?: string }> = []
    if (maintenanceEnabled) reminders.push({ type: 'maintenance', daysAfter: maintenanceDays || 0, channel: 'whatsapp' })
    if (reviewEnabled) reminders.push({ type: 'service_review', daysAfter: reviewDays || 0, channel: 'whatsapp' })
    onConfirm(reminders)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            Entregar servicio
          </DialogTitle>
          <DialogDescription>
            La orden {order?.code} se marcará como entregada y el cliente recibirá la notificación por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recordatorios post-entrega
          </p>

          {/* Próximo mantenimiento */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="deliver-maintenance"
                checked={maintenanceEnabled}
                onCheckedChange={(v) => setMaintenanceEnabled(v === true)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="deliver-maintenance" className="flex items-center gap-1.5 font-medium cursor-pointer">
                  <Wrench className="size-3.5 text-teal-500" />
                  Próximo mantenimiento
                </Label>
                {maintenanceEnabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={maintenanceDays}
                      onChange={(e) => setMaintenanceDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">
                      días → vence {formatDate(maintenanceDue)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Solicitud de reseña */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="deliver-review"
                checked={reviewEnabled}
                onCheckedChange={(v) => setReviewEnabled(v === true)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="deliver-review" className="flex items-center gap-1.5 font-medium cursor-pointer">
                  <Sparkles className="size-3.5 text-amber-500" />
                  Solicitud de reseña
                </Label>
                {reviewEnabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={reviewDays}
                      onChange={(e) => setReviewDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">
                      días → vence {formatDate(reviewDue)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Esta acción no se puede deshacer. Los recordatorios aparecerán en el módulo de Recordatorios.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Diagnosis Dialog ==============
function DiagnosisDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  order: any
}) {
  const { update } = useWorkOrderMutations()
  const [text, setText] = React.useState('')

  React.useEffect(() => {
    if (open && order) setText(order.diagnosisText || '')
  }, [open, order])

  const handleSave = () => {
    update.mutate(
      { id: order.id, data: { diagnosisText: text.trim() || null } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Diagnóstico</DialogTitle>
          <DialogDescription>
            Registra el diagnóstico técnico de la orden.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Diagnóstico</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Describe los hallazgos, causa raíz y recomendación…"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={update.isPending} className="gap-2">
            {update.isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Base de Conocimiento (sugerencias) ==============
function KnowledgeBaseCard({ order, onCreateGuide }: { order: any; onCreateGuide: () => void }) {
  const deviceType = order.device?.type || ''
  const symptom = order.diagnosis?.findings || order.diagnosisText || ''
  const { data: suggestions = [], isLoading } = useRepairGuideSuggestions({
    applianceType: deviceType,
    brand: order.device?.brand,
    model: order.device?.model,
    symptom: symptom.slice(0, 200),
    enabled: !!deviceType,
  })
  const { update } = useRepairGuideMutations()
  const [viewGuide, setViewGuide] = React.useState<any | null>(null)

  const list = (suggestions as any[]).slice(0, 4)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4 text-violet-500" />
          Base de conocimiento
        </CardTitle>
        <CardDescription>
          Guías relacionadas con este equipo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!deviceType ? (
          <p className="text-sm text-muted-foreground">
            Agrega un equipo a la orden para ver guías sugeridas.
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : list.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Sin guías para este equipo todavía.
            </p>
            {order.diagnosis && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={onCreateGuide}
              >
                <Sparkles className="size-3.5" />
                Crear guía desde el diagnóstico
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((g: any) => {
              const dt = (DEVICE_TYPES as any)[g.applianceType]
              return (
                <div
                  key={g.id}
                  className="flex items-start justify-between gap-2 rounded-lg border p-2.5"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium">{g.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {dt && <span>{dt.label}</span>}
                      {g.brand && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{g.brand}</span>
                        </>
                      )}
                      {g.estimatedHours > 0 && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{g.estimatedHours}h</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => {
                      setViewGuide(g)
                      update.mutate({ id: g.id, data: { action: 'increment_usage' } })
                    }}
                  >
                    <Eye className="size-3.5" /> Ver
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <KBGuideViewDialog
        guide={viewGuide}
        onOpenChange={(v) => !v && setViewGuide(null)}
      />
    </Card>
  )
}

function KBGuideViewDialog({
  guide,
  onOpenChange,
}: {
  guide: any
  onOpenChange: (v: boolean) => void
}) {
  const open = !!guide
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        {guide && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8">{guide.title}</DialogTitle>
              {guide.summary && (
                <DialogDescription className="text-sm leading-relaxed">
                  {guide.summary}
                </DialogDescription>
              )}
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6 max-h-[55vh]">
              <div className="space-y-4 pb-2">
                {guide.symptoms && (
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Síntomas</p>
                    <p className="text-sm">{guide.symptoms}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Procedimiento</p>
                  <div className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
                    {guide.steps}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============== Guardar como guía ==============
function SaveAsGuideDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  order: any
}) {
  const { create } = useRepairGuideMutations()
  const [title, setTitle] = React.useState('')
  const [symptoms, setSymptoms] = React.useState('')
  const [steps, setSteps] = React.useState('')

  const deviceType = order.device?.type || 'other'
  const dt = (DEVICE_TYPES as any)[deviceType]

  React.useEffect(() => {
    if (open && order) {
      const diag = order.diagnosis
      const base = diag
        ? [diag.findings, diag.rootCause, diag.recommendation].filter(Boolean).join('\n\n')
        : order.diagnosisText || ''
      const brand = order.device?.brand ? ` ${order.device.brand}` : ''
      setTitle(`Reparación${brand} ${dt?.label || 'equipo'}`.trim())
      setSymptoms(diag?.findings || '')
      setSteps(base)
    }
  }, [open, order, dt?.label])

  const handleSubmit = () => {
    if (!title.trim() || !steps.trim()) {
      toast.error('Título y procedimiento son obligatorios')
      return
    }
    create.mutate(
      {
        title: title.trim(),
        summary: null,
        applianceType: deviceType,
        brand: order.device?.brand || null,
        model: order.device?.model || null,
        symptoms: symptoms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        steps: steps.trim(),
        difficulty: 'media',
        estimatedHours: order.diagnosis?.laborHours || 1,
        partsUsed: (order.partsUsed || []).map((m: any) => ({
          partId: m.partId,
          name: m.part?.name || 'Repuesto',
          qty: m.quantity,
        })),
        status: 'draft',
        sourceWorkOrderId: order.id,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Guardar como guía
          </DialogTitle>
          <DialogDescription>
            Crea una guía de reparación reutilizable a partir del diagnóstico de esta orden. Se
            guardará como borrador para que la revises antes de publicarla.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Síntomas (separados por coma)</Label>
            <Input
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="no desagua, hace ruido, no enciende"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Procedimiento</Label>
            <Textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={8}
              placeholder="1. Desconectar el equipo.\n2. …"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={create.isPending} className="gap-2">
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            <BookmarkPlus className="size-4" />
            Guardar guía
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Create Quote Dialog ==============
interface QuoteItemDraft {
  itemType: string
  description: string
  quantity: string
  unitPrice: string
}

function CreateQuoteDialog({
  open,
  onOpenChange,
  workOrderId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  workOrderId: string
}) {
  const { create } = useQuoteMutations()
  const [items, setItems] = React.useState<QuoteItemDraft[]>([
    { itemType: 'labor', description: '', quantity: '1', unitPrice: '0' },
  ])
  const [notes, setNotes] = React.useState('')
  const [sendImmediately, setSendImmediately] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setItems([{ itemType: 'labor', description: '', quantity: '1', unitPrice: '0' }])
      setNotes('')
      setSendImmediately(false)
    }
  }, [open])

  const TAX_RATE = 0.19

  const subtotal = items.reduce(
    (acc, it) => acc + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0),
    0
  )
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  const updateItem = (idx: number, patch: Partial<QuoteItemDraft>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { itemType: 'labor', description: '', quantity: '1', unitPrice: '0' },
    ])
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx))

  const canSubmit = items.some(
    (it) => it.description.trim() && (parseFloat(it.quantity) || 0) > 0
  )

  const handleSubmit = () => {
    const cleanItems = items
      .filter((it) => it.description.trim())
      .map((it) => ({
        itemType: it.itemType,
        description: it.description.trim(),
        quantity: parseFloat(it.quantity) || 1,
        unitPrice: parseFloat(it.unitPrice) || 0,
      }))

    create.mutate(
      {
        workOrderId,
        items: cleanItems,
        notes: notes.trim() || undefined,
        sendImmediately,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear cotización</DialogTitle>
          <DialogDescription>
            Define los ítems (repuestos, mano de obra, otros). IVA 19% aplicado.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3">
            {items.map((it, idx) => {
              const lineTotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)
              return (
                <div
                  key={idx}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Ítem #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-rose-500"
                        onClick={() => removeItem(idx)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <div className="sm:col-span-3">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={it.itemType}
                        onValueChange={(v) => updateItem(idx, { itemType: v })}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="part">Repuesto</SelectItem>
                          <SelectItem value="labor">Mano de obra</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-9">
                      <Label className="text-xs">Descripción</Label>
                      <Input
                        className="h-8"
                        value={it.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        placeholder="Describe el ítem…"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        className="h-8"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Label className="text-xs">Precio unit.</Label>
                      <Input
                        type="number"
                        className="h-8"
                        value={it.unitPrice}
                        onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                        min="0"
                        step="100"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <Label className="text-xs">Total</Label>
                      <div className="flex h-8 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium tabular-nums">
                        {formatCurrency(lineTotal)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addItem}>
              <Plus className="size-4" /> Agregar ítem
            </Button>
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Condiciones, garantía, etc."
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={sendImmediately}
              onChange={(e) => setSendImmediately(e.target.checked)}
              className="size-4 rounded border-input"
            />
            Enviar inmediatamente al cliente
          </label>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (19%)</span>
              <span className="tabular-nums">{formatCurrency(tax)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || create.isPending}
            className="gap-2"
          >
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            {sendImmediately ? 'Crear y enviar' : 'Crear cotización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== View Quote Dialog ==============
function ViewQuoteDialog({
  quote,
  onOpenChange,
}: {
  quote: any | null
  onOpenChange: (v: boolean) => void
}) {
  const { data: settings } = useSettings()
  if (!quote) return null

  const copyLink = () => {
    const url = `${window.location.origin}/?quote=${quote.id}&token=${quote.approvalToken}`
    navigator.clipboard.writeText(url)
    toast.success('Enlace copiado al portapapeles')
  }

  return (
    <Dialog open={!!quote} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="font-mono">{quote.code}</DialogTitle>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <DialogDescription>
            Cotización creada {timeAgo(quote.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-4">
            <div className="rounded-md border p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">
                    {fullName(quote.workOrder?.customer?.firstName, quote.workOrder?.customer?.lastName)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Equipo</p>
                  <p className="font-medium">
                    {[quote.workOrder?.device?.brand, quote.workOrder?.device?.model].filter(Boolean).join(' ') || '—'}
                  </p>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(quote.items || []).map((it: any) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <p className="text-sm">{it.description}</p>
                      <p className="text-xs text-muted-foreground">{{ part: 'Repuesto', labor: 'Mano de obra', other: 'Otro' }[it.itemType as 'part' | 'labor' | 'other'] ?? it.itemType}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(it.unitPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(it.total)}</TableCell>
                  </TableRow>
                ))}
                {(!quote.items || quote.items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                      Sin ítems
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(quote.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span className="tabular-nums">{formatCurrency(quote.tax || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(quote.total || 0)}</span>
              </div>
            </div>

            {quote.notes && (
              <div className="rounded-md bg-muted/30 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Notas</p>
                <p className="whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}

            {settings?.warrantyPolicy && (
              <div className="rounded-md bg-emerald-50 p-3 text-sm dark:bg-emerald-950/20">
                <p className="text-xs font-medium text-emerald-700">Política de garantías</p>
                <p className="mt-0.5 whitespace-pre-wrap text-emerald-900 dark:text-emerald-200">{settings.warrantyPolicy}</p>
              </div>
            )}

            {quote.validUntil && (
              <p className="text-xs text-muted-foreground">
                Válida hasta: {formatDate(quote.validUntil)}
              </p>
            )}
            {quote.approvedBy && (
              <p className="text-xs text-emerald-600">
                Aprobada por: {quote.approvedBy}
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink}>
            <LinkIcon className="size-3.5" /> Copiar enlace de aprobación
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Create Invoice from Order Dialog ==============
function CreateInvoiceFromOrderDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
}) {
  const { create } = useInvoiceMutations()
  const [items, setItems] = React.useState<any[]>([])
  const [paid, setPaid] = React.useState('0')
  const [paymentMethod, setPaymentMethod] = React.useState('cash')
  const [notes, setNotes] = React.useState('')
  const [applyIva, setApplyIva] = React.useState(true)

  // Initialize items from approved quote or work order total
  React.useEffect(() => {
    if (!open) return
    const approvedQuote = order?.quotes?.find((q: any) => q.status === 'approved') || order?.quotes?.[0]
    if (approvedQuote?.items?.length > 0) {
      setItems(approvedQuote.items.map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        itemType: it.itemType || 'other',
      })))
    } else if (order?.totalAmount > 0) {
      setItems([{
        description: `Servicio de reparación - ${order.code}`,
        quantity: 1,
        unitPrice: order.totalAmount,
        itemType: 'other',
      }])
    } else {
      setItems([{ description: '', quantity: 1, unitPrice: 0 }])
    }
    setPaid('0')
    setPaymentMethod('cash')
    setNotes('')
    setApplyIva(true)
  }, [open, order])

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  const taxRate = 19
  const taxAmount = applyIva ? subtotal * (taxRate / 100) : 0
  const total = subtotal + taxAmount
  const paidAmount = Number(paid) || 0

  const updateItem = (idx: number, field: string, value: string) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }
  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const valid = items.length > 0 && items.every((it) => it.description.trim() !== '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    create.mutate(
      {
        workOrderId: order.id,
        customerId: order.customerId,
        items: items.map((it) => ({
          itemType: it.itemType || 'other',
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })),
        paid: paidAmount,
        paymentMethod: paidAmount > 0 ? paymentMethod : null,
        applyTax: applyIva,
        notes: notes || null,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="size-5 text-emerald-600" />
            Generar factura
          </DialogTitle>
          <DialogDescription>
            Crea una factura para la orden <span className="font-mono font-medium">{order.code}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Customer info */}
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{order.customer?.firstName} {order.customer?.lastName}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-muted-foreground">Equipo:</span>
              <span>{order.device?.brand} {order.device?.model}</span>
            </div>
          </div>

          {/* Items */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Ítems de la factura</Label>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addItem}>
                <Plus className="size-3.5" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 rounded-md border bg-muted/20 p-2">
                  <Input
                    className="col-span-12 sm:col-span-6"
                    placeholder="Descripción"
                    value={it.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                  <Input
                    className="col-span-4 sm:col-span-2"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Cant."
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                  <Input
                    className="col-span-6 sm:col-span-3"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio"
                    value={it.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                  />
                  <div className="col-span-1 flex items-center justify-center">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-rose-500 hover:text-rose-600"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IVA opcional */}
          <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="apply-iva" className="text-sm">Aplicar IVA (19%)</Label>
              <p className="text-[11px] text-muted-foreground">
                Desactívalo para facturar sin impuesto
              </p>
            </div>
            <Switch id="apply-iva" checked={applyIva} onCheckedChange={setApplyIva} />
          </div>

          {/* Totals */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {applyIva ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>IVA</span>
                <span>Exento</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t pt-1 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="inv-paid">Pago inicial</Label>
              <Input
                id="inv-paid"
                type="number"
                min="0"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder="0"
              />
              <p className="text-[11px] text-muted-foreground">
                {paidAmount === 0 ? 'Pendiente' : paidAmount >= total ? 'Pagada' : 'Pago parcial'}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Método</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paidAmount === 0}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="inv-notes">Notas</Label>
            <Textarea
              id="inv-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={!valid || create.isPending} className="gap-1.5">
              <FileCheck className="size-4" />
              {create.isPending ? 'Generando...' : 'Generar factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== Agregar Repuesto desde Inventario ==============
function AddPartDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
}) {
  const qc = useQueryClient()
  const { data: settings } = useSettings()
  const { update } = usePartMutations()

  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [selected, setSelected] = React.useState<any | null>(null)
  const [qty, setQty] = React.useState('1')

  React.useEffect(() => {
    if (!open) {
      setSelected(null)
      setQty('1')
      setSearch('')
      setDebouncedSearch('')
    }
  }, [open])

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: parts, isLoading } = useParts(
    open && debouncedSearch ? { search: debouncedSearch } : {}
  )

  const quantity = Math.floor(Number(qty) || 0)
  const stock = selected ? selected.stock : 0
  const valid =
    !!selected && quantity >= 1 && quantity <= stock

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !selected) return
    update.mutate(
      {
        id: selected.id,
        data: {
          action: 'adjust_stock',
          quantity: -quantity,
          movementType: 'out',
          reason: `Salida por orden ${order.code}`,
          workOrderId: order.id,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ['work-orders'] })
          toast.success(
            `${quantity} × ${selected.name} descontado(s) del inventario`
          )
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid grid-rows-[auto_minmax(0,1fr)_auto] gap-4 h-[92dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Tomar repuesto del inventario
          </DialogTitle>
          <DialogDescription>
            Se registrará la salida y se descontará el stock de la orden{' '}
            <span className="font-mono">{order.code}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, SKU o marca…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Resultados */}
          <ScrollArea className="max-h-[240px] rounded-lg border sm:max-h-[280px]">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !parts || parts.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No se encontraron repuestos con «{debouncedSearch}»
              </p>
            ) : (
              <ul className="divide-y">
                {(parts as any[]).map((p) => {
                  const isSelected = selected?.id === p.id
                  const outOfStock = p.stock <= 0
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => {
                          setSelected(p)
                          setQty('1')
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors',
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/30'
                            : 'hover:bg-muted/60',
                          outOfStock && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.name}
                            {isSelected && (
                              <Check className="ml-1.5 inline size-3.5 text-emerald-600" />
                            )}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {p.sku}
                            {p.brand ? ` · ${p.brand}` : ''}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {outOfStock ? (
                            <Badge variant="outline" className="border-rose-200 text-[10px] text-rose-600 dark:border-rose-800 dark:text-rose-400">
                              Sin stock
                            </Badge>
                          ) : (
                            <>
                              <p className="text-xs font-medium tabular-nums">
                                Stock: {p.stock} {pluralizeUnit(p.unit, p.stock)}
                              </p>
                              <p className="text-[11px] text-muted-foreground tabular-nums">
                                {formatCurrency(p.unitPrice, settings?.currencySymbol || '$')}
                              </p>
                            </>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>

          {/* Selección + cantidad */}
          {selected && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{selected.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{selected.sku}</p>
                </div>
                <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => setSelected(null)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="part-qty" className="text-xs">Cantidad a usar</Label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setQty(String(Math.max(1, quantity - 1)))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <Input
                      id="part-qty"
                      type="number"
                      min={1}
                      max={stock}
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="h-8 w-16 text-center font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setQty(String(Math.min(stock, quantity + 1)))}
                      disabled={quantity >= stock}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="ml-auto pb-0.5 text-right text-xs text-muted-foreground">
                  <p>
                    Disponible: <span className="font-medium tabular-nums">{stock} {selected.unit}</span>
                  </p>
                  <p className={cn(quantity > stock && 'font-medium text-rose-600')}>
                    Quedaría:{' '}
                    <span className="font-medium tabular-nums">
                      {Math.max(0, stock - (quantity || 0))} {selected.unit}
                    </span>
                  </p>
                </div>
              </div>
              {quantity > stock && (
                <p className="text-xs font-medium text-rose-600">
                  Solo hay {stock} unidad(es) disponibles
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!valid || update.isPending} className="w-full gap-1.5 sm:w-auto">
            {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Package className="size-4" />}
            Registrar salida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



// ============== Stepper visual de estados (adaptativo por servicio) ==============
function StatusStepper({
  statusKey,
  stages,
}: {
  statusKey: WorkOrderStatusKey
  stages: WorkOrderStatusKey[]
}) {
  const currentIdx = stages.indexOf(statusKey)
  return (
    <ol className="space-y-0">
      {stages.map((key, idx) => {
        const conf = WORK_ORDER_STATUS[key]
        const done = idx < currentIdx
        const current = idx === currentIdx || (currentIdx === -1 && key === statusKey)
        const isLast = idx === stages.length - 1
        return (
          <li key={key} className="flex gap-2.5">
            {/* Columna de puntos y línea */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  done && 'border-emerald-500 bg-emerald-500 text-white',
                  current && 'border-primary bg-primary text-primary-foreground ring-2 ring-primary/20',
                  !done && !current && 'border-muted-foreground/30 bg-background'
                )}
              >
                {done ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : (
                  <span className={cn('size-1 rounded-full', current ? 'bg-primary-foreground' : 'bg-transparent')} />
                )}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    'my-0.5 w-0.5 flex-1 min-h-[14px] rounded-full',
                    done ? 'bg-emerald-400' : 'bg-border'
                  )}
                />
              )}
            </div>
            {/* Etiqueta */}
            <div className="pb-3 leading-tight">
              <p className={cn('text-xs', current ? 'font-semibold' : done ? 'text-muted-foreground' : 'text-muted-foreground/60')}>
                {conf.label}
                {current && <span className="ml-1.5 text-[10px] font-normal text-primary">estás aquí</span>}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
