'use client'

import { useState } from 'react'
import {
  Receipt,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Check,
  XCircle,
  Printer,
  CreditCard,
  Banknote,
  Landmark,
  Calendar,
  User as UserIcon,
  Wallet,
  TrendingUp,
  FileCheck,
  Clock,
  DollarSign,
  MessageCircle,
  Send,
  Pencil,
  Save,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useInvoices, useInvoiceMutations, useWorkOrders, useSettings, useSendInvoiceWhatsApp } from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import {
  INVOICE_STATUS,
  PAYMENT_METHODS,
  WORK_ORDER_STATUS,
  formatCurrency,
  formatDate,
  formatDateTime,
  fullName,
  getInitials,
} from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InvoiceStatusBadge } from '@/components/tallerflow/badges'
import { cn } from '@/lib/utils'

const PAYMENT_ICON_MAP: Record<string, any> = { cash: Banknote, card: CreditCard, transfer: Landmark }
const STATUS_KEYS = Object.keys(INVOICE_STATUS)

export function InvoicesView() {
  const { navigate } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewing, setViewing] = useState<any | null>(null)
  const [paying, setPaying] = useState<any | null>(null)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [markPaidId, setMarkPaidId] = useState<string | null>(null)

  const { data: invoices, isLoading } = useInvoices({ status: statusFilter === 'all' ? undefined : statusFilter, search })
  const { update: updateInvoice, remove: removeInvoice } = useInvoiceMutations()
  const { data: settings } = useSettings()
  const sendWhatsApp = useSendInvoiceWhatsApp()

  // Stats from all invoices
  const { data: allInvoices } = useInvoices({})
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const symbol = settings?.currencySymbol || '$'
  const activeInvoices = (allInvoices || []).filter((i: any) => i.status !== 'cancelled')
  const stats = {
    total: allInvoices?.length || 0,
    pending: allInvoices?.filter((i: any) => i.status === 'pending' || i.status === 'partial').length || 0,
    paid: allInvoices?.filter((i: any) => i.status === 'paid').length || 0,
    // Dinero efectivamente recibido este mes (incluye abonos de facturas parciales)
    monthRevenue:
      activeInvoices
        .filter((i: any) => (i.paid || 0) > 0 && i.paidAt && new Date(i.paidAt) >= startOfMonth)
        .reduce((sum: number, i: any) => sum + (i.paid || 0), 0) || 0,
    totalBilled: activeInvoices.reduce((sum: number, i: any) => sum + (i.total || 0), 0),
    totalCollected: activeInvoices.reduce((sum: number, i: any) => sum + (i.paid || 0), 0),
    outstanding: activeInvoices.reduce(
      (sum: number, i: any) => sum + Math.max(0, (i.total || 0) - (i.paid || 0)),
      0
    ),
  }

  const financeCards = [
    { label: 'Total Facturado', value: formatCurrency(stats.totalBilled, symbol), icon: Receipt, color: 'bg-slate-100 text-slate-600' },
    { label: 'Total Cobrado', value: formatCurrency(stats.totalCollected, symbol), icon: Wallet, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Saldo por Cobrar', value: formatCurrency(stats.outstanding, symbol), icon: AlertCircle, color: 'bg-amber-100 text-amber-600', highlight: stats.outstanding > 0 },
    { label: 'Ingresos del Mes', value: formatCurrency(stats.monthRevenue, symbol), icon: TrendingUp, color: 'bg-violet-100 text-violet-600', hint: 'Incluye abonos' },
  ]
  const countCards = [
    { key: 'all', label: 'Total Facturas', value: stats.total, icon: Receipt, color: 'bg-slate-100 text-slate-600' },
    { key: 'pending', label: 'Pendientes', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { key: 'paid', label: 'Pagadas', value: stats.paid, icon: Check, color: 'bg-emerald-100 text-emerald-600' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Nueva Factura
        </Button>
      </div>

      {/* Métricas financieras */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {financeCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className={cn(s.highlight && 'border-amber-300 dark:border-amber-700')}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', s.color)}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold leading-tight tabular-nums lg:text-xl">{s.value}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.label}
                    {s.hint && <span className="hidden text-[10px] sm:inline"> · {s.hint}</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Conteos (clic filtra la tabla) */}
      <div className="grid grid-cols-3 gap-3">
        {countCards.map((s) => {
          const Icon = s.icon
          return (
            <Card
              key={s.key}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setStatusFilter(s.key === 'all' ? 'all' : s.key)}
            >
              <CardContent className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-10', s.color)}>
                  <Icon className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-tight tabular-nums lg:text-2xl">{s.value}</p>
                  <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="Todas" />
        {STATUS_KEYS.map((key) => (
          <FilterPill
            key={key}
            active={statusFilter === key}
            onClick={() => setStatusFilter(key)}
            label={(INVOICE_STATUS as any)[key].label}
            colorClass={(INVOICE_STATUS as any)[key].color}
          />
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <Receipt className="size-7 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">No hay facturas</p>
                <p className="text-sm text-muted-foreground">Crea la primera factura desde una orden entregada.</p>
              </div>
              <Button variant="outline" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> Nueva Factura
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="pl-4">Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Orden</TableHead>
                    <TableHead className="hidden lg:table-cell">Equipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Pagado</TableHead>
                    <TableHead className="hidden lg:table-cell">Emisión</TableHead>
                    <TableHead className="pr-4 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => {
                    const balance = inv.total - inv.paid
                    return (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setViewing(inv)}
                      >
                        <TableCell className="pl-4 font-mono text-xs font-semibold">{inv.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                                {getInitials(fullName(inv.customer?.firstName, inv.customer?.lastName))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{fullName(inv.customer?.firstName, inv.customer?.lastName)}</p>
                              <p className="truncate text-xs text-muted-foreground">{inv.customer?.phone || inv.customer?.email || ''}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs md:table-cell">{inv.workOrder?.code}</TableCell>
                        <TableCell className="hidden text-xs lg:table-cell">
                          {inv.workOrder?.device ? `${inv.workOrder.device.brand} ${inv.workOrder.device.model}` : '—'}
                        </TableCell>
                        <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(inv.total, settings?.currencySymbol || '$')}</TableCell>
                        <TableCell className="hidden text-right sm:table-cell">
                          {inv.paid > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-medium text-emerald-600">{formatCurrency(inv.paid, settings?.currencySymbol || '$')}</span>
                              {balance > 0 && <span className="text-[10px] text-amber-600">Saldo: {formatCurrency(balance, settings?.currencySymbol || '$')}</span>}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{formatDate(inv.issuedAt)}</TableCell>
                        <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label="Acciones">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewing(inv)}>
                                <Eye className="mr-2 size-4" /> Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditing(inv)}>
                                <Pencil className="mr-2 size-4" /> Editar factura
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => sendWhatsApp.mutate(inv.id)}
                                disabled={sendWhatsApp.isPending}
                                className="text-emerald-600 focus:text-emerald-600"
                              >
                                <MessageCircle className="mr-2 size-4" />
                                {sendWhatsApp.isPending ? 'Enviando...' : 'Enviar por WhatsApp'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.print()}>
                                <Printer className="mr-2 size-4" /> Imprimir
                              </DropdownMenuItem>
                              {(inv.status === 'pending' || inv.status === 'partial') && (
                                <>
                                  <DropdownMenuItem onClick={() => setPaying(inv)}>
                                    <DollarSign className="mr-2 size-4" /> Registrar pago
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setMarkPaidId(inv.id)}>
                                    <Check className="mr-2 size-4" /> Marcar pagada
                                  </DropdownMenuItem>
                                </>
                              )}
                              {inv.status === 'pending' && (
                                <DropdownMenuItem
                                  className="text-amber-600 focus:text-amber-600"
                                  onClick={() => setCancelId(inv.id)}
                                >
                                  <XCircle className="mr-2 size-4" /> Anular
                                </DropdownMenuItem>
                              )}
                              {(inv.status === 'pending' || inv.status === 'cancelled') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-rose-600 focus:text-rose-600"
                                    onClick={() => setDeleteId(inv.id)}
                                  >
                                    <Trash2 className="mr-2 size-4" /> Eliminar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create Dialog */}
      {createOpen && (
        <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}

      {/* View Dialog */}
      {viewing && (
        <InvoiceDetailDialog invoice={viewing} onClose={() => setViewing(null)} onPay={() => { setPaying(viewing); setViewing(null) }} onEdit={() => { setEditing(viewing); setViewing(null) }} />
      )}

      {/* Payment Dialog */}
      {paying && (
        <PaymentDialog invoice={paying} onClose={() => setPaying(null)} />
      )}

      {/* Edit Dialog */}
      {editing && (
        <EditInvoiceDialog invoice={editing} onClose={() => setEditing(null)} />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La factura será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                if (deleteId) removeInvoice.mutate(deleteId)
                setDeleteId(null)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular factura?</AlertDialogTitle>
            <AlertDialogDescription>
              La factura será marcada como anulada. No se puede revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                if (cancelId) updateInvoice.mutate({ id: cancelId, data: { action: 'cancel' } })
                setCancelId(null)
              }}
            >
              Sí, anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark paid confirm */}
      <AlertDialog open={!!markPaidId} onOpenChange={(o) => !o && setMarkPaidId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como pagada?</AlertDialogTitle>
            <AlertDialogDescription>
              La factura se marcará como pagada en su totalidad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (markPaidId) updateInvoice.mutate({ id: markPaidId, data: { action: 'mark_paid' } })
                setMarkPaidId(null)
              }}
            >
              Marcar pagada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilterPill({ active, onClick, label, colorClass }: { active: boolean; onClick: () => void; label: string; colorClass?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'
      )}
    >
      {label}
    </button>
  )
}

// ============== Create Invoice Dialog ==============
function CreateInvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { create } = useInvoiceMutations()
  const { data: settings } = useSettings()
  const [workOrderId, setWorkOrderId] = useState('')
  const [items, setItems] = useState<any[]>([{ description: '', quantity: 1, unitPrice: 0 }])
  const [paid, setPaid] = useState<string>('0')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [notes, setNotes] = useState('')
  const [applyTax, setApplyTax] = useState<boolean>(true)

  // Load work orders that are ready/delivered for invoicing
  const { data: readyOrders } = useWorkOrders({})

  const availableOrders = (readyOrders || []).filter((wo: any) =>
    ['ready', 'delivered'].includes(wo.status)
  )

  const selectedOrder = availableOrders.find((wo: any) => wo.id === workOrderId)

  const handleSelectOrder = (id: string) => {
    setWorkOrderId(id)
    const wo = availableOrders.find((w: any) => w.id === id)
    if (wo && wo.totalAmount > 0) {
      setItems([{ description: `Servicio de reparación - ${wo.code}`, quantity: 1, unitPrice: wo.totalAmount, itemType: 'other' }])
    }
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  const taxRate = settings?.taxRate || 0
  const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0
  const total = subtotal + taxAmount
  const paidAmount = Number(paid) || 0
  const balance = total - paidAmount

  const updateItem = (idx: number, field: string, value: string) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }
  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const valid = workOrderId !== '' && items.every((it) => it.description.trim() !== '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !selectedOrder) return
    const itemsData = items.map((it) => ({
      itemType: it.itemType || 'other',
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
    }))
    create.mutate(
      {
        workOrderId,
        customerId: selectedOrder.customerId,
        items: itemsData,
        paid: paidAmount,
        paymentMethod: paidAmount > 0 ? paymentMethod : null,
        notes: notes || null,
        applyTax,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="size-5 text-primary" />
            Nueva Factura
          </DialogTitle>
          <DialogDescription>Genera una factura desde una orden de trabajo entregada o lista.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Select order */}
          <div className="grid gap-2">
            <Label>Orden de trabajo *</Label>
            <Select value={workOrderId} onValueChange={handleSelectOrder}>
              <SelectTrigger><SelectValue placeholder="Selecciona una orden..." /></SelectTrigger>
              <SelectContent>
                {availableOrders.length === 0 ? (
                  <SelectItem value="_none" disabled>No hay órdenes listas para facturar</SelectItem>
                ) : (
                  availableOrders.map((wo: any) => (
                    <SelectItem key={wo.id} value={wo.id}>
                      {wo.code} — {wo.customer?.firstName} {wo.customer?.lastName} — {wo.device?.brand} {wo.device?.model}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedOrder && (
              <div className="rounded-md border bg-muted/30 p-2.5 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-muted-foreground">Equipo:</span>
                  <span>{selectedOrder.device?.brand} {selectedOrder.device?.model}</span>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Items de la factura</Label>
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
                    placeholder="Precio unit."
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

          {/* Totals */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Aplicar impuesto ({taxRate}%)</span>
              <Switch checked={applyTax} onCheckedChange={setApplyTax} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal, settings?.currencySymbol || '$')}</span>
            </div>
            {applyTax && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impuesto ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount, settings?.currencySymbol || '$')}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t pt-1 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total, settings?.currencySymbol || '$')}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="paid">Pago inicial</Label>
              <Input
                id="paid"
                type="number"
                min="0"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                placeholder="0"
              />
              <p className="text-[11px] text-muted-foreground">
                {paidAmount === 0 ? 'Pendiente' : paidAmount >= total ? 'Pagada' : 'Pago parcial'}
                {balance > 0 && paidAmount > 0 && ` · Saldo: ${formatCurrency(balance, settings?.currencySymbol || '$')}`}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={paidAmount === 0}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([key, conf]: any) => {
                    const Icon = PAYMENT_ICON_MAP[key] || DollarSign
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas internas o información adicional..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={!valid || create.isPending} className="gap-1.5">
              <FileCheck className="size-4" />
              {create.isPending ? 'Creando...' : 'Generar factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== Invoice Detail Dialog ==============
function InvoiceDetailDialog({ invoice, onClose, onPay, onEdit }: { invoice: any; onClose: () => void; onPay: () => void; onEdit: () => void }) {
  const { data: settings } = useSettings()
  const { navigate } = useAppStore()
  const sendWhatsApp = useSendInvoiceWhatsApp()
  const symbol = settings?.currencySymbol || '$'
  const balance = invoice.total - invoice.paid
  const canPay = invoice.status === 'pending' || invoice.status === 'partial'

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 font-mono">
                <Receipt className="size-5 text-primary" />
                {invoice.code}
              </DialogTitle>
              <DialogDescription>
                Emitida el {formatDateTime(invoice.issuedAt)}
                {invoice.paidAt && ` · Pagada el ${formatDate(invoice.paidAt)}`}
              </DialogDescription>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer & Order */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Cliente</p>
              <button
                className="flex items-center gap-2 text-left hover:underline"
                onClick={() => { navigate('customer-detail', { customerId: invoice.customerId }); onClose() }}
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                    {getInitials(fullName(invoice.customer?.firstName, invoice.customer?.lastName))}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{fullName(invoice.customer?.firstName, invoice.customer?.lastName)}</p>
                  <p className="text-xs text-muted-foreground">{invoice.customer?.phone || invoice.customer?.email}</p>
                </div>
              </button>
            </div>
            <div className="rounded-md border p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Orden de trabajo</p>
              <button
                className="hover:underline"
                onClick={() => { navigate('work-order-detail', { workOrderId: invoice.workOrderId }); onClose() }}
              >
                <p className="font-mono text-sm font-medium">{invoice.workOrder?.code}</p>
                <p className="text-xs text-muted-foreground">
                  {invoice.workOrder?.device?.brand} {invoice.workOrder?.device?.model}
                </p>
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="pl-3">Descripción</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="pr-3 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items?.map((it: any) => (
                  <TableRow key={it.id}>
                    <TableCell className="pl-3 text-sm">{it.description}</TableCell>
                    <TableCell className="text-center text-sm">{it.quantity}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(it.unitPrice, symbol)}</TableCell>
                    <TableCell className="pr-3 text-right text-sm font-medium">{formatCurrency(it.total, symbol)}</TableCell>
                  </TableRow>
                ))}
                {(!invoice.items || invoice.items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                      Sin items
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="ml-auto w-full max-w-xs space-y-1 rounded-lg bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, symbol)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impuesto</span>
              <span>{formatCurrency(invoice.tax, symbol)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, symbol)}</span>
            </div>
            {invoice.paid > 0 && (
              <>
                <div className="flex justify-between text-emerald-600">
                  <span>Pagado</span>
                  <span>{formatCurrency(invoice.paid, symbol)}</span>
                </div>
                {balance > 0 && (
                  <div className="flex justify-between font-semibold text-amber-600">
                    <span>Saldo</span>
                    <span>{formatCurrency(balance, symbol)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {invoice.notes && (
            <div className="rounded-md border-l-4 border-l-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
              <p className="text-[11px] font-semibold uppercase text-amber-700">Notas</p>
              <p className="mt-0.5 text-amber-900 dark:text-amber-200">{invoice.notes}</p>
            </div>
          )}

          {settings?.warrantyPolicy && (
            <div className="rounded-md border-l-4 border-l-emerald-300 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/20">
              <p className="text-[11px] font-semibold uppercase text-emerald-700">Política de garantías</p>
              <p className="mt-0.5 whitespace-pre-wrap text-emerald-900 dark:text-emerald-200">{settings.warrantyPolicy}</p>
            </div>
          )}

          {invoice.paymentMethod && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Método de pago:</span>
              <Badge variant="outline" className="gap-1">
                {(() => {
                  const Icon = PAYMENT_ICON_MAP[invoice.paymentMethod] || DollarSign
                  return <Icon className="size-3" />
                })()}
                {(PAYMENT_METHODS as any)[invoice.paymentMethod]?.label || invoice.paymentMethod}
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onEdit}
            className="gap-1.5"
          >
            <Pencil className="size-4" /> Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => sendWhatsApp.mutate(invoice.id)}
            disabled={sendWhatsApp.isPending}
            className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <MessageCircle className="size-4" />
            {sendWhatsApp.isPending ? 'Enviando...' : 'Enviar por WhatsApp'}
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
            <Printer className="size-4" /> Imprimir
          </Button>
          {canPay && (
            <Button onClick={onPay} className="gap-1.5">
              <DollarSign className="size-4" /> Registrar pago
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="ghost">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Payment Dialog ==============
function PaymentDialog({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const { update } = useInvoiceMutations()
  const { data: settings } = useSettings()
  const symbol = settings?.currencySymbol || '$'
  const balance = invoice.total - invoice.paid
  const [amount, setAmount] = useState<string>(String(balance))
  const [paymentMethod, setPaymentMethod] = useState<string>(invoice.paymentMethod || 'cash')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = Number(amount) || 0
    if (amt <= 0) return
    update.mutate(
      { id: invoice.id, data: { action: 'register_payment', paid: amt, paymentMethod, notes: notes || undefined } },
      { onSuccess: onClose }
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-emerald-500" />
            Registrar pago
          </DialogTitle>
          <DialogDescription>
            Factura {invoice.code} · Saldo actual: <span className="font-semibold">{formatCurrency(balance, symbol)}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Monto del pago *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <div className="flex gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => setAmount(String(balance))}>
                Pago completo ({formatCurrency(balance, symbol)})
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Método de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHODS).map(([key, conf]: any) => {
                  const Icon = PAYMENT_ICON_MAP[key] || DollarSign
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
            <Label htmlFor="payNotes">Notas (opcional)</Label>
            <Textarea
              id="payNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referencia de transferencia, observaciones..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={update.isPending} className="gap-1.5">
              <Check className="size-4" />
              {update.isPending ? 'Registrando...' : 'Confirmar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== Edit Invoice Dialog ==============
function EditInvoiceDialog({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const { update } = useInvoiceMutations()
  const { data: settings } = useSettings()
  const taxRate = settings?.taxRate || 19
  const symbol = settings?.currencySymbol || '$'

  // Estado de items
  const [items, setItems] = useState<any[]>(
    invoice.items?.map((it: any) => ({
      description: it.description,
      quantity: String(it.quantity),
      unitPrice: String(it.unitPrice),
    })) || [{ description: '', quantity: '1', unitPrice: '0' }]
  )

  // Estado de campos generales
  const [notes, setNotes] = useState(invoice.notes || '')
  const [paymentMethod, setPaymentMethod] = useState(invoice.paymentMethod || 'cash')
  const [status, setStatus] = useState(invoice.status || 'pending')
  const [applyTax, setApplyTax] = useState<boolean>(invoice.tax > 0)

  // Cálculos
  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)
  const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0
  const total = subtotal + taxAmount

  const updateItem = (idx: number, field: string, value: string) => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }
  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '0' }])
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const valid = items.length > 0 && items.every((it) => it.description.trim() !== '')
  const isPaid = invoice.status === 'paid'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return

    const itemsData = items.map((it) => ({
      itemType: 'other',
      description: it.description,
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
    }))

    update.mutate({
      id: invoice.id,
      data: {
        action: 'update_items',
        items: itemsData,
        notes: notes || null,
        paymentMethod,
        status,
        applyTax,
      },
    }, {
      onSuccess: () => {
        toast.success('Factura actualizada correctamente')
        onClose()
      },
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-primary" />
            Editar Factura {invoice.code}
          </DialogTitle>
          <DialogDescription>
            Corrige los items, totales, notas o método de pago de esta factura.
          </DialogDescription>
        </DialogHeader>

        {isPaid && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong>Atención:</strong> Esta factura ya está marcada como pagada.
                Si cambias los items o totales, el saldo puede verse afectado.
                Considera anular y crear una nueva si el cambio es significativo.
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Items */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Items de la factura</Label>
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

          {/* Totales */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Aplicar impuesto ({taxRate}%)</span>
              <Switch checked={applyTax} onCheckedChange={setApplyTax} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal, symbol)}</span>
            </div>
            {applyTax && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impuesto ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount, symbol)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t pt-1 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total, symbol)}</span>
            </div>
            {invoice.paid > 0 && (
              <div className="mt-1 flex justify-between text-xs text-emerald-600">
                <span>Ya pagado</span>
                <span>{formatCurrency(invoice.paid, symbol)}</span>
              </div>
            )}
            {invoice.paid > 0 && total !== invoice.total && (
              <div className="mt-1 flex justify-between text-xs font-semibold text-amber-600">
                <span>Nuevo saldo</span>
                <span>{formatCurrency(total - invoice.paid, symbol)}</span>
              </div>
            )}
          </div>

          {/* Método de pago y estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([key, conf]: any) => {
                    const Icon = PAYMENT_ICON_MAP[key] || DollarSign
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
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="partial">Pago parcial</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="cancelled">Anulada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Notas</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas de la factura..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={!valid || update.isPending} className="gap-2">
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
