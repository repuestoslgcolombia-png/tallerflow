'use client'

import { useState } from 'react'
import {
  Zap,
  Package,
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
  const { data: logs } = useAutomationLogs({ limit: 20 })
  const mutation = useAutomationTest()

  const [testDialog, setTestDialog] = useState<any>(null)
  const [testPhone, setTestPhone] = useState('')

  if (isLoading) {
    return (
      <div className="space-y-4">
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

  const handleTest = () => {
    if (!testPhone || !testDialog) return
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
      {/* Header banner */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Zap className="size-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
              Notificaciones WhatsApp AutomÃ¡ticas
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Tus clientes reciben mensajes y recordatorios automÃ¡ticos en cada etapa del proceso.
              {' '}
              <strong>{enabledCount} de {allRules.length}</strong> automatizaciones activas.
            </p>
          </div>
          <Badge className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="mr-1 size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Activo
          </Badge>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Zap} label="Automatizaciones" value={`${enabledCount}/${allRules.length}`} color="emerald" />
        <StatCard icon={Send} label="Enviados hoy" value={(logs || []).filter((l: any) => new Date(l.sentAt).toDateString() === new Date().toDateString()).length} color="sky" />
        <StatCard icon={Clock} label="Total ejecuciones" value={(logs || []).length} color="violet" />
      </div>

      {/* Recordatorios automÃ¡ticos (garantÃ­a + mantenimiento) */}
      {reminderRules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-amber-500" />
              Recordatorios AutomÃ¡ticos
            </CardTitle>
            <CardDescription>
              Se crea un recordatorio programado y su WhatsApp se envÃ­a solo cuando llega la fecha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {reminderRules.map((rule: any) => (
              <ReminderRuleRow key={rule.id} rule={rule} onTest={() => setTestDialog(rule)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mensajes automÃ¡ticos */}
      {whatsappRules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="size-4 text-emerald-500" />
              Reglas de NotificaciÃ³n
            </CardTitle>
            <CardDescription>
              Activa o desactiva los mensajes automÃ¡ticos que se envÃ­an a tus clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {whatsappRules.map((rule: any) => (
              <WhatsAppRuleRow key={rule.id} rule={rule} onTest={() => setTestDialog(rule)} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Flujo automÃ¡tico visual */}
      <FlowCard rules={whatsappRules} />

      {/* Historial */}
      {logs && logs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-emerald-500" />
              Historial de Ejecuciones
            </CardTitle>
            <CardDescription>Ãšltimas {logs.length} acciones automÃ¡ticas</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 p-3">
                {logs.map((log: any) => (
                  <div key={log.id} className="rounded-lg border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-[9px]', LOG_STATUS_STYLES[log.status] || '')}>
                          {log.status === 'sent' ? 'Enviado' : log.status === 'failed' ? 'FallÃ³' : 'Omitido'}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          {log.trigger.replace(/_/g, ' ')}
                        </Badge>
                        {log.phone && <span className="text-xs font-medium">{log.phone}</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(log.sentAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{log.message}</p>
                    {log.status === 'failed' && (
                      <p className="mt-1 text-[10px] text-rose-600">Error: {log.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* DiÃ¡logo de prueba */}
      <Dialog open={!!testDialog} onOpenChange={(o) => !o && setTestDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-5 text-emerald-500" />
              Probar automatizaciÃ³n
            </DialogTitle>
            <DialogDescription>
              EnvÃ­a un mensaje de prueba para ver cÃ³mo lo recibirÃ­a tu cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="test-phone">NÃºmero de telÃ©fono</Label>
              <Input
                id="test-phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+57 300 123 4567"
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Se abrirÃ¡ WhatsApp con el mensaje de la plantilla &quot;{testDialog?.triggerLabel}&quot;
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              onClick={handleTest}
              disabled={!testPhone || mutation.isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
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
        enabled ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/10' : 'border-muted bg-muted/20 opacity-75'
      )}
    >
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', colorClass)}>
        <Icon className="size-5" />
      </div>
      {children}
    </div>
  )
}

function WhatsAppRuleRow({ rule, onTest }: { rule: any; onTest: () => void }) {
  const { update, updatePending } = useAutomationMutations()
  const Icon = TRIGGER_ICONS[rule.trigger] || Bell
  const colorClass = TRIGGER_COLORS[rule.trigger] || 'bg-muted text-muted-foreground'

  return (
    <RuleShell icon={Icon} colorClass={colorClass} enabled={rule.enabled}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{rule.triggerLabel}</p>
          {rule.enabled && (
            <Badge variant="outline" className="border-emerald-300 text-[9px] text-emerald-600">
              Activo
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
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
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onTest} disabled={!rule.enabled}>
          <Send className="size-3" /> Probar
        </Button>
        <Switch checked={rule.enabled} onCheckedChange={(c: boolean) => update.mutate({ id: rule.id, enabled: c })} disabled={updatePending} />
      </div>
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
    ? 'Al crear una factura se programa un recordatorio de garantÃ­a'
    : 'Al entregar un equipo se programa un recordatorio de mantenimiento'

  return (
    <RuleShell icon={Icon} colorClass={colorClass} enabled={rule.enabled}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{rule.triggerLabel}</p>
          <Badge variant="outline" className="text-[9px]">
            {isWarranty ? 'GarantÃ­a' : 'Mantenimiento'}
          </Badge>
          {rule.enabled && (
            <Badge variant="outline" className="border-emerald-300 text-[9px] text-emerald-600">
              Activo
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{eventText}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="h-8 w-16 text-center"
          />
          <span className="text-xs text-muted-foreground">dÃ­as</span>
          {dirty && (
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => update.mutate({ id: rule.id, daysOffset: Number(days) || 90 })} disabled={updatePending}>
              Guardar
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onTest} disabled={!rule.enabled}>
          <Send className="size-3" /> Probar
        </Button>
        <Switch checked={rule.enabled} onCheckedChange={(c: boolean) => update.mutate({ id: rule.id, enabled: c })} disabled={updatePending} />
      </div>
    </RuleShell>
  )
}

function FlowCard({ rules }: { rules: any[] }) {
  const steps = [
    { trigger: 'order_received', title: '"Recibimos tu equipo"', desc: 'Cliente deja el equipo â†’ WhatsApp inmediato' },
    { trigger: 'quote_sent', title: '"Tu cotizaciÃ³n estÃ¡ lista"', desc: 'CotizaciÃ³n enviada â†’ WhatsApp con total' },
    { trigger: 'quote_approved', title: '"CotizaciÃ³n aprobada"', desc: 'Cliente aprueba â†’ WhatsApp de confirmaciÃ³n' },
    { trigger: 'order_ready', title: '"Â¡Tu equipo estÃ¡ listo!"', desc: 'ReparaciÃ³n completa â†’ WhatsApp de aviso' },
    { trigger: 'order_delivered', title: '"Gracias por tu preferencia"', desc: 'Cliente retira â†’ WhatsApp de despedida. AdemÃ¡s se programa mantenimiento a 6 meses' },
    { trigger: 'invoice_created', title: 'GarantÃ­a registrada', desc: 'Factura creada â†’ recordatorio de garantÃ­a a 90 dÃ­as' },
    { trigger: 'payment_received', title: '"Pago recibido"', desc: 'Pago registrado â†’ confirmaciÃ³n al cliente' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-emerald-500" />
          Flujo de Notificaciones
        </CardTitle>
        <CardDescription>AsÃ­ recibe tu cliente las actualizaciones automÃ¡ticas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((item, idx) => {
            const rule = rules.find((r: any) => r.trigger === item.trigger)
            const isEnabled = rule ? rule.enabled : false
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isEnabled ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                )}>
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
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  }
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className={cn('mb-1.5 flex size-8 items-center justify-center rounded-md', colors[color])}>
        <Icon className="size-4" />
      </div>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
