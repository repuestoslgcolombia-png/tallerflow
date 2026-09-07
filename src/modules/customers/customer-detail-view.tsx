'use client'

import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  IdCard,
  Pencil,
  Plus,
  Package,
  ClipboardList,
  Eye,
  Wrench,
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  Receipt,
  ExternalLink,
  Copy,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useCustomer } from '@/lib/hooks/api'
import { toast } from 'sonner'
import { useAppStore } from '@/store/app-store'
import {
  fullName,
  getInitials,
  timeAgo,
  formatDate,
  formatCurrency,
  DEVICE_TYPES,
  type DeviceTypeKey,
} from '@/lib/constants'
import {
  StatusBadge,
  PriorityBadge,
  InvoiceStatusBadge,
} from '@/components/tallerflow/badges'
import { CustomerFormDialog } from './customers-view'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

// ============== Device icon helper ==============

const DEVICE_ICON_MAP: Record<string, any> = {
  washing_machine: WashingMachine,
  refrigerator: Refrigerator,
  freezer: Snowflake,
  gas_dryer: Flame,
  air_conditioner: Wind,
  tv: Tv,
  other: Wrench,
}

function DeviceIcon({ type, className }: { type: string; className?: string }) {
  const Icon = DEVICE_ICON_MAP[type] || Wrench
  return <Icon className={className} />
}

// ============== Local helpers ==============

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="text-sm break-words">{value}</div>
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

function DeviceDetailsDialog({
  device,
  open,
  onOpenChange,
}: {
  device: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!device) return null
  const conf = (DEVICE_TYPES as Record<string, any>)[device.type]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <DeviceIcon type={device.type} className="size-4" />
            </span>
            {conf?.label || device.type}
          </DialogTitle>
          <DialogDescription>
            Detalles del equipo registrado.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <Field label="Marca" value={device.brand} />
          <Field label="Modelo" value={device.model} />
          <Field label="Serial" value={device.serial} mono />
          <Field
            label="Registrado"
            value={formatDate(device.createdAt)}
          />
          {device.accessories && (
            <div className="sm:col-span-2">
              <Field label="Accesorios" value={device.accessories} block />
            </div>
          )}
          {device.notes && (
            <div className="sm:col-span-2">
              <Field label="Notas" value={device.notes} block />
            </div>
          )}
        </dl>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  value,
  mono,
  block,
}: {
  label: string
  value?: string | null
  mono?: boolean
  block?: boolean
}) {
  return (
    <div className={cn(block && 'sm:col-span-2')}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'text-sm break-words',
          mono && 'font-mono text-xs'
        )}
      >
        {value && value.trim() !== '' ? value : '—'}
      </dd>
    </div>
  )
}

// ============== Main view ==============

