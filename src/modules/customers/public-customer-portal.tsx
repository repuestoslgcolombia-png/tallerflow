'use client'

import * as React from 'react'
import {
  Wrench,
  Phone,
  Mail,
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  AlertTriangle,
  Loader2,
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  Microwave,
  CookingPot,
  Thermometer,
  Shield,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  WORK_ORDER_STATUS,
  INVOICE_STATUS,
  DEVICE_TYPES,
  SERVICE_TYPES,
  formatCurrency,
  formatDate,
  getFlowStages,
  type WorkOrderStatusKey,
} from '@/lib/constants'

type Phase = 'loading' | 'invalid' | 'ready'

interface PortalWorkOrder {
  id: string
  code: string
  status: WorkOrderStatusKey
  serviceType: string
  priority: string
  device: string
  deviceType: string
  reportedIssue: string
  diagnosisText: string | null
  technician: string | null
  receivedAt: string
  estimatedDoneAt: string | null
  deliveredAt: string | null
  totalAmount: number
  totalPaid: number
}

interface PortalInvoice {
  id: string
  code: string
  status: 'pending' | 'paid' | 'partial' | 'cancelled'
  total: number
  paid: number
  balance: number
  issuedAt: string
  paymentMethod: string | null
}

interface PortalDevice {
  id: string
  type: string
  brand: string
  model: string
  serial: string
  notes: string
}

interface PortalData {
  customer: { name: string; phone: string | null; email: string | null }
  workshop: { name: string; phone: string; currencySymbol: string }
  stats: {
    totalOrders: number
    activeOrders: number
    totalSpent: number
    pendingBalance: number
    totalDevices: number
  }
  devices: PortalDevice[]
  workOrders: PortalWorkOrder[]
  invoices: PortalInvoice[]
}

const DEVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  Microwave,
  CookingPot,
  Thermometer,
}

function DeviceIcon({ type, className }: { type: string; className?: string }) {
  const iconName = DEVICE_TYPES[type as keyof typeof DEVICE_TYPES]?.icon || 'Wrench'
  const Icon = DEVICE_ICONS[iconName] || Wrench
  return <Icon className={className} />
}

