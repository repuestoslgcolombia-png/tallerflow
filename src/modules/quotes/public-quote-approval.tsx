'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { QuoteStatusBadge } from '@/components/tallerflow/badges'
import { formatCurrency, formatDate, fullName } from '@/lib/constants'

type Phase = 'loading' | 'invalid' | 'ready' | 'submitting' | 'approved' | 'rejected'

export function PublicQuoteApproval({ quoteId, token }: { quoteId: string; token: string }) {
  const [phase, setPhase] = React.useState<Phase>('loading')
  const [errorMsg, setErrorMsg] = React.useState('')
  const [quote, setQuote] = React.useState<any | null>(null)
  const [name, setName] = React.useState('')
  const [rejecting, setRejecting] = React.useState(false)
  const [reason, setReason] = React.useState('')

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`/api/quotes/${quoteId}/approve?token=${encodeURIComponent(token)}`)
        const data = await r.json().catch(() => null)
        if (cancelled) return
        if (!r.ok) {
          setErrorMsg(data?.error || 'No fue posible validar la cotización.')
          setPhase('invalid')
          return
        }
        setQuote(data)
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
  }, [quoteId, token])

  const submit = async (decision: 'approve' | 'reject') => {
    setPhase('submitting')
    try {
      const r = await fetch(`/api/quotes/${quoteId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          decision,
          name: name.trim() || undefined,
          reason: decision === 'reject' ? reason.trim() || undefined : undefined,
        }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok) {
        toast.error(data?.error || 'No se pudo procesar la solicitud.')
        setPhase('ready')
        return
      }
      setPhase(decision === 'approve' ? 'approved' : 'rejected')
    } catch {
      toast.error('No fue posible conectar con el servidor.')
      setPhase('ready')
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Wrench className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">TallerFlow</p>
              <p className="text-xs text-muted-foreground">Cotización de servicio</p>
            </div>
          </div>
          {quote && <QuoteStatusBadge status={quote.status} />}
        </div>

        {phase === 'loading' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Validando cotización…</p>
            </CardContent>
          </Card>
        )}

        {phase === 'invalid' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="size-6" />
              </div>
              <p className="font-medium">Enlace inválido</p>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </CardContent>
          </Card>
        )}

        {quote && phase !== 'loading' && phase !== 'invalid' && (
          <>
            {/* Ya procesada */}
            {(phase === 'approved' || quote.status === 'approved') && (
              <ResultBanner
                tone="emerald"
                icon={<CheckCircle2 className="size-6" />}
                title="¡Cotización aprobada!"
                description={`Gracias${name ? `, ${name.trim()}` : ''}. Su orden fue confirmada y el taller continuará con el servicio.`}
              />
            )}
            {(phase === 'rejected' || quote.status === 'rejected') && (
              <ResultBanner
                tone="rose"
                icon={<XCircle className="size-6" />}
                title="Cotización rechazada"
                description={
                  quote.rejectionReason
                    ? `Motivo registrado: ${quote.rejectionReason}`
                    : 'El taller fue notificado. Si tiene dudas, contáctelo directamente.'
                }
              />
            )}
            {quote.status === 'expired' && phase === 'ready' && (
              <ResultBanner
                tone="amber"
                icon={<Clock className="size-6" />}
                title="Cotización vencida"
                description="Esta cotización superó su fecha de validez. Contacte al taller para solicitar una versión actualizada."
              />
            )}

            {/* Resumen de la cotización */}
            <Card>
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold">{quote.code}</p>
                    <p className="text-xs text-muted-foreground">
                      Creada el {formatDate(quote.createdAt)}
                    </p>
                  </div>
                  {quote.validUntil && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Clock className="size-3" />
                      Válida hasta {formatDate(quote.validUntil)}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="font-medium">
                      {fullName(
                        quote.workOrder?.customer?.firstName,
                        quote.workOrder?.customer?.lastName
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Equipo</p>
                    <p className="font-medium">
                      {[quote.workOrder?.device?.brand, quote.workOrder?.device?.model]
                        .filter(Boolean)
                        .join(' ') || '—'}
                    </p>
                  </div>
                  {quote.workOrder?.reportedIssue && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Problema reportado</p>
                      <p>{quote.workOrder.reportedIssue}</p>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(quote.items || []).map((it: any) => (
                        <TableRow key={it.id}>
                          <TableCell>
                            <p className="text-sm">{it.description}</p>
                            <Badge variant="secondary" className="mt-0.5 text-[10px]">
                              {it.itemType === 'part'
                                ? 'Repuesto'
                                : it.itemType === 'labor'
                                  ? 'Mano de obra'
                                  : 'Otro'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(it.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrency(quote.total || 0)}</span>
                  </div>
                </div>

                {quote.notes && (
                  <div className="rounded-md bg-muted/40 p-3 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">Notas del taller</p>
                    <p className="mt-0.5 whitespace-pre-wrap">{quote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Decisión */}
            {phase === 'ready' && (quote.status === 'sent' || quote.status === 'draft') && (
              <Card>
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <p className="text-sm font-medium">¿Aprueba esta cotización?</p>
                  <Input
                    placeholder="Su nombre (opcional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  {rejecting && (
                    <Textarea
                      placeholder="Motivo del rechazo (opcional)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  )}

                  {!rejecting ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        className="flex-1 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => submit('approve')}
                      >
                        <CheckCircle2 className="size-4" />
                        Aprobar cotización
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 text-rose-600 hover:text-rose-700"
                        onClick={() => setRejecting(true)}
                      >
                        <XCircle className="size-4" />
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 text-rose-600 hover:text-rose-700"
                        onClick={() => submit('reject')}
                      >
                        <XCircle className="size-4" />
                        Confirmar rechazo
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setRejecting(false)}
                      >
                        Volver
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {phase === 'submitting' && (
              <Card>
                <CardContent className="flex items-center justify-center gap-3 p-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Procesando su respuesta…</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Enlace seguro · Solo quien posee este enlace puede responder la cotización
        </p>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <FileText className="size-3.5" />
          {quote?.code || ''}
        </p>
      </div>
    </div>
  )
}

function ResultBanner({
  tone,
  icon,
  title,
  description,
}: {
  tone: 'emerald' | 'rose' | 'amber'
  icon: React.ReactNode
  title: string
  description: string
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-600',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4 sm:p-5">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
