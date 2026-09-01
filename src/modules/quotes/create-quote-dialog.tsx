'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { X, Plus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

import { useQuoteMutations } from '@/lib/hooks/api'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useSettings } from '@/lib/hooks/api'

export interface QuoteItemDraft {
  itemType: string
  description: string
  quantity: string
  unitPrice: string
}

interface CreateQuoteDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  workOrderId: string
}

export function CreateQuoteDialog({ open, onOpenChange, workOrderId }: CreateQuoteDialogProps) {
  const { create } = useQuoteMutations()
  const { data: settings } = useSettings()
  const [items, setItems] = React.useState<QuoteItemDraft[]>([
    { itemType: 'labor', description: '', quantity: '1', unitPrice: '0' },
  ])
  const [notes, setNotes] = React.useState('')
  const [sendImmediately, setSendImmediately] = React.useState(false)
  const [applyIva, setApplyIva] = React.useState(true)
  const [taxRateInput, setTaxRateInput] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setItems([{ itemType: 'labor', description: '', quantity: '1', unitPrice: '0' }])
      setNotes('')
      setSendImmediately(false)
      setApplyIva(true)
      setTaxRateInput(String(settings?.taxRate ?? 19))
    }
  }, [open, settings?.taxRate])

  const taxRate = applyIva ? Math.min(Math.max(parseFloat(taxRateInput) || 0, 0), 100) : 0
  const subtotal = items.reduce(
    (acc, it) => acc + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0),
    0
  )
  const tax = applyIva ? subtotal * (taxRate / 100) : 0
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
        applyTax: applyIva,
        ...(applyIva ? { taxRate } : {}),
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
            Define los ítems (repuestos, mano de obra, otros). El IVA es opcional.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3">
            {items.map((it, idx) => {
              const lineTotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)
              return (
                <div key={idx} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Ítem #{idx + 1}
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

          {/* IVA opcional */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="quote-apply-iva" className="text-sm">Aplicar IVA</Label>
              <Switch id="quote-apply-iva" checked={applyIva} onCheckedChange={setApplyIva} />
              {applyIva && (
                <div className="flex items-center gap-1.5">
                  <Input
                    className="h-8 w-20"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRateInput}
                    onChange={(e) => setTaxRateInput(e.target.value)}
                    aria-label="Porcentaje de IVA"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
            {applyIva && taxRate === 0 && (
              <p className="text-[11px] text-amber-600">Define un % mayor que 0 para aplicar impuesto</p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {applyIva ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA ({taxRate}%)</span>
                <span className="tabular-nums">{formatCurrency(tax)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-muted-foreground">
                <span>IVA</span>
                <span>Exento</span>
              </div>
            )}
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