export function CustomerDetailView() {
  const { selectedCustomerId, navigate } = useAppStore()
  const { data: customer, isLoading } = useCustomer(selectedCustomerId)
  const [editOpen, setEditOpen] = useState(false)
  const [deviceDialog, setDeviceDialog] = useState<any | null>(null)
  const [portalOpen, setPortalOpen] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalRegenerating, setPortalRegenerating] = useState(false)
  const [portalRegenConfirm, setPortalRegenConfirm] = useState(false)

  const openPortal = async () => {
    if (!selectedCustomerId) return
    setPortalLoading(true)
    try {
      const res = await fetch(`/api/portal?customerId=${selectedCustomerId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al generar link')
      setPortalUrl(`${window.location.origin}/?portal=${data.token}`)
      setPortalOpen(true)
    } catch (e: any) {
      toast.error(e.message || 'Error al generar link del portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const regeneratePortal = async () => {
    if (!selectedCustomerId) return
    setPortalRegenerating(true)
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selectedCustomerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al regenerar link')
      setPortalUrl(`${window.location.origin}/?portal=${data.token}`)
      toast.success('Link regenerado. El anterior quedó invalidado.')
      setPortalRegenConfirm(false)
    } catch (e: any) {
      toast.error(e.message || 'Error al regenerar link del portal')
    } finally {
      setPortalRegenerating(false)
    }
  }

  if (!selectedCustomerId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-2 text-muted-foreground"
          onClick={() => navigate('customers')}
        >
          <ArrowLeft className="size-4" /> Volver a Clientes
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No se ha seleccionado ningún cliente.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-2 text-muted-foreground"
          onClick={() => navigate('customers')}
        >
          <ArrowLeft className="size-4" /> Volver a Clientes
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Cliente no encontrado.
          </CardContent>
        </Card>
      </div>
    )
  }

  const name = fullName(customer.firstName, customer.lastName)
  const devices: any[] = customer.devices || []
  const workOrders: any[] = customer.workOrders || []
  const invoices: any[] = customer.invoices || []

  const deviceOrderCount = (deviceId: string) =>
    workOrders.filter((wo) => wo.deviceId === deviceId).length

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-2 text-muted-foreground"
        onClick={() => navigate('customers')}
      >
        <ArrowLeft className="size-4" /> Volver a Clientes
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-emerald-100 text-lg font-semibold text-emerald-700">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {customer.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {customer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                onClick={openPortal}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ExternalLink className="size-4" />
                )}{' '}
                Portal del cliente
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" /> Editar
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() =>
                  navigate('work-orders', { customerFilter: selectedCustomerId })
                }
              >
                <Plus className="size-4" /> Nueva Orden
              </Button>
            </div>
          </div>

          {(customer.documentId || customer.address || customer.notes) && (
            <>
              <Separator className="my-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                {customer.documentId && (
                  <InfoItem
                    icon={<IdCard className="size-4" />}
                    label="Documento"
                    value={customer.documentId}
                  />
                )}
                {customer.address && (
                  <InfoItem
                    icon={<MapPin className="size-4" />}
                    label="Dirección"
                    value={customer.address}
                  />
                )}
                {customer.notes && (
                  <div className="sm:col-span-2">
                    <InfoItem
                      icon={<FileText className="size-4" />}
                      label="Notas"
                      value={customer.notes}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices" className="gap-1.5">
            <Package className="size-3.5" /> Equipos
            <Badge variant="secondary" className="px-1.5 py-0 text-xs tabular-nums">
              {devices.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ClipboardList className="size-3.5" /> Órdenes
            <Badge variant="secondary" className="px-1.5 py-0 text-xs tabular-nums">
              {workOrders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <Receipt className="size-3.5" /> Facturas
            <Badge variant="secondary" className="px-1.5 py-0 text-xs tabular-nums">
              {invoices.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Devices tab */}
        <TabsContent value="devices">
          <Card className="gap-0 py-0">
            <CardHeader className="flex-row items-center justify-between border-b py-4">
              <div className="space-y-1">
                <CardTitle className="text-base">Equipos del cliente</CardTitle>
                <CardDescription className="text-xs">
                  Equipos registrados a nombre de este cliente.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => navigate('devices')}
              >
                <Plus className="size-4" /> Registrar equipo
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {devices.length === 0 ? (
                <EmptyState
                  icon={<Package className="size-8" />}
                  title="Sin equipos registrados"
                  description="Registra el primer equipo de este cliente."
                  action={
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate('devices')}
                    >
                      <Plus className="size-4" /> Registrar equipo
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Tipo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Accesorios</TableHead>
                      <TableHead className="text-center">Órdenes</TableHead>
                      <TableHead className="w-10 pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((d: any) => {
                      const conf = (DEVICE_TYPES as Record<string, any>)[d.type]
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-2">
                              <span className="flex size-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                                <DeviceIcon type={d.type} className="size-4" />
                              </span>
                              <span className="text-sm font-medium">
                                {conf?.label || d.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{d.brand || '—'}</TableCell>
                          <TableCell className="text-sm">{d.model || '—'}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {d.serial || '—'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {d.accessories || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="tabular-nums">
                              {deviceOrderCount(d.id)}
                            </Badge>
                          </TableCell>
                          <TableCell className="pr-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => setDeviceDialog(d)}
                              title="Ver detalles"
                            >
                              <Eye className="size-4" />
                              <span className="sr-only">Ver detalles</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work orders tab */}
        <TabsContent value="orders">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Órdenes de trabajo</CardTitle>
              <CardDescription className="text-xs">
                Historial de reparaciones del cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {workOrders.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="size-8" />}
                  title="Sin órdenes de trabajo"
                  description="Crea una nueva orden para este cliente."
                  action={
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        navigate('work-orders', {
                          customerFilter: selectedCustomerId,
                        })
                      }
                    >
                      <Plus className="size-4" /> Nueva Orden
                    </Button>
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Código</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="pr-4">Recibida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((wo: any) => (
                      <TableRow
                        key={wo.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate('work-order-detail', { workOrderId: wo.id })
                        }
                      >
                        <TableCell className="pl-4">
                          <span className="font-mono text-xs font-semibold text-emerald-700">
                            {wo.code}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {wo.device
                            ? `${wo.device.brand || ''} ${wo.device.model || ''}`.trim() ||
                              DEVICE_TYPES[(wo.device.type as DeviceTypeKey) || 'other']?.label ||
                              'Equipo'
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={wo.status} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={wo.priority} />
                        </TableCell>
                        <TableCell className="text-sm font-medium tabular-nums">
                          {formatCurrency(wo.totalAmount)}
                        </TableCell>
                        <TableCell className="pr-4 text-sm text-muted-foreground">
                          {timeAgo(wo.receivedAt || wo.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices tab */}
        <TabsContent value="invoices">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-base">Facturas</CardTitle>
              <CardDescription className="text-xs">
                Documentos de facturación del cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="size-8" />}
                  title="Sin facturas"
                  description="Las facturas se generan al entregar órdenes de trabajo."
                />
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Código</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="pr-4">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="pl-4">
                          <span className="font-mono text-xs font-semibold text-emerald-700">
                            {inv.code}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium tabular-nums">
                          {formatCurrency(inv.total)}
                        </TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={inv.status} />
                        </TableCell>
                        <TableCell className="pr-4 text-sm text-muted-foreground">
                          {formatDate(inv.issuedAt || inv.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Portal dialog */}
      <Dialog open={portalOpen} onOpenChange={setPortalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="size-5 text-emerald-500" />
              Portal del Cliente
            </DialogTitle>
            <DialogDescription>
              Comparte este link con {customer.firstName} para que consulte el estado de sus
              equipos, órdenes y facturas en cualquier momento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                Link del portal
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background p-2 text-xs">
                  {portalUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(portalUrl)
                    toast.success('Link copiado')
                  }}
                >
                  <Copy className="size-3.5" /> Copiar
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(portalUrl)
                  toast.success('Link copiado')
                }}
              >
                <Copy className="size-4" /> Copiar link
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => window.open(portalUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="size-4" /> Abrir portal
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border p-3">
              <p className="text-xs text-muted-foreground">
                ¿Link comprometido o compartido por error? Genera uno nuevo; el actual dejará de
                funcionar.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                onClick={() => setPortalRegenConfirm(true)}
                disabled={portalRegenerating}
              >
                <RefreshCw className={`size-3.5 ${portalRegenerating ? 'animate-spin' : ''}`} />
                Regenerar
              </Button>
            </div>
            <div className="rounded-md border border-sky-200 bg-sky-50 p-3 dark:border-sky-800 dark:bg-sky-950/30">
              <p className="text-xs text-sky-800 dark:text-sky-300">
                El cliente puede guardar este link en su navegador para consultar el estado de sus
                reparaciones en cualquier momento, sin necesidad de llamar al taller.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm regenerate portal link */}
      <AlertDialog open={portalRegenConfirm} onOpenChange={setPortalRegenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Regenerar link del portal?</AlertDialogTitle>
            <AlertDialogDescription>
              Se creará un nuevo enlace y el link actual quedará invalidado de inmediato. El
              cliente deberá usar el nuevo link que le compartas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={(e) => {
                e.preventDefault()
                regeneratePortal()
              }}
            >
              Regenerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <CustomerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
      />

      {/* Device details dialog */}
      <DeviceDetailsDialog
        device={deviceDialog}
        open={!!deviceDialog}
        onOpenChange={(o) => !o && setDeviceDialog(null)}
      />
    </div>
  )
}
