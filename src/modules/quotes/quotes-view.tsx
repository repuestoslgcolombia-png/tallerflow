'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  ClipboardList,
  Plus,
  Search,
  Eye,
  Send,
  Trash2,
  FileText,
  Link as LinkIcon,
  MoreHorizontal,
  X,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle2,
  History,
  RotateCw,
  XCircle,
  CalendarClock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { QuoteStatusBadge } from '@/components/tallerflow/badges'
import { useAppStore } from '@/store/app-store'
import { useQuotes, useQuote, useQuoteMutations, useSettings } from '@/lib/hooks/api'
import {
  QUOTE_STATUS,
  formatCurrency,
  formatDate,
  timeAgo,
  fullName,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

type QuoteStatusKey = keyof typeof QUOTE_STATUS

// ============== Helpers ==============
const PENDING_ORDER: Record<string, number> = { sent: 0, draft: 1, expired: 2, rejected: 3, approved: 4 }

function daysSince(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null
  const d = new Date(dateIso)
  if (isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000)))
}

function daysUntil(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null
  const d = new Date(dateIso)
  if (isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

// ============== Main View ==============
export function QuotesView() {
  const { navigate } = useAppStore()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [viewQuote, setViewQuote] = React.useState<any | null>(null)
  const [deleteQuote, setDeleteQuote] = React.useState<any | null>(null)
  const [rejectQuote, setRejectQuote] = React.useState<any | null>(null)

  const status = statusFilter !== 'all' ? statusFilter : undefined
  const { data, isLoading, isError, refetch } = useQuotes({ status })
  const quotes: any[] = data || []

  // Stats
  const { data: allData } = useQuotes({})
  const all: any[] = allData || []
  const total = all.length
  const pendingQuotes = all.filter((q) => q.status === 'sent')
  const pendingCount = pendingQuotes.length
  const approvedCount = all.filter((q) => q.status === 'approved').length
  const expiredCount = all.filter((q) => q.status === 'expired').length
  const pendingValue = pendingQuotes.reduce((acc, q) => acc + (q.total || 0), 0)
  const approvedValue = all
    .filter((q) => q.status === 'approved')
    .reduce((acc, q) => acc + (q.total || 0), 0)

  // Client-side filter by search + pending-first sorting
  const filtered = quotes
    .filter((q) => {
      if (!search) return true
      const s = search.toLowerCase()
      const cust = q.workOrder?.customer
      return (
        q.code?.toLowerCase().includes(s) ||
        `${cust?.firstName || ''} ${cust?.lastName || ''}`.toLowerCase().includes(s)
      )
    })
    .sort((a, b) => {
      const pa = PENDING_ORDER[a.status] ?? 9
      const pb = PENDING_ORDER[b.status] ?? 9
      if (pa !== pb) return pa - pb
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las cotizaciones enviadas a clientes.
          </p>
        </div>
        <Button onClick={() => navigate('work-orders')} className="gap-2">
          <Plus className="size-4" />
          Crear desde una orden
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total" value={String(total)} icon={<ClipboardList className="size-4" />} tone="slate" />
        <StatCard label="Pendientes" value={String(pendingCount)} icon={<Clock className="size-4" />} tone="sky" />
        <StatCard label="Valor pendiente" value={formatCurrency(pendingValue)} icon={<DollarSign className="size-4" />} tone="amber" />
        <StatCard label="Vencidas" value={String(expiredCount)} icon={<CalendarClock className="size-4" />} tone="orange" />
        <StatCard label="Aprobadas" value={String(approvedCount)} icon={<CheckCircle2 className="size-4" />} tone="emerald" />
        <StatCard label="Valor aprobado" value={formatCurrency(approvedValue)} icon={<DollarSign className="size-4" />} tone="teal" />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código o cliente…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {statusFilter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setStatusFilter('all')}
                >
                  {QUOTE_STATUS[statusFilter as QuoteStatusKey]?.label}
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            {/* Status pills */}
            <ScrollArea className="w-full">
              <div className="flex w-max gap-1.5 pb-1">
                <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                  Todas
                </FilterPill>
                {(Object.keys(QUOTE_STATUS) as QuoteStatusKey[]).map((k) => (
                  <FilterPill
                    key={k}
                    active={statusFilter === k}
                    onClick={() => setStatusFilter(k)}
                  >
                    {QUOTE_STATUS[k].label}
                  </FilterPill>
                ))}
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
              <p className="text-sm text-muted-foreground">Error al cargar cotizaciones.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No hay cotizaciones</p>
                <p className="text-sm text-muted-foreground">
                  Crea cotizaciones desde el detalle de una orden de trabajo.
                </p>
              </div>
              <Button onClick={() => navigate('work-orders')} variant="outline" size="sm">
                Ver órdenes
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
                  <TableHead className="text-center">Ítems</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="pr-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="pl-4 font-mono text-xs font-medium">
                      {q.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {fullName(
                            q.workOrder?.customer?.firstName,
                            q.workOrder?.customer?.lastName
                          )}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {q.workOrder?.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {[q.workOrder?.device?.brand, q.workOrder?.device?.model]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <QuoteStatusBadge status={q.status} />
                      {q.status === 'sent' &&
                        (() => {
                          const waiting = daysSince(q.sentAt || q.createdAt)
                          if (waiting === null) return null
                          return (
                            <p
                              className={cn(
                                'mt-0.5 text-[11px]',
                                waiting >= 5
                                  ? 'font-medium text-rose-600'
                                  : waiting >= 3
                                    ? 'font-medium text-amber-600'
                                    : 'text-muted-foreground'
                              )}
                            >
                              Esperando hace {waiting} {waiting === 1 ? 'día' : 'días'}
                            </p>
                          )
                        })()}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {q.items?.length || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(q.total || 0)}
                    </TableCell>
                    <TableCell>
                      {q.validUntil ? (
                        (() => {
                          const left = daysUntil(q.validUntil)
                          const overdue = left !== null && left < 0 && q.status !== 'approved'
                          const soon = left !== null && left >= 0 && left <= 3 && q.status === 'sent'
                          return (
                            <span
                              className={cn(
                                'text-xs',
                                overdue
                                  ? 'font-medium text-rose-600'
                                  : soon
                                    ? 'font-medium text-amber-600'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {formatDate(q.validUntil)}
                              {soon && ` (${left} ${left === 1 ? 'día' : 'días'})`}
                            </span>
                          )
                        })()
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <QuoteActionsMenu
                        quote={q}
                        onView={() => setViewQuote(q)}
                        onDeleted={(qte) => setDeleteQuote(qte)}
                        onRejected={(qte) => setRejectQuote(qte)}
                        onUpdated={refetch}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <QuoteDetailDialog quote={viewQuote} onOpenChange={(v) => !v && setViewQuote(null)} />

      {/* Reject dialog */}
      <RejectQuoteDialog
        quote={rejectQuote}
        onOpenChange={(v) => !v && setRejectQuote(null)}
        onDone={() => {
          setRejectQuote(null)
          refetch()
        }}
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteQuote} onOpenChange={(v) => !v && setDeleteQuote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización {deleteQuote?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={async () => {
                try {
                  const r = await fetch(`/api/quotes/${deleteQuote.id}`, { method: 'DELETE' })
                  if (!r.ok) {
                    const e = await r.json().catch(() => ({}))
                    throw new Error(e.error || 'Error al eliminar')
                  }
                  toast.success('Cotización eliminada')
                  setDeleteQuote(null)
                  refetch()
                } catch (e: any) {
                  toast.error(e.message)
                }
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

// ============== Sub-components ==============

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'slate' | 'sky' | 'emerald' | 'teal' | 'amber' | 'orange'
}) {
  const toneClasses = {
    slate: 'bg-slate-100 text-slate-600',
    sky: 'bg-sky-100 text-sky-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    teal: 'bg-teal-100 text-teal-700',
    amber: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
          <div className={cn('flex size-8 items-center justify-center rounded-md', toneClasses[tone])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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

function QuoteActionsMenu({
  quote,
  onView,
  onDeleted,
  onRejected,
  onUpdated,
}: {
  quote: any
  onView: () => void
  onDeleted: (q: any) => void
  onRejected: (q: any) => void
  onUpdated: () => void
}) {
  const { update } = useQuoteMutations()

  const copyLink = () => {
    const url = `${window.location.origin}/?quote=${quote.id}&token=${quote.approvalToken}`
    navigator.clipboard.writeText(url)
    toast.success('Enlace copiado al portapapeles')
  }

  const sendQuote = () => {
    update.mutate(
      { id: quote.id, data: { action: 'send' } },
      { onSuccess: () => onUpdated() }
    )
  }

  const resendQuote = () => {
    update.mutate(
      { id: quote.id, data: { action: 'resend' } },
      {
        onSuccess: () => {
          toast.success(
            quote.status === 'expired'
              ? 'Cotización reactivada con nueva validez de 7 días'
              : 'Cotización reenviada'
          )
          onUpdated()
        },
      }
    )
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Acciones">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onView}>
            <Eye className="size-4" /> Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyLink}>
            <LinkIcon className="size-4" /> Copiar enlace
          </DropdownMenuItem>
          {quote.status === 'draft' && (
            <DropdownMenuItem onClick={sendQuote} disabled={update.isPending}>
              <Send className="size-4" /> Enviar
            </DropdownMenuItem>
          )}
          {(quote.status === 'sent' || quote.status === 'expired') && (
            <DropdownMenuItem onClick={resendQuote} disabled={update.isPending}>
              <RotateCw className="size-4" /> Reenviar
            </DropdownMenuItem>
          )}
          {(quote.status === 'draft' || quote.status === 'sent') && (
            <DropdownMenuItem
              className="text-amber-600 focus:text-amber-700"
              onClick={() => onRejected(quote)}
            >
              <XCircle className="size-4" /> Marcar rechazada
            </DropdownMenuItem>
          )}
          {quote.status !== 'approved' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-rose-600 focus:text-rose-700"
                onClick={() => onDeleted(quote)}
              >
                <Trash2 className="size-4" /> Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ============== Reject Quote Dialog ==============
function RejectQuoteDialog({
  quote,
  onOpenChange,
  onDone,
}: {
  quote: any | null
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const [reason, setReason] = React.useState('')
  const { update } = useQuoteMutations()

  const reject = () => {
    if (!quote) return
    update.mutate(
      { id: quote.id, data: { action: 'reject', reason: reason.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success(`Cotización ${quote.code} marcada como rechazada`)
          setReason('')
          onDone()
        },
        onError: () => toast.error('No se pudo rechazar la cotización'),
      }
    )
  }

  return (
    <Dialog open={!!quote} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Rechazar la cotización {quote?.code}?</DialogTitle>
          <DialogDescription>
            La orden quedará disponible para crear una nueva cotización. Puedes registrar el motivo.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo del rechazo (opcional). Ej: precio, demora, cliente compró equipo nuevo…"
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={reject} disabled={update.isPending}>
            {update.isPending ? 'Rechazando…' : 'Rechazar cotización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Quote Detail Dialog ==============
function QuoteDetailDialog({
  quote,
  onOpenChange,
}: {
  quote: any | null
  onOpenChange: (v: boolean) => void
}) {
  const { data: settings } = useSettings()
  const { data: full, isLoading: loadingFull } = useQuote(quote?.id ?? null)
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
            Creada {timeAgo(quote.createdAt)}
            {quote.workOrder && (
              <> · Orden <span className="font-mono">{quote.workOrder.code}</span></>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-4">
            <div className="rounded-md border p-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium">
                    {fullName(
                      quote.workOrder?.customer?.firstName,
                      quote.workOrder?.customer?.lastName
                    )}
                  </p>
                  {quote.workOrder?.customer?.phone && (
                    <p className="text-xs text-muted-foreground">
                      {quote.workOrder.customer.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Equipo</p>
                  <p className="font-medium">
                    {[quote.workOrder?.device?.brand, quote.workOrder?.device?.model]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  </p>
                  {quote.workOrder?.device?.serial && (
                    <p className="font-mono text-xs text-muted-foreground">
                      S/N: {quote.workOrder.device.serial}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
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
                      <Badge variant="secondary" className="mt-0.5 text-[10px]">
                        {it.itemType === 'part' ? 'Repuesto' : it.itemType === 'labor' ? 'Mano de obra' : 'Otro'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(it.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(it.total)}
                    </TableCell>
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
            </div>

            <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(quote.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                {quote.tax > 0 ? (
                  <span className="tabular-nums">{formatCurrency(quote.tax)}</span>
                ) : (
                  <span className="text-muted-foreground">Exento</span>
                )}
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

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              {quote.validUntil && (
                <span>Válida hasta: <strong className="text-foreground">{formatDate(quote.validUntil)}</strong></span>
              )}
              {quote.approvedBy && (
                <span className="text-emerald-600">
                  Aprobada por: <strong>{quote.approvedBy}</strong>
                </span>
              )}
              {quote.approvedAt && (
                <span>Fecha de aprobación: <strong className="text-foreground">{formatDate(quote.approvedAt)}</strong></span>
              )}
              {quote.rejectionReason && (
                <span className="text-rose-600">
                  Motivo de rechazo: {quote.rejectionReason}
                </span>
              )}
              {full?.viewedAt && (
                <span className="text-sky-600">
                  Vista por el cliente: <strong>{timeAgo(full.viewedAt)}</strong>
                </span>
              )}
              {full?.sentAt && (
                <span>Enviada: <strong className="text-foreground">{formatDate(full.sentAt)}</strong></span>
              )}
            </div>

            {/* Historial */}
            <QuoteHistory events={full?.events} loading={loadingFull} />
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

// ============== Quote History ==============
const EVENT_DOT: Record<string, string> = {
  created: 'bg-slate-400',
  sent: 'bg-sky-500',
  viewed: 'bg-sky-300',
  resent: 'bg-sky-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  expired: 'bg-orange-500',
  edited: 'bg-violet-500',
}

function QuoteHistory({
  events,
  loading,
}: {
  events: any[] | undefined
  loading: boolean
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <History className="size-3.5" /> Historial
      </p>
      {loading ? (
        <div className="mt-2 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : !events || events.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">Sin eventos registrados.</p>
      ) : (
        <div className="relative mt-2">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
          <ul className="space-y-3">
            {[...events].reverse().map((ev) => (
              <li key={ev.id} className="relative pl-6">
                <span
                  className={cn(
                    'absolute left-0 top-1 size-[11px] rounded-full border-2 border-background',
                    EVENT_DOT[ev.eventType] || 'bg-slate-400'
                  )}
                />
                <p className="text-xs font-medium leading-tight">{ev.title}</p>
                {ev.description && (
                  <p className="text-[11px] text-muted-foreground whitespace-pre-wrap">
                    {ev.description}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">{timeAgo(ev.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
