'use client'

import { useState } from 'react'
import {
  Zap,
  FileText,
  CheckCircle2,
  DollarSign,
  Bell,
  Send,
  Clock,
  TrendingUp,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Wrench,
  Package,
} from 'lucide-react'
import { useAutomations, useAutomationMutations, useAutomationLogs, useAutomationTest } from '@/lib/hooks/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/constants'
import { toast } from 'sonner'

// Espejo de TRIGGER_LABELS (lib/automations.ts importa Prisma y no debe entrar al bundle del cliente)
const TRIGGER_LABELS_ES: Record<string, string> = {
  order_received: 'Orden recibida',
  quote_sent: 'Cotización enviada',
  quote_approved: 'Cotización aprobada',
  order_ready: 'Orden lista',
  order_delivered: 'Orden entregada',
  payment_received: 'Pago recibido',
  invoice_created: 'Factura creada',
}

const LOG_STATUS_LABELS: Record<string, string> = {
  sent: 'Enviado',
  failed: 'Falló',
  skipped: 'Omitido',
}

const TRIGGER_ICONS: Record<string, any> = {
  order_received: Package,
  quote_sent: FileText,
  quote_approved: CheckCircle2,
  order_ready: CheckCircle2,
  order_delivered: Package,
  payment_received: DollarSign,
  invoice_created: FileText,
}

const TRIGGER_COLORS: Record<string, string> = {
  order_received: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  quote_sent: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  quote_approved: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  order_ready: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
  order_delivered: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  payment_received: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  invoice_created: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
}

const LOG_STATUS_STYLES: Record<string, string> = {
  sent: 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400',
  failed: 'border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-400',
  skipped: 'border-muted text-muted-foreground',
}

