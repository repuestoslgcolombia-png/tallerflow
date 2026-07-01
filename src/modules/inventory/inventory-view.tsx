'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  AlertTriangle,
  TrendingDown,
  Pencil,
  Settings,
  ArrowUp,
  ArrowDown,
  Hash,
  MapPin,
  DollarSign,
  Loader2,
  X,
  Boxes,
  Wallet,
  ShoppingBag,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useParts, usePartMutations } from '@/lib/hooks/api'
import {
  MOVEMENT_TYPES,
  formatCurrency,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

// ============== Main View ==============
export function InventoryView() {
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState<string>('all')
  const [lowStockOnly, setLowStockOnly] = React.useState(false)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editPart, setEditPart] = React.useState<any | null>(null)
  const [adjustPart, setAdjustPart] = React.useState<any | null>(null)

  const { data, isLoading, isError } = useParts({
    search,
    lowStock: lowStockOnly,
  })
  const parts: any[] = data || []

  // Categories derived from data
  const categories = React.useMemo(() => {
    const set = new Set<string>()
    parts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort()
  }, [parts])

  // Apply category filter client-side
  const filtered = parts.filter((p) => {
    if (category !== 'all' && p.category !== category) return false
    return true
  })

  // Stats from all parts (no filter)
  const { data: allData } = useParts({})
  const allParts: any[] = allData || []
  const totalParts = allParts.length
  const lowStockCount = allParts.filter(
    (p) => p.stock <= (p.minStock || 0)
  ).length
  const inventoryValue = allParts.reduce(
    (acc, p) => acc + (p.stock || 0) * (p.unitCost || 0),
    0
  )
  const potentialSalesValue = allParts.reduce(
    (acc, p) => acc + (p.stock || 0) * (p.unitPrice || 0),
    0
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Repuestos y materiales del taller
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Nuevo Repuesto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total repuestos"
          value={String(totalParts)}
          icon={<Boxes className="size-4" />}
          tone="slate"
        />
        <StatCard
          label="Stock bajo"
          value={String(lowStockCount)}
          icon={<TrendingDown className="size-4" />}
          tone={lowStockCount > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          label="Valor inventario"
          value={formatCurrency(inventoryValue)}
          icon={<Wallet className="size-4" />}
          tone="amber"
        />
        <StatCard
          label="Valor venta potencial"
          value={formatCurrency(potentialSalesValue)}
          icon={<ShoppingBag className="size-4" />}
          tone="teal"
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU, nombre, descripción…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-xs font-medium">
                <Switch
                  checked={lowStockOnly}
                  onCheckedChange={setLowStockOnly}
                />
                Stock bajo
              </label>
            </div>
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
              <p className="text-sm text-muted-foreground">Error al cargar el inventario.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Package className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No hay repuestos</p>
                <p className="text-sm text-muted-foreground">
                  {lowStockOnly
                    ? 'No hay repuestos con stock bajo.'
                    : 'Registra tu primer repuesto.'}
                </p>
              </div>
              <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Nuevo Repuesto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Mín.</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="pr-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const stock = p.stock || 0
                  const min = p.minStock || 0
                  const stockTone =
                    stock <= 0
                      ? 'rose'
                      : stock <= min
                      ? 'amber'
                      : 'emerald'
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="pl-4 font-mono text-xs font-medium">
                        {p.sku}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{p.name}</span>
                          {p.description && (
                            <span className="max-w-[220px] truncate text-xs text-muted-foreground">
                              {p.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.category ? (
                          <Badge variant="outline" className="bg-muted/50">
                            {p.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              stockTone === 'rose' && 'bg-rose-500',
                              stockTone === 'amber' && 'bg-amber-500',
                              stockTone === 'emerald' && 'bg-emerald-500'
                            )}
                          />
                          <span
                            className={cn(
                              'font-medium tabular-nums',
                              stockTone === 'rose' && 'text-rose-600',
                              stockTone === 'amber' && 'text-amber-600',
                              stockTone === 'emerald' && 'text-foreground'
                            )}
                          >
                            {stock}
                          </span>
                          <span className="text-xs text-muted-foreground">{p.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {min}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatCurrency(p.unitCost || 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(p.unitPrice || 0)}
                      </TableCell>
                      <TableCell>
                        {p.location ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" /> {p.location}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <PartActionsMenu
                          part={p}
                          onEdit={() => setEditPart(p)}
                          onAdjust={() => setAdjustPart(p)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PartFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />
      <PartFormDialog
        open={!!editPart}
        onOpenChange={(v) => !v && setEditPart(null)}
        mode="edit"
        part={editPart}
      />
      <AdjustStockDialog
        part={adjustPart}
        onOpenChange={(v) => !v && setAdjustPart(null)}
      />
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
  tone: 'slate' | 'rose' | 'emerald' | 'amber' | 'teal'
}) {
  const toneClasses = {
    slate: 'bg-slate-100 text-slate-600',
    rose: 'bg-rose-100 text-rose-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    teal: 'bg-teal-100 text-teal-700',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
          </div>
          <div className={cn('flex size-8 items-center justify-center rounded-md', toneClasses[tone])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PartActionsMenu({
  part,
  onEdit,
  onAdjust,
}: {
  part: any
  onEdit: () => void
  onAdjust: () => void
}) {
  const { update } = usePartMutations()

  const toggleActive = () => {
    update.mutate({
      id: part.id,
      data: { active: !part.active },
    })
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onAdjust}>
            <Settings className="size-4" /> Ajustar stock
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleActive} disabled={update.isPending}>
            {part.active ? (
              <>
                <X className="size-4" /> Desactivar
              </>
            ) : (
              <>
                <Package className="size-4" /> Activar
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ============== Part Form Dialog (create/edit) ==============
function PartFormDialog({
  open,
  onOpenChange,
  mode,
  part,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  mode: 'create' | 'edit'
  part?: any | null
}) {
  const { create, update } = usePartMutations()

  const [sku, setSku] = React.useState('')
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [unit, setUnit] = React.useState('unidad')
  const [stock, setStock] = React.useState('0')
  const [minStock, setMinStock] = React.useState('0')
  const [unitCost, setUnitCost] = React.useState('0')
  const [unitPrice, setUnitPrice] = React.useState('0')
  const [location, setLocation] = React.useState('')

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && part) {
        setSku(part.sku || '')
        setName(part.name || '')
        setDescription(part.description || '')
        setCategory(part.category || '')
        setUnit(part.unit || 'unidad')
        setStock(String(part.stock ?? 0))
        setMinStock(String(part.minStock ?? 0))
        setUnitCost(String(part.unitCost ?? 0))
        setUnitPrice(String(part.unitPrice ?? 0))
        setLocation(part.location || '')
      } else {
        setSku('')
        setName('')
        setDescription('')
        setCategory('')
        setUnit('unidad')
        setStock('0')
        setMinStock('0')
        setUnitCost('0')
        setUnitPrice('0')
        setLocation('')
      }
    }
  }, [open, mode, part])

  const canSubmit = sku.trim() && name.trim()

  const handleSubmit = () => {
    const data: any = {
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      unit: unit || 'unidad',
      minStock: parseInt(minStock) || 0,
      unitCost: parseFloat(unitCost) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
      location: location.trim() || undefined,
    }
    if (mode === 'create') {
      data.stock = parseInt(stock) || 0
      create.mutate(data, { onSuccess: () => onOpenChange(false) })
    } else {
      update.mutate(
        { id: part.id, data },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  const isPending = mode === 'create' ? create.isPending : update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuevo Repuesto' : `Editar ${part?.sku}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Registra un nuevo repuesto o material en el inventario.'
              : 'Modifica la información del repuesto.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              SKU <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 font-mono"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej: RAM-8GB-DDR4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Nombre <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Memoria RAM 8GB DDR4"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Detalles técnicos, marca, compatibilidad…"
            />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="RAM, SSD, Pantalla, Batería…"
              list="part-categories"
            />
            <datalist id="part-categories">
              <option value="RAM" />
              <option value="SSD" />
              <option value="HDD" />
              <option value="Pantalla" />
              <option value="Batería" />
              <option value="Cable" />
              <option value="Fuente" />
              <option value="Otro" />
            </datalist>
          </div>

          <div className="space-y-2">
            <Label>Unidad</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unidad">unidad</SelectItem>
                <SelectItem value="metro">metro</SelectItem>
                <SelectItem value="gramo">gramo</SelectItem>
                <SelectItem value="litro">litro</SelectItem>
                <SelectItem value="caja">caja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stock inicial</Label>
            <Input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min="0"
              disabled={mode === 'edit'}
            />
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground">
                Usa “Ajustar stock” para modificar.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Stock mínimo</Label>
            <Input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Costo unit.</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                className="pl-9"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Precio venta</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                className="pl-9"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Ubicación</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Estante A-3, Cajón 2"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending} className="gap-2">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {mode === 'create' ? 'Crear Repuesto' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============== Adjust Stock Dialog ==============
function AdjustStockDialog({
  part,
  onOpenChange,
}: {
  part: any | null
  onOpenChange: (v: boolean) => void
}) {
  const { update } = usePartMutations()
  const [quantity, setQuantity] = React.useState('')
  const [movementType, setMovementType] = React.useState<string>('in')
  const [reason, setReason] = React.useState('')

  React.useEffect(() => {
    if (part) {
      setQuantity('')
      setReason('')
      // default movement type based on nothing yet — let user enter qty first
      setMovementType('in')
    }
  }, [part])

  // Auto-suggest movement type from sign of quantity
  React.useEffect(() => {
    const n = parseInt(quantity)
    if (!isNaN(n)) {
      if (n > 0) setMovementType('in')
      else if (n < 0) setMovementType('out')
      else setMovementType('adjustment')
    }
  }, [quantity])

  if (!part) return null

  const currentStock = part.stock || 0
  const newStock = currentStock + (parseInt(quantity) || 0)
  const canSubmit = quantity !== '' && parseInt(quantity) !== 0

  const handleSubmit = () => {
    update.mutate(
      {
        id: part.id,
        data: {
          action: 'adjust_stock',
          quantity: parseInt(quantity),
          movementType,
          reason: reason.trim() || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={!!part} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Stock · {part.sku}</DialogTitle>
          <DialogDescription>
            {part.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current stock indicator */}
          <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Stock actual</p>
              <p className="text-2xl font-semibold tabular-nums">{currentStock}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Nuevo stock</p>
              <p
                className={cn(
                  'text-2xl font-semibold tabular-nums',
                  newStock < 0
                    ? 'text-rose-600'
                    : newStock < (part.minStock || 0)
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                )}
              >
                {newStock}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cantidad (±)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const n = parseInt(quantity || '0') - 1
                    setQuantity(String(n))
                  }}
                >
                  <ArrowDown className="size-4 text-rose-500" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="text-center tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const n = parseInt(quantity || '0') + 1
                    setQuantity(String(n))
                  }}
                >
                  <ArrowUp className="size-4 text-emerald-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de movimiento</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MOVEMENT_TYPES) as (keyof typeof MOVEMENT_TYPES)[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {MOVEMENT_TYPES[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Compra, merma, ajuste de inventario, uso en OT…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || update.isPending}
            className="gap-2"
          >
            {update.isPending && <Loader2 className="size-4 animate-spin" />}
            Aplicar Ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
