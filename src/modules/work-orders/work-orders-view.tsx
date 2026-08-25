'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  User,
  Wrench,
  Clock,
  ChevronRight,
  ArrowLeft,
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { StatusBadge, PriorityBadge } from '@/components/tallerflow/badges'
import { useAppStore } from '@/store/app-store'
import {
  useWorkOrders,
  useWorkOrderMutations,
  useCustomers,
  useDevices,
  useUsers,
} from '@/lib/hooks/api'
import {
  WORK_ORDER_STATUS,
  PRIORITY,
  DEVICE_TYPES,
  SERVICE_TYPES,
  formatCurrency,
  formatDateTime,
  timeAgo,
  fullName,
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

// ============== Main View ==============
export function WorkOrdersView() {
  const { navigate, workOrderStatusFilter } = useAppStore()
  const [search, setSearch] = React.useState('')
  const [createOpen, setCreateOpen] = React.useState(false)

  // Apply filter from store (status filter)
  const activeStatus = workOrderStatusFilter && workOrderStatusFilter !== 'all'
    ? (workOrderStatusFilter as WorkOrderStatusKey)
    : undefined

  const { data, isLoading, isError } = useWorkOrders({
    status: activeStatus,
    search,
  })

  const orders: any[] = data || []

  // Stats: compute counts from data only when no filter applied (otherwise we'd undercount)
  // For accurate stats, fetch counts via unfiltered query too
  const { data: allOrders } = useWorkOrders({})
  const all: any[] = allOrders || []
  const activeCount = all.filter((o) =>
    !['delivered', 'cancelled'].includes(o.status)
  ).length
  const diagnosingCount = all.filter((o) => o.status === 'diagnosing').length
  const toApproveCount = all.filter((o) => o.status === 'quoted').length
  const readyCount = all.filter((o) => o.status === 'ready').length

  const setStatusFilter = (value: string | null) => {
    navigate('work-orders', { statusFilter: value ?? 'all' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Órdenes de trabajo</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el flujo de reparaciones del taller.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Nueva orden
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Activas"
          value={activeCount}
          tone="emerald"
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          label="En diagnóstico"
          value={diagnosingCount}
          tone="amber"
          onClick={() => setStatusFilter('diagnosing')}
        />
        <StatCard
          label="Por aprobar"
          value={toApproveCount}
          tone="sky"
          onClick={() => setStatusFilter('quoted')}
        />
        <StatCard
          label="Listas para entregar"
          value={readyCount}
          tone="teal"
          onClick={() => setStatusFilter('ready')}
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, cliente, equipo o problema…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {workOrderStatusFilter && workOrderStatusFilter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setStatusFilter(null)}
                >
                  <Filter className="size-3.5" />
                  Filtro: {WORK_ORDER_STATUS[workOrderStatusFilter as WorkOrderStatusKey]?.label}
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            {/* Status filter pills */}
            <ScrollArea className="w-full">
              <div className="flex w-max gap-1.5 pb-1">
                <FilterPill
                  active={!activeStatus}
                  onClick={() => setStatusFilter('all')}
                >
                  Todos
                </FilterPill>
                {(Object.keys(WORK_ORDER_STATUS) as WorkOrderStatusKey[]).map((key) => {
                  const conf = WORK_ORDER_STATUS[key]
                  return (
                    <FilterPill
                      key={key}
                      active={activeStatus === key}
                      onClick={() => setStatusFilter(key)}
                    >
                      <span className={cn('size-1.5 rounded-full', conf.dot)} />
                      {conf.label}
                    </FilterPill>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <AlertTriangle className="size-8 text-rose-500" />
              <p className="text-sm text-muted-foreground">
                Error al cargar las órdenes. Intenta de nuevo.
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No hay órdenes</p>
                <p className="text-sm text-muted-foreground">
                  {search || activeStatus
                    ? 'Prueba cambiando los filtros de búsqueda.'
                    : 'Crea tu primera orden de trabajo.'}
                </p>
              </div>
              <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Nueva Orden
              </Button>
            </div>
          ) : (
           <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Recibida</TableHead>
                  <TableHead className="pr-4 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    onClick={() => navigate('work-order-detail', { workOrderId: o.id })}
                  >
                    <TableCell className="pl-4 font-mono text-xs font-medium">
                      {o.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {fullName(o.customer?.firstName, o.customer?.lastName)}
                        </span>
                        {o.customer?.phone && (
                          <span className="text-xs text-muted-foreground">
                            {o.customer.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                          <DeviceTypeIcon type={o.device?.type} className="size-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {[o.device?.brand, o.device?.model].filter(Boolean).join(' ') || 'Equipo'}
                          </span>
                          {o.device?.serial && (
                            <span className="font-mono text-xs text-muted-foreground">
                              S/N: {o.device.serial}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={o.priority} />
                    </TableCell>
                    <TableCell>
                      {o.technician ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex size-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-medium text-violet-700">
                            {(o.technician.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm">{o.technician.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground" title={formatDateTime(o.receivedAt)}>
                        {timeAgo(o.receivedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right font-medium tabular-nums">
                      {o.totalAmount > 0 ? formatCurrency(o.totalAmount) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <CreateOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

// ============== Stat Card ==============
function StatCard({
  label,
  value,
  tone,
  onClick,
}: {
  label: string
  value: number
  tone: 'emerald' | 'amber' | 'sky' | 'teal'
  onClick?: () => void
}) {
  const toneClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
    teal: 'bg-teal-500',
  }
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          </div>
          <div className={cn('size-2 rounded-full', toneClasses[tone])} />
        </div>
      </CardContent>
    </Card>
  )
}

// ============== Filter Pill ==============
function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background text-muted-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}

// ============== Create Order Dialog ==============
function CreateOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { navigate } = useAppStore()
  const { create } = useWorkOrderMutations()

  const [customerId, setCustomerId] = React.useState('')
  const [deviceId, setDeviceId] = React.useState('')
  const [serviceType, setServiceType] = React.useState<string>('revision')
  const [priority, setPriority] = React.useState<PriorityKey>('normal')
  const [technicianId, setTechnicianId] = React.useState('')
  const [reportedIssue, setReportedIssue] = React.useState('')
  const [internalNotes, setInternalNotes] = React.useState('')
  const [estimatedDoneAt, setEstimatedDoneAt] = React.useState('')

  const { data: customers } = useCustomers()
  const { data: devices } = useDevices(customerId ? { customerId } : {})
  const { data: users } = useUsers()

  const customersList: any[] = customers || []
  const devicesList: any[] = devices || []
  const technicians: any[] = (users || []).filter(
    (u: any) => u.role === 'technician' || u.role === 'admin'
  )

  // Reset form on close
  const resetForm = () => {
    setCustomerId('')
    setDeviceId('')
    setServiceType('revision')
    setPriority('normal')
    setTechnicianId('')
    setReportedIssue('')
    setInternalNotes('')
    setEstimatedDoneAt('')
  }

  React.useEffect(() => {
    if (!open) resetForm()
  }, [open])

  // Clear device when customer changes
  React.useEffect(() => {
    setDeviceId('')
  }, [customerId])

  const canSubmit = customerId && deviceId && reportedIssue.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    const payload: any = {
      customerId,
      deviceId,
      serviceType,
      priority,
      reportedIssue: reportedIssue.trim(),
      internalNotes: internalNotes.trim() || undefined,
      estimatedDoneAt: estimatedDoneAt ? new Date(estimatedDoneAt).toISOString() : undefined,
    }
    if (technicianId) payload.technicianId = technicianId

    create.mutate(payload, {
      onSuccess: (data) => {
        onOpenChange(false)
        if (data?.id) {
          navigate('work-order-detail', { workOrderId: data.id })
        }
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
          <DialogDescription>
            Registra el ingreso de un equipo al taller.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Cliente */}
            <div className="space-y-2">
              <Label>
                Cliente <span className="text-rose-500">*</span>
              </Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customersList.length === 0 ? (
                    <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No hay clientes registrados
                    </div>
                  ) : (
                    customersList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {fullName(c.firstName, c.lastName)}
                        {c.documentId ? ` · ${c.documentId}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Equipo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Equipo <span className="text-rose-500">*</span>
                </Label>
                {customerId && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => {
                      onOpenChange(false)
                      navigate('devices')
                    }}
                  >
                    Registrar equipo
                  </Button>
                )}
              </div>
              {!customerId ? (
                <div className="flex h-9 items-center rounded-md border border-dashed px-3 text-xs text-muted-foreground">
                  Selecciona un cliente primero
                </div>
              ) : devicesList.length === 0 ? (
                <div className="flex flex-col gap-2 rounded-md border border-dashed p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Este cliente no tiene equipos registrados.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      navigate('devices')
                    }}
                  >
                    Registrar equipo
                  </Button>
                </div>
              ) : (
                <Select value={deviceId} onValueChange={setDeviceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {devicesList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {DEVICE_TYPES[d.type as keyof typeof DEVICE_TYPES]?.label || d.type}
                        {' · '}
                        {[d.brand, d.model].filter(Boolean).join(' ')}
                        {d.serial ? ` · S/N ${d.serial}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator />

            {/* Tipo de servicio + Prioridad + Técnico */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo de servicio</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SERVICE_TYPES) as (keyof typeof SERVICE_TYPES)[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {SERVICE_TYPES[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {(serviceType === 'mantenimiento' || serviceType === 'instalacion')
                    ? 'Flujo corto: Recibida → Lista → Entregada'
                    : 'Flujo completo con diagnóstico y cotización'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as PriorityKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRIORITY) as PriorityKey[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {PRIORITY[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Técnico (opcional)</Label>
                <Select value={technicianId} onValueChange={setTechnicianId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Problema reportado */}
            <div className="space-y-2">
              <Label>
                Problema reportado <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                placeholder="Describe el problema que reporta el cliente…"
                value={reportedIssue}
                onChange={(e) => setReportedIssue(e.target.value)}
                rows={3}
              />
            </div>

            {/* Notas internas */}
            <div className="space-y-2">
              <Label>Notas internas (opcional)</Label>
              <Textarea
                placeholder="Notas visibles solo para el taller…"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Fecha estimada */}
            <div className="space-y-2">
              <Label>Fecha estimada de entrega (opcional)</Label>
              <Input
                type="date"
                value={estimatedDoneAt}
                onChange={(e) => setEstimatedDoneAt(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || create.isPending}
            className="gap-2"
          >
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Crear Orden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