export function AutomationsView() {
  const { data: rules, isLoading } = useAutomations()
  const { data: logs, isLoading: logsLoading } = useAutomationLogs({ limit: 20 })
  const mutation = useAutomationTest()

  const [testDialog, setTestDialog] = useState<any>(null)
  const [testPhone, setTestPhone] = useState('')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  const allRules = rules || []
  const reminderRules = allRules.filter((r: any) => r.action === 'create_reminder')
  const whatsappRules = allRules.filter((r: any) => r.action === 'send_whatsapp')
  const enabledCount = allRules.filter((r: any) => r.enabled).length
  const sentToday = (logs || []).filter(
    (l: any) => new Date(l.sentAt).toDateString() === new Date().toDateString()
  ).length

  const phoneIsValid = testPhone.replace(/\D/g, '').length >= 7

  const handleTest = () => {
    if (!phoneIsValid || !testDialog) return
    mutation.mutate(
      { ruleId: testDialog.id, phone: testPhone },
      {
        onSuccess: (data: any) => {
          toast.success('Mensaje de prueba enviado')
          if (data.waMeUrl) {
            window.open(data.waMeUrl, '_blank', 'noopener,noreferrer')
          }
          setTestDialog(null)
          setTestPhone('')
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Banner de encabezado */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Zap className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
              Notificaciones WhatsApp Automáticas
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Tus clientes reciben mensajes y recordatorios automáticos en cada etapa del proceso.{' '}
              <strong>
                {enabledCount} de {allRules.length}
              </strong>{' '}
              automatizaciones activas.
            </p>
          </div>
          {enabledCount > 0 ? (
            <Badge className="shrink-0 border-emerald-300 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="mr-1 size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Activo
            </Badge>
          ) : (
            <Badge variant="outline" className="shrink-0 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              Sin reglas activas
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard icon={Zap} label="Activas" value={`${enabledCount}/${allRules.length}`} color="emerald" />
        <StatCard icon={Send} label="Enviados hoy" value={sentToday} color="sky" />
        <StatCard icon={Clock} label="Ejecuciones" value={(logs || []).length} color="violet" />
      </div>

      {/* Estado vacío */}
      {allRules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Zap className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No hay automatizaciones configuradas</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Recarga la página para generar las reglas predeterminadas de WhatsApp y recordatorios.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recordatorios automáticos (garantía + mantenimiento) */}
      {reminderRules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-amber-500" />
              Recordatorios Automáticos
            </CardTitle>
            <CardDescription>
              Se crea un recordatorio programado y su WhatsApp se envía solo cuando llega la fecha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {reminderRules.map((rule: any) => (
              <ReminderRuleRow key={rule.id} rule={rule} onTest={() => setTestDialog(rule)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mensajes automáticos */}
      {whatsappRules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="size-4 text-emerald-500" />
              Reglas de Notificación
            </CardTitle>
            <CardDescription>
              Activa o desactiva los mensajes automáticos que se envían a tus clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {whatsappRules.map((rule: any) => (
              <WhatsAppRuleRow key={rule.id} rule={rule} onTest={() => setTestDialog(rule)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Flujo automático visual */}
      <FlowCard rules={whatsappRules} />

      {/* Historial */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-emerald-500" />
            Historial de Ejecuciones
          </CardTitle>
          <CardDescription>
            {(logs || []).length > 0
              ? `Últimas ${(logs || []).length} acciones automáticas`
              : 'Las ejecuciones de tus automatizaciones aparecerán aquí'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (logs || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Clock className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Aún no hay ejecuciones</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Cuando se dispare una automatización verás el detalle aquí. Puedes probarlas con el botón «Probar».
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 p-3">
                {(logs || []).map((log: any) => (
                  <div key={log.id} className="rounded-lg border p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className={cn('shrink-0', LOG_STATUS_STYLES[log.status] || '')}>
                          {LOG_STATUS_LABELS[log.status] || log.status}
                        </Badge>
                        <Badge variant="outline" className="truncate">
                          {TRIGGER_LABELS_ES[log.trigger] || log.trigger}
                        </Badge>
                        {log.phone && <span className="text-xs font-medium">{log.phone}</span>}
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(log.sentAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{log.message}</p>
                    {log.status === 'failed' && (
                      <p className="mt-1 text-[10px] text-rose-600">Error: {log.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de prueba */}
      <Dialog open={!!testDialog} onOpenChange={(o) => !o && setTestDialog(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-5 text-emerald-500" />
              Probar automatización
            </DialogTitle>
            <DialogDescription>
              Envía un mensaje de prueba para ver cómo lo recibiría tu cliente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="test-phone">Número de teléfono</Label>
            <Input
              id="test-phone"
              type="tel"
              inputMode="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+57 300 123 4567"
              className="font-mono"
              autoComplete="tel"
            />
            <p className="text-[11px] text-muted-foreground">
              Se abrirá WhatsApp con el mensaje de la plantilla «{testDialog?.triggerLabel}»
            </p>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleTest}
              disabled={!phoneIsValid || mutation.isPending}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar prueba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============== Filas de reglas ==============

function RuleShell({
  icon: Icon,
  colorClass,
  enabled,
  children,
}: {
  icon: any
  colorClass: string
  enabled: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-start',
        enabled
          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/10'
          : 'border-muted bg-muted/20 opacity-75'
      )}
    >
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', colorClass)}>
        <Icon className="size-5" />
      </div>
      {children}
    </div>
  )
}

function RuleControls({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{children}</div>
}

function ActiveBadge() {
  return (
    <Badge variant="outline" className="border-emerald-300 text-[9px] text-emerald-600">
      Activo
    </Badge>
  )
}

function TestButton({ onTest }: { onTest: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onTest}>
      <Send className="size-3" /> Probar
    </Button>
  )
}

function EnableSwitch({ rule }: { rule: any }) {
  const { update, updatePending } = useAutomationMutations()
  return (
    <Switch
      checked={rule.enabled}
      onCheckedChange={(c: boolean) => update.mutate({ id: rule.id, enabled: c })}
      disabled={updatePending}
    />
  )
}

function WhatsAppRuleRow({ rule, onTest }: { rule: any; onTest: () => void }) {
  const Icon = TRIGGER_ICONS[rule.trigger] || Bell
  const colorClass = TRIGGER_COLORS[rule.trigger] || 'bg-muted text-muted-foreground'

  return (
    <RuleShell icon={Icon} colorClass={colorClass} enabled={rule.enabled}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{rule.triggerLabel}</p>
          {rule.enabled && <ActiveBadge />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <MessageCircle className="size-3" />
            Plantilla: <code className="font-mono">{rule.templateCode || 'sin plantilla'}</code>
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="size-3" />
            {rule.delayMinutes === 0 ? 'Inmediato' : `${rule.delayMinutes} min de retraso`}
          </span>
        </div>
      </div>
      <RuleControls>
        <TestButton onTest={onTest} />
        <EnableSwitch rule={rule} />
      </RuleControls>
    </RuleShell>
  )
}

function ReminderRuleRow({ rule, onTest }: { rule: any; onTest: () => void }) {
  const { update, updatePending } = useAutomationMutations()

  const isWarranty = rule.reminderType === 'warranty_check'
  const Icon = isWarranty ? ShieldCheck : Wrench
  const colorClass = isWarranty
    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
    : 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400'

  const [days, setDays] = useState(String(rule.daysOffset ?? 90))
  const dirty = days !== String(rule.daysOffset ?? 90)

  const eventText = isWarranty
    ? 'Al crear una factura se programa un recordatorio de garantía'
    : 'Al entregar un equipo se programa un recordatorio de mantenimiento'

  return (
    <RuleShell icon={Icon} colorClass={colorClass} enabled={rule.enabled}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{rule.triggerLabel}</p>
          <Badge variant="outline" className="text-[9px]">
            {isWarranty ? 'Garantía' : 'Mantenimiento'}
          </Badge>
          {rule.enabled && <ActiveBadge />}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{eventText}</p>
      </div>
      <RuleControls>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={1}
            aria-label="Días de anticipación"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="h-8 w-16 text-center"
          />
          <span className="text-xs text-muted-foreground">días</span>
          {dirty && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => update.mutate({ id: rule.id, daysOffset: Number(days) || 90 })}
              disabled={updatePending}
            >
              Guardar
            </Button>
          )}
        </div>
        <TestButton onTest={onTest} />
        <EnableSwitch rule={rule} />
      </RuleControls>
    </RuleShell>
  )
}

function FlowCard({ rules }: { rules: any[] }) {
  const steps = [
    { trigger: 'order_received', title: '«Recibimos tu equipo»', desc: 'Cliente deja el equipo → WhatsApp inmediato' },
    { trigger: 'quote_sent', title: '«Tu cotización está lista»', desc: 'Cotización enviada → WhatsApp con total' },
    { trigger: 'quote_approved', title: '«Cotización aprobada»', desc: 'Cliente aprueba → WhatsApp de confirmación' },
    { trigger: 'order_ready', title: '«¡Tu equipo está listo!»', desc: 'Reparación completa → WhatsApp de aviso' },
    {
      trigger: 'order_delivered',
      title: '«Gracias por tu preferencia»',
      desc: 'Cliente retira → WhatsApp de despedida. Además se programa mantenimiento a 6 meses',
    },
    { trigger: 'invoice_created', title: 'Garantía registrada', desc: 'Factura creada → recordatorio de garantía a 90 días' },
    { trigger: 'payment_received', title: '«Pago recibido»', desc: 'Pago registrado → confirmación al cliente' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-emerald-500" />
          Flujo de Notificaciones
        </CardTitle>
        <CardDescription>Así recibe tu cliente las actualizaciones automáticas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((item, idx) => {
            const rule = rules.find((r: any) => r.trigger === item.trigger)
            const isEnabled = rule ? rule.enabled : false
            return (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isEnabled ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-medium', !isEnabled && 'text-muted-foreground')}>{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                {isEnabled ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                ) : (
                  <span className="shrink-0 text-[10px] text-muted-foreground">Desactivado</span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============== Helpers ==============
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any
  label: string
  value: any
  color: string
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  }
  return (
    <div className="min-w-0 rounded-lg border bg-card p-3">
      <div className={cn('mb-1.5 flex size-8 items-center justify-center rounded-md', colors[color])}>
        <Icon className="size-4" />
      </div>
      <p className="truncate text-lg font-bold leading-tight tabular-nums">{value}</p>
      <p className="truncate text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