export function PublicCustomerPortal({ token }: { token: string }) {
  const [phase, setPhase] = React.useState<Phase>('loading')
  const [errorMsg, setErrorMsg] = React.useState('')
  const [data, setData] = React.useState<PortalData | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`/api/portal/${encodeURIComponent(token)}`)
        const json = await r.json().catch(() => null)
        if (cancelled) return
        if (!r.ok) {
          setErrorMsg(json?.error || 'No fue posible cargar el portal.')
          setPhase('invalid')
          return
        }
        setData(json)
        setPhase('ready')
      } catch {
        if (!cancelled) {
          setErrorMsg('No fue posible conectar con el servidor.')
          setPhase('invalid')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Cargando tu portal...</p>
        </div>
      </div>
    )
  }

  if (phase === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
              <AlertTriangle className="size-8 text-rose-600" />
            </div>
            <h1 className="text-xl font-bold">Link inválido</h1>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">
              El link puede haber expirado. Contacta al taller para obtener un nuevo enlace.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const symbol = data.workshop.currencySymbol

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <Wrench className="size-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">{data.workshop.name}</h1>
                <p className="text-[11px] leading-tight text-muted-foreground">Portal del cliente</p>
              </div>
            </div>
            {data.workshop.phone && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => window.open(`tel:${data.workshop.phone}`)}
              >
                <Phone className="size-3.5" /> Llamar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4">
        {/* Bienvenida */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
              Hola, {data.customer.name} 👋
            </h2>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
              Aquí puedes consultar el estado de tus equipos, órdenes y facturas en tiempo real.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.customer.phone && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="size-3" /> {data.customer.phone}
                </span>
              )}
              {data.customer.email && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="size-3" /> {data.customer.email}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Package}
            label="Órdenes totales"
            value={String(data.stats.totalOrders)}
            color="emerald"
          />
          <StatCard
            icon={Clock}
            label="Activas"
            value={String(data.stats.activeOrders)}
            color="amber"
          />
          <StatCard
            icon={WashingMachine}
            label="Equipos"
            value={String(data.stats.totalDevices)}
            color="sky"
          />
          <StatCard
            icon={DollarSign}
            label="Saldo pendiente"
            value={formatCurrency(data.stats.pendingBalance, symbol)}
            color="rose"
            small
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="gap-1.5 text-xs sm:text-sm">
              <Package className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Órdenes</span>
              <span className="sm:hidden">Órd.</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Facturas</span>
              <span className="sm:hidden">Fact.</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-1.5 text-xs sm:text-sm">
              <WashingMachine className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Equipos</span>
              <span className="sm:hidden">Equip.</span>
            </TabsTrigger>
          </TabsList>

          {/* Órdenes */}
          <TabsContent value="orders" className="mt-4 space-y-3">
            {data.workOrders.length === 0 ? (
              <EmptyState icon={Package} text="No tienes órdenes de trabajo" />
            ) : (
              data.workOrders.map((wo) => (
                <WorkOrderCard key={wo.id} wo={wo} symbol={symbol} />
              ))
            )}
          </TabsContent>

          {/* Facturas */}
          <TabsContent value="invoices" className="mt-4 space-y-3">
            {data.invoices.length === 0 ? (
              <EmptyState icon={FileText} text="No tienes facturas" />
            ) : (
              data.invoices.map((inv) => (
                <Card key={inv.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{inv.code}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            (INVOICE_STATUS as Record<string, { color: string }>)[inv.status]?.color
                          )}
                        >
                          {(INVOICE_STATUS as Record<string, { label: string }>)[inv.status]
                            ?.label || inv.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Emitida: {formatDate(inv.issuedAt)}
                      </p>
                      {inv.paymentMethod && (
                        <p className="text-xs text-muted-foreground">Pago: {inv.paymentMethod}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(inv.total, symbol)}</p>
                      {inv.balance > 0 && inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <p className="text-xs text-rose-600">
                          Saldo: {formatCurrency(inv.balance, symbol)}
                        </p>
                      )}
                      {inv.status === 'paid' && (
                        <p className="flex items-center justify-end gap-1 text-xs text-emerald-600">
                          <CheckCircle2 className="size-3" /> Pagada
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Equipos */}
          <TabsContent value="devices" className="mt-4 space-y-3">
            {data.devices.length === 0 ? (
              <EmptyState icon={WashingMachine} text="No tienes equipos registrados" />
            ) : (
              data.devices.map((dev) => (
                <Card key={dev.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <DeviceIcon type={dev.type} className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {DEVICE_TYPES[dev.type as keyof typeof DEVICE_TYPES]?.label || dev.type}
                        {dev.brand || dev.model ? ` · ${dev.brand} ${dev.model}`.trim() : ''}
                      </p>
                      {dev.serial && (
                        <p className="text-xs text-muted-foreground">S/N: {dev.serial}</p>
                      )}
                      {dev.notes && <p className="text-xs text-muted-foreground">{dev.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="size-3" />
            Tus datos están seguros con {data.workshop.name}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Portal generado por TallerFlow · {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  )
}

// ============== Tarjeta de orden con timeline por tipo de servicio ==============

function WorkOrderCard({ wo, symbol }: { wo: PortalWorkOrder; symbol: string }) {
  const stages = getFlowStages(wo.serviceType)
  const currentIdx = stages.indexOf(wo.status)
  const isTerminal = wo.status === 'delivered' || wo.status === 'cancelled'

  // Si la orden quedó en un estado que no está en las etapas del flujo (datos legacy),
  // marcamos todo como incompleto sin romper el render.
  const effectiveIdx = currentIdx === -1 && !isTerminal ? -2 : currentIdx

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">{wo.code}</span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  (WORK_ORDER_STATUS as Record<string, { color: string }>)[wo.status]?.color
                )}
              >
                {(WORK_ORDER_STATUS as Record<string, { label: string }>)[wo.status]?.label ||
                  wo.status}
              </Badge>
            </div>
            {wo.device && <p className="mt-1 text-sm font-medium">{wo.device}</p>}
            {wo.serviceType && SERVICE_TYPES[wo.serviceType as keyof typeof SERVICE_TYPES] && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {SERVICE_TYPES[wo.serviceType as keyof typeof SERVICE_TYPES].label}
              </p>
            )}
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{wo.reportedIssue}</p>
            {wo.diagnosisText && (
              <div className="mt-2 rounded-md border-l-2 border-emerald-300 bg-muted/30 p-2 text-xs">
                <span className="font-semibold">Diagnóstico:</span> {wo.diagnosisText}
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            {wo.technician && (
              <p className="text-[11px] text-muted-foreground">Técnico: {wo.technician}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Recibida: {formatDate(wo.receivedAt)}
            </p>
            {wo.estimatedDoneAt && (
              <p className="text-[11px] text-muted-foreground">
                Estimada: {formatDate(wo.estimatedDoneAt)}
              </p>
            )}
            {wo.deliveredAt && (
              <p className="text-[11px] text-muted-foreground">
                Entregada: {formatDate(wo.deliveredAt)}
              </p>
            )}
            {wo.totalAmount > 0 && (
              <p className="mt-1 text-sm font-bold">{formatCurrency(wo.totalAmount, symbol)}</p>
            )}
          </div>
        </div>

        {/* Timeline visual según el flujo del servicio */}
        {wo.status !== 'cancelled' && (
          <div className="mt-3 flex items-center gap-1">
            {stages.map((step, i) => {
              const statusInfo = WORK_ORDER_STATUS[step]
              const isDone = i <= effectiveIdx
              const isCurrent = i === effectiveIdx
              return (
                <div key={step} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      'size-2.5 rounded-full transition-all',
                      isDone ? 'bg-emerald-500' : 'bg-muted',
                      isCurrent && 'ring-2 ring-emerald-400 ring-offset-1'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[8px]',
                      isDone ? 'font-medium text-emerald-600' : 'text-muted-foreground'
                    )}
                  >
                    {shortenLabel(statusInfo.label)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function shortenLabel(label: string): string {
  const map: Record<string, string> = {
    Recibida: 'Rec',
    'En diagnóstico': 'Diag',
    Cotizada: 'Cot',
    Aprobada: 'Apr',
    'En reparación': 'Rep',
    Lista: 'Listo',
    Entregada: 'Ent',
  }
  return map[label] || label
}

// ============== Helpers ==============

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
  small?: boolean
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  }
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className={cn('mb-1.5 flex size-7 items-center justify-center rounded-md', colors[color])}>
        <Icon className="size-4" />
      </div>
      <p className={cn('font-bold leading-tight', small ? 'text-sm' : 'text-lg')}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}
