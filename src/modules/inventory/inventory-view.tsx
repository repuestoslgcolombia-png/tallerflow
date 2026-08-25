'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Package,
  Package2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  AlertTriangle,
  TrendingDown,
  Settings,
  ArrowUp,
  ArrowDown,
  MapPin,
  Shield,
  Zap,
  Gauge,
  Ruler,
  Boxes,
  DollarSign,
  Wallet,
  ShoppingBag,
  Filter,
  Loader2,
  X,
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  Droplet,
  Wrench,
  History,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { ScrollArea } from '@/components/ui/scroll-area'

import { useParts, usePart, usePartMutations } from '@/lib/hooks/api'
import {
  PART_CATEGORIES,
  GAS_TYPES,
  APPLIANCE_BRANDS,
  MOVEMENT_TYPES,
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  pluralizeUnit,
  type PartCategoryKey,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

// ============== ICON MAP ==============
const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  washing_machine: WashingMachine,
  refrigerator: Refrigerator,
  freezer: Snowflake,
  gas_dryer: Flame,
  air_conditioner: Wind,
  tv: Tv,
  refrigeration: Droplet,
  tools: Wrench,
  other: Package,
}

function CategoryIcon({
  category,
  className,
}: {
  category: string
  className?: string
}) {
  const Icon = CATEGORY_ICON_MAP[category] || Package
  return <Icon className={className} />
}

// ============== TIPOS ==============
interface Part {
  id: string
  sku: string
  name: string
  description?: string | null
  category?: string | null
  applianceType?: string | null
  brand?: string | null
  compatibleBrands?: string | null
  model?: string | null
  voltage?: string | null
  powerWatts?: string | null
  gasType?: string | null
  dimensions?: string | null
  warranty?: number | null
  unit: string
  stock: number
  minStock: number
  unitCost: number
  unitPrice: number
  location?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  movements?: any[]
}

interface Movement {
  id: string
  movementType: string
  quantity: number
  reason?: string | null
  createdAt: string
  workOrder?: { code?: string } | null
}

// ============== CONSTANTES LOCALES ==============
const UNITS = ['unidad', 'metro', 'gramo', 'litro', 'rollo'] as const
const REQUIRES_GAS = ['refrigerator', 'freezer', 'air_conditioner', 'refrigeration']

// ============== HELPERS ==============
function getStockColor(stock: number, minStock: number) {
  if (stock <= 0) return 'bg-rose-500'
  if (stock <= minStock) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getStockBadge(stock: number, minStock: number) {
  if (stock <= 0) return { label: 'Sin stock', color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800' }
  if (stock <= minStock) return { label: 'Stock bajo', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' }
  return { label: 'Disponible', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' }
}

function parseCompatibleBrands(value?: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function safeNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// ============== COMPONENTE PRINCIPAL ==============
export function InventoryView() {
  // Filtros
  const [search, setSearch] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [lowStockOnly, setLowStockOnly] = React.useState(false)

  // Diálogos
  const [detailPartId, setDetailPartId] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingPart, setEditingPart] = React.useState<Part | null>(null)
  const [adjustPart, setAdjustPart] = React.useState<Part | null>(null)
  const [deactivatePart, setDeactivatePart] = React.useState<Part | null>(null)

  // Buscar con debounce ligero
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: parts = [], isLoading } = useParts({
    search: debouncedSearch,
    category: categoryFilter,
    lowStock: lowStockOnly,
  })

  const { create, update } = usePartMutations()

  // Conteos por categoría
  const countsByCategory = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of parts as Part[]) {
      const k = p.category || 'other'
      map[k] = (map[k] || 0) + 1
    }
    return map
  }, [parts])

  // Stats
  const stats = React.useMemo(() => {
    const list = parts as Part[]
    const total = list.length
    const low = list.filter((p) => p.stock <= p.minStock).length
    const invValue = list.reduce((s, p) => s + p.stock * p.unitCost, 0)
    const saleValue = list.reduce((s, p) => s + p.stock * p.unitPrice, 0)
    return { total, low, invValue, saleValue }
  }, [parts])

  const handleSubmitCreate = (data: any) => {
    create.mutate(data, {
      onSuccess: () => setCreateOpen(false),
    })
  }

  const handleSubmitEdit = (id: string, data: any) => {
    update.mutate(
      { id, data },
      {
        onSuccess: () => setEditingPart(null),
      }
    )
  }

  const handleAdjust = (id: string, data: any) => {
    update.mutate(
      { id, data: { ...data, action: 'adjust_stock' } },
      {
        onSuccess: () => setAdjustPart(null),
      }
    )
  }

  const handleDeactivate = (id: string) => {
    update.mutate(
      { id, data: { active: false } },
      {
        onSuccess: () => {
          setDeactivatePart(null)
          toast.success('Repuesto desactivado')
        },
      }
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER + STATS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Boxes className="h-6 w-6 text-primary" />
              Inventario de repuestos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión de repuestos para electrodomésticos.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo repuesto
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<Package className="h-5 w-5" />}
            label="Total repuestos"
            value={String(stats.total)}
            color="text-sky-600 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Stock bajo"
            value={String(stats.low)}
            color="text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="Valor inventario"
            value={formatCurrency(stats.invValue)}
            color="text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
            subtitle="Σ stock × costo"
          />
          <StatCard
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Venta potencial"
            value={formatCurrency(stats.saleValue)}
            color="text-teal-600 bg-teal-100 dark:bg-teal-950/40 dark:text-teal-400"
            subtitle="Σ stock × precio"
          />
        </div>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 space-y-4">
          {/* Búsqueda + Stock bajo toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU, nombre, marca o modelo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30">
              <Switch
                id="low-stock-toggle"
                checked={lowStockOnly}
                onCheckedChange={setLowStockOnly}
              />
              <Label htmlFor="low-stock-toggle" className="text-sm cursor-pointer flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                Stock bajo
              </Label>
            </div>
          </div>

          {/* Pills de categoría */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Categoría</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              <CategoryPill
                active={categoryFilter === 'all'}
                onClick={() => setCategoryFilter('all')}
                icon={<Boxes className="h-4 w-4" />}
                label="Todos"
                count={stats.total}
              />
              {(Object.keys(PART_CATEGORIES) as PartCategoryKey[]).map((key) => {
                const cat = PART_CATEGORIES[key]
                return (
                  <CategoryPill
                    key={key}
                    active={categoryFilter === key}
                    onClick={() => setCategoryFilter(key)}
                    icon={<CategoryIcon category={key} className="h-4 w-4" />}
                    label={cat.label}
                    count={countsByCategory[key] || 0}
                    colorClass={cat.color}
                  />
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLA PRINCIPAL */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package2 className="h-5 w-5 text-primary" />
            Repuestos
            <Badge variant="secondary" className="ml-1">
              {(parts as Part[]).length}
            </Badge>
          </CardTitle>
          <CardDescription>
            {categoryFilter !== 'all' && PART_CATEGORIES[categoryFilter as PartCategoryKey]
              ? PART_CATEGORIES[categoryFilter as PartCategoryKey].description
              : 'Lista completa de repuestos con especificaciones técnicas'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (parts as Part[]).length === 0 ? (
            <EmptyState
              onCreate={() => setCreateOpen(true)}
              hasFilters={!!search || categoryFilter !== 'all' || lowStockOnly}
            />
          ) : (
            <>
              {/* MÓVIL: cards compactas */}
              <div className="md:hidden divide-y">
                {(parts as Part[]).map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    onOpen={() => setDetailPartId(part.id)}
                    onAdjust={() => setAdjustPart(part)}
                    onEdit={() => setEditingPart(part)}
                    onDeactivate={() => setDeactivatePart(part)}
                  />
                ))}
              </div>

              {/* DESKTOP: tabla */}
              <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Repuesto</TableHead>
                    <TableHead className="min-w-[140px]">Categoría</TableHead>
                    <TableHead className="min-w-[180px]">Especificaciones</TableHead>
                    <TableHead className="min-w-[120px]">Stock</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Venta</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="min-w-[110px]">Ubicación</TableHead>
                    <TableHead className="min-w-[90px]">Garantía</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(parts as Part[]).map((part) => {
                    const cat = part.category
                      ? PART_CATEGORIES[part.category as PartCategoryKey]
                      : null
                    const stockBadge = getStockBadge(part.stock, part.minStock)
                    const margin = part.unitPrice - part.unitCost
                    const marginPct = part.unitCost > 0 ? (margin / part.unitCost) * 100 : 0
                    return (
                      <TableRow
                        key={part.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setDetailPartId(part.id)}
                      >
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium leading-tight">{part.name}</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                              <span>{part.sku}</span>
                              {part.brand && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span className="font-sans">{part.brand}</span>
                                </>
                              )}
                              {part.model && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span className="font-sans">{part.model}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {cat && part.category ? (
                            <Badge
                              variant="outline"
                              className={cn('gap-1 whitespace-nowrap', cat.color)}
                            >
                              <CategoryIcon category={part.category} className="h-3 w-3" />
                              {cat.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {part.voltage && part.voltage !== 'N/A' && (
                              <Badge variant="outline" className="gap-1 text-xs font-normal">
                                <Zap className="h-3 w-3 text-amber-500" />
                                {part.voltage}
                              </Badge>
                            )}
                            {part.powerWatts && part.powerWatts !== 'N/A' && (
                              <Badge variant="outline" className="gap-1 text-xs font-normal">
                                <Gauge className="h-3 w-3 text-orange-500" />
                                {part.powerWatts}
                              </Badge>
                            )}
                            {part.gasType && part.gasType !== 'N/A' && (
                              <Badge variant="outline" className="gap-1 text-xs font-normal">
                                <Droplet className="h-3 w-3 text-cyan-500" />
                                {part.gasType}
                              </Badge>
                            )}
                            {!part.voltage && !part.powerWatts && !part.gasType && (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full shrink-0',
                                getStockColor(part.stock, part.minStock)
                              )}
                            />
                            <div className="leading-tight">
                              <div className="font-medium">{part.stock}</div>
                              <div className="text-xs text-muted-foreground">{part.unit}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(part.unitCost)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(part.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {margin > 0 ? (
                            <div className="leading-tight">
                              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(margin)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                +{marginPct.toFixed(0)}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {part.location ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[120px]" title={part.location}>{part.location}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {part.warranty ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Shield className="h-3.5 w-3.5 text-emerald-500" />
                              <span>{part.warranty} meses</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setDetailPartId(part.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAdjustPart(part)}>
                                <Settings className="h-4 w-4 mr-2" />
                                Ajustar stock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingPart(part)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeactivatePart(part)}
                                className="text-rose-600 focus:text-rose-700"
                              >
                                <TrendingDown className="h-4 w-4 mr-2" />
                                Desactivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* DETAIL DIALOG */}
      <PartDetailDialog
        partId={detailPartId}
        onClose={() => setDetailPartId(null)}
        onEdit={(part) => {
          setDetailPartId(null)
          setEditingPart(part)
        }}
        onAdjust={(part) => {
          setDetailPartId(null)
          setAdjustPart(part)
        }}
      />

      {/* CREATE DIALOG */}
      <PartFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleSubmitCreate}
        submitting={create.isPending}
      />

      {/* EDIT DIALOG */}
      {editingPart && (
        <PartFormDialog
          key={editingPart.id}
          open={true}
          onOpenChange={(o) => !o && setEditingPart(null)}
          part={editingPart}
          onSubmit={(data) => handleSubmitEdit(editingPart.id, data)}
          submitting={update.isPending}
        />
      )}

      {/* ADJUST STOCK DIALOG */}
      {adjustPart && (
        <AdjustStockDialog
          key={adjustPart.id}
          part={adjustPart}
          open={true}
          onOpenChange={(o) => !o && setAdjustPart(null)}
          onSubmit={(data) => handleAdjust(adjustPart.id, data)}
          submitting={update.isPending}
        />
      )}

      {/* DEACTIVATE CONFIRM */}
      <AlertDialog
        open={!!deactivatePart}
        onOpenChange={(o) => !o && setDeactivatePart(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar repuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatePart && (
                <>
                  El repuesto <strong>{deactivatePart.name}</strong> ({deactivatePart.sku}) será
                  marcado como inactivo. Podrás reactivarlo más adelante.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivatePart && handleDeactivate(deactivatePart.id)}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============== STAT CARD ==============
function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-base min-[400px]:text-lg sm:text-xl font-bold tracking-tight tabular-nums break-all">
              {value}
            </p>
            {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <div className={cn('rounded-md p-1.5 shrink-0', color)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============== CATEGORY PILL ==============
function CategoryPill({
  active,
  onClick,
  icon,
  label,
  count,
  colorClass,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
  colorClass?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-muted border-border text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-[10px] font-semibold',
          active
            ? 'bg-primary-foreground/20 text-primary-foreground'
            : colorClass || 'bg-muted text-muted-foreground'
        )}
      >
        {count}
      </span>
    </button>
  )
}

// ============== EMPTY STATE ==============
function EmptyState({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">
        {hasFilters ? 'No se encontraron repuestos' : 'No hay repuestos'}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {hasFilters
          ? 'Prueba con otros filtros o términos de búsqueda.'
          : 'Comienza registrando tu primer repuesto de electrodoméstico.'}
      </p>
      {!hasFilters && (
        <Button onClick={onCreate} className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo repuesto
        </Button>
      )}
    </div>
  )
}

// ============== PART CARD (MÓVIL) ==============
function PartCard({
  part,
  onOpen,
  onAdjust,
  onEdit,
  onDeactivate,
}: {
  part: Part
  onOpen: () => void
  onAdjust: () => void
  onEdit: () => void
  onDeactivate: () => void
}) {
  const cat = part.category ? PART_CATEGORIES[part.category as PartCategoryKey] : null
  const stockBadge = getStockBadge(part.stock, part.minStock)
  const margin = part.unitPrice - part.unitCost
  const marginPct = part.unitCost > 0 ? (margin / part.unitCost) * 100 : 0

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 active:bg-muted/50 cursor-pointer transition-colors"
      onClick={onOpen}
    >
      {/* Punto de estado de stock */}
      <span
        className={cn(
          'mt-1.5 h-2.5 w-2.5 rounded-full shrink-0',
          getStockColor(part.stock, part.minStock)
        )}
      />

      {/* Contenido */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium leading-tight truncate">{part.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono truncate">
              <span>{part.sku}</span>
              {part.brand && <span className="font-sans">· {part.brand}</span>}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mr-2" aria-label="Acciones">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onOpen}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAdjust}>
                <Settings className="h-4 w-4 mr-2" />
                Ajustar stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDeactivate}
                className="text-rose-600 focus:text-rose-700"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Desactivar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {cat && part.category && (
            <Badge variant="outline" className={cn('gap-1 whitespace-nowrap', cat.color)}>
              <CategoryIcon category={part.category} className="h-3 w-3" />
              {cat.label}
            </Badge>
          )}
          <Badge variant="outline" className={cn('text-xs', stockBadge.color)}>
            {stockBadge.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm pt-0.5">
          <div className="leading-tight min-w-0">
            <span className="text-xs text-muted-foreground">Stock: </span>
            <span className="font-medium">{part.stock}</span>{' '}
            <span className="text-xs text-muted-foreground">{part.unit}</span>
          </div>
          <div className="text-right leading-tight shrink-0">
            <div className="font-medium">{formatCurrency(part.unitPrice)}</div>
            {margin > 0 && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                +{marginPct.toFixed(0)}% margen
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============== PART DETAIL DIALOG ==============
function PartDetailDialog({
  partId,
  onClose,
  onEdit,
  onAdjust,
}: {
  partId: string | null
  onClose: () => void
  onEdit: (part: Part) => void
  onAdjust: (part: Part) => void
}) {
  const { data, isLoading } = usePart(partId)
  const part = data as Part | undefined

  return (
    <Dialog open={!!partId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="grid grid-rows-[auto_minmax(0,1fr)_auto] gap-4 h-[92dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-2xl">
        {isLoading || !part ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <PartDetailContent
            part={part}
            onClose={onClose}
            onEdit={() => onEdit(part)}
            onAdjust={() => onAdjust(part)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PartDetailContent({
  part,
  onClose,
  onEdit,
  onAdjust,
}: {
  part: Part
  onClose: () => void
  onEdit: () => void
  onAdjust: () => void
}) {
  const cat = part.category ? PART_CATEGORIES[part.category as PartCategoryKey] : null
  const stockBadge = getStockBadge(part.stock, part.minStock)
  const margin = part.unitPrice - part.unitCost
  const marginPct = part.unitCost > 0 ? (margin / part.unitCost) * 100 : 0
  const invValue = part.stock * part.unitCost
  const compatibleBrands = parseCompatibleBrands(part.compatibleBrands)
  const movements = (part.movements || []).slice(0, 5) as Movement[]

  const specs: { label: string; value?: string | null; icon: React.ReactNode }[] = [
    { label: 'Marca', value: part.brand, icon: <Package className="h-3.5 w-3.5" /> },
    { label: 'Modelo', value: part.model, icon: <Boxes className="h-3.5 w-3.5" /> },
    { label: 'Voltaje', value: part.voltage, icon: <Zap className="h-3.5 w-3.5" /> },
    { label: 'Potencia', value: part.powerWatts, icon: <Gauge className="h-3.5 w-3.5" /> },
    { label: 'Tipo de gas', value: part.gasType, icon: <Droplet className="h-3.5 w-3.5" /> },
    { label: 'Dimensiones', value: part.dimensions, icon: <Ruler className="h-3.5 w-3.5" /> },
    {
      label: 'Garantía',
      value: part.warranty ? `${part.warranty} meses` : null,
      icon: <Shield className="h-3.5 w-3.5" />,
    },
    { label: 'Ubicación', value: part.location, icon: <MapPin className="h-3.5 w-3.5" /> },
  ]

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-start gap-3 pr-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {cat && part.category && (
                <Badge variant="outline" className={cn('gap-1', cat.color)}>
                  <CategoryIcon category={part.category} className="h-3 w-3" />
                  {cat.label}
                </Badge>
              )}
              <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {part.sku}
              </span>
            </div>
            <div>{part.name}</div>
          </div>
        </DialogTitle>
        {part.description && (
          <DialogDescription className="text-sm leading-relaxed">
            {part.description}
          </DialogDescription>
        )}
      </DialogHeader>

      <ScrollArea className="min-h-0 -mx-6 px-6">
        <div className="space-y-5 pb-2">
          {/* ESPECIFICACIONES TÉCNICAS */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Especificaciones técnicas
            </h4>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-md border bg-muted/30 px-3 py-2 space-y-0.5"
                >
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    {spec.icon}
                    {spec.label}
                  </div>
                  <div className="text-sm font-medium">
                    {spec.value && spec.value !== 'N/A' ? spec.value : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MARCAS COMPATIBLES */}
          {compatibleBrands.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Marcas compatibles</h4>
              <div className="flex flex-wrap gap-1.5">
                {compatibleBrands.map((b) => (
                  <Badge key={b} variant="secondary" className="font-normal">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* STOCK */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Boxes className="h-4 w-4 text-muted-foreground" />
              Inventario
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Stock actual
                </div>
                <div className="text-lg font-bold">
                  {part.stock} <span className="text-xs font-normal text-muted-foreground">{pluralizeUnit(part.unit, part.stock)}</span>
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Stock mínimo
                </div>
                <div className="text-lg font-bold">{part.minStock}</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Estado
                </div>
                <Badge variant="outline" className={cn('mt-0.5', stockBadge.color)}>
                  {stockBadge.label}
                </Badge>
              </div>
              {part.applianceType && (
                <div className="rounded-md border bg-muted/30 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Tipo de equipo
                  </div>
                  <div className="text-sm font-medium">{part.applianceType}</div>
                </div>
              )}
            </div>
          </div>

          {/* PRECIOS */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Precios y margen
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Costo unitario
                </div>
                <div className="text-sm font-medium">{formatCurrency(part.unitCost)}</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Precio de venta
                </div>
                <div className="text-sm font-medium">{formatCurrency(part.unitPrice)}</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Margen
                </div>
                <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(margin)}
                  {marginPct > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (+{marginPct.toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Valor inventario
                </div>
                <div className="text-sm font-medium">{formatCurrency(invValue)}</div>
              </div>
            </div>
          </div>

          {/* MOVIMIENTOS RECIENTES */}
          {movements.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <History className="h-4 w-4 text-muted-foreground" />
                Movimientos recientes
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {movements.map((m) => {
                  const mt = (MOVEMENT_TYPES as any)[m.movementType] || {
                    label: m.movementType,
                    color: 'bg-slate-100 text-slate-700',
                    sign: '=',
                  }
                  const sign = m.movementType === 'in' ? '+' : m.movementType === 'out' ? '−' : '='
                  return (
                    <div
                      key={m.id}
                      className="rounded-md border px-3 py-2 text-sm space-y-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className={cn('text-xs shrink-0', mt.color)}>
                          {mt.label}
                        </Badge>
                        <span className="text-muted-foreground truncate">
                          {m.reason || 'Sin motivo'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'font-mono font-medium',
                            m.movementType === 'in'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : m.movementType === 'out'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {sign}
                          {m.quantity}
                        </span>
                        <div className="flex items-center gap-2 min-w-0">
                          {m.workOrder?.code && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {m.workOrder.code}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {timeAgo(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <DialogFooter className="shrink-0 flex flex-col gap-2 sm:flex-row sm:gap-2">
        <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
          Cerrar
        </Button>
        <Button variant="outline" className="w-full sm:w-auto" onClick={onAdjust}>
          <Settings className="h-4 w-4 mr-2" />
          Ajustar stock
        </Button>
        <Button className="w-full sm:w-auto" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogFooter>
    </>
  )
}

// ============== PART FORM DIALOG (CREATE/EDIT) ==============
interface FormState {
  sku: string
  name: string
  description: string
  category: string
  applianceType: string
  brand: string
  compatibleBrandsText: string
  model: string
  voltage: string
  powerWatts: string
  gasType: string
  dimensions: string
  warranty: string
  unit: string
  stock: string
  minStock: string
  unitCost: string
  unitPrice: string
  location: string
}

const emptyForm: FormState = {
  sku: '',
  name: '',
  description: '',
  category: 'other',
  applianceType: '',
  brand: '',
  compatibleBrandsText: '',
  model: '',
  voltage: '',
  powerWatts: '',
  gasType: '',
  dimensions: '',
  warranty: '',
  unit: 'unidad',
  stock: '0',
  minStock: '0',
  unitCost: '0',
  unitPrice: '0',
  location: '',
}

function partToForm(part: Part): FormState {
  return {
    sku: part.sku || '',
    name: part.name || '',
    description: part.description || '',
    category: part.category || 'other',
    applianceType: part.applianceType || '',
    brand: part.brand || '',
    compatibleBrandsText: parseCompatibleBrands(part.compatibleBrands).join(', '),
    model: part.model || '',
    voltage: part.voltage || '',
    powerWatts: part.powerWatts || '',
    gasType: part.gasType || '',
    dimensions: part.dimensions || '',
    warranty: part.warranty != null ? String(part.warranty) : '',
    unit: part.unit || 'unidad',
    stock: String(part.stock ?? 0),
    minStock: String(part.minStock ?? 0),
    unitCost: String(part.unitCost ?? 0),
    unitPrice: String(part.unitPrice ?? 0),
    location: part.location || '',
  }
}

function PartFormDialog({
  open,
  onOpenChange,
  part,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  part?: Part
  onSubmit: (data: any) => void
  submitting: boolean
}) {
  const isEdit = !!part
  const [form, setForm] = React.useState<FormState>(() =>
    part ? partToForm(part) : emptyForm
  )

  const requiresGas = React.useMemo(
    () => REQUIRES_GAS.includes(form.category),
    [form.category]
  )

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error('El SKU y el nombre son obligatorios')
      return
    }

    // Compatible brands → array → JSON string
    const compatibleBrandsArray = form.compatibleBrandsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload: any = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category || null,
      applianceType: form.applianceType.trim() || null,
      brand: form.brand || null,
      compatibleBrands: JSON.stringify(compatibleBrandsArray),
      model: form.model.trim() || null,
      voltage: form.voltage.trim() || null,
      powerWatts: form.powerWatts.trim() || null,
      gasType: requiresGas && form.gasType ? form.gasType : null,
      dimensions: form.dimensions.trim() || null,
      warranty: form.warranty !== '' ? safeNumber(form.warranty) : null,
      unit: form.unit,
      minStock: safeNumber(form.minStock),
      unitCost: safeNumber(form.unitCost),
      unitPrice: safeNumber(form.unitPrice),
      location: form.location.trim() || null,
    }

    if (!isEdit) {
      payload.stock = safeNumber(form.stock)
    }

    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid grid-rows-[auto_minmax(0,1fr)_auto] gap-4 h-[92dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEdit ? 'Editar repuesto' : 'Nuevo repuesto'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza los datos del repuesto. Los campos marcados con * son obligatorios.'
              : 'Registra un nuevo repuesto de electrodoméstico. Los campos marcados con * son obligatorios.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="min-h-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            <div className="space-y-5 pb-2">
              {/* INFORMACIÓN BÁSICA */}
              <FormSection title="Información básica" icon={<Package className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="SKU" required>
                    <Input
                      value={form.sku}
                      onChange={(e) => update('sku', e.target.value)}
                      placeholder="Ej: LAV-MOT-001"
                      className="font-mono"
                      required
                    />
                  </Field>
                  <Field label="Nombre" required className="sm:col-span-2">
                    <Input
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Ej: Motor lavadora 1/2 HP"
                      required
                    />
                  </Field>
                </div>
                <Field label="Descripción">
                  <Textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Detalle del repuesto, aplicación, notas técnicas…"
                    rows={2}
                  />
                </Field>
                <Field label="Categoría">
                  <Select value={form.category} onValueChange={(v) => update('category', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PART_CATEGORIES) as PartCategoryKey[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <CategoryIcon category={key} className="h-4 w-4" />
                            {PART_CATEGORIES[key].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FormSection>

              {/* COMPATIBILIDAD */}
              <FormSection title="Compatibilidad" icon={<Boxes className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Marca">
                    <Select value={form.brand} onValueChange={(v) => update('brand', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLIANCE_BRANDS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Modelo">
                    <Input
                      value={form.model}
                      onChange={(e) => update('model', e.target.value)}
                      placeholder="Ej: WT7001 o Universal"
                    />
                  </Field>
                </div>
                <Field
                  label="Marcas compatibles"
                  hint="Separadas por coma. Ej: LG, Samsung, Whirlpool"
                >
                  <Input
                    value={form.compatibleBrandsText}
                    onChange={(e) => update('compatibleBrandsText', e.target.value)}
                    placeholder="LG, Samsung, Whirlpool"
                  />
                </Field>
                <Field label="Tipo de electrodoméstico">
                  <Input
                    value={form.applianceType}
                    onChange={(e) => update('applianceType', e.target.value)}
                    placeholder="Ej: Lavadora, Nevera, Aire acondicionado"
                  />
                </Field>
              </FormSection>

              {/* ESPECIFICACIONES TÉCNICAS */}
              <FormSection title="Especificaciones técnicas" icon={<Settings className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Voltaje">
                    <Input
                      value={form.voltage}
                      onChange={(e) => update('voltage', e.target.value)}
                      placeholder="Ej: 110V, 220V, N/A"
                    />
                  </Field>
                  <Field label="Potencia">
                    <Input
                      value={form.powerWatts}
                      onChange={(e) => update('powerWatts', e.target.value)}
                      placeholder="Ej: 1500W"
                    />
                  </Field>
                  {requiresGas && (
                    <Field label="Tipo de gas">
                      <Select value={form.gasType || 'N/A'} onValueChange={(v) => update('gasType', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de gas" />
                        </SelectTrigger>
                        <SelectContent>
                          {GAS_TYPES.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                  <Field label="Dimensiones">
                    <Input
                      value={form.dimensions}
                      onChange={(e) => update('dimensions', e.target.value)}
                      placeholder="Ej: 30x15x10 cm"
                    />
                  </Field>
                  <Field label="Garantía (meses)">
                    <Input
                      type="number"
                      min={0}
                      value={form.warranty}
                      onChange={(e) => update('warranty', e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </FormSection>

              {/* INVENTARIO */}
              <FormSection title="Inventario y precios" icon={<Wallet className="h-4 w-4" />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {!isEdit && (
                    <Field label="Stock inicial">
                      <Input
                        type="number"
                        min={0}
                        value={form.stock}
                        onChange={(e) => update('stock', e.target.value)}
                      />
                    </Field>
                  )}
                  <Field label="Stock mínimo">
                    <Input
                      type="number"
                      min={0}
                      value={form.minStock}
                      onChange={(e) => update('minStock', e.target.value)}
                    />
                  </Field>
                  <Field label="Unidad">
                    <Select value={form.unit} onValueChange={(v) => update('unit', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Costo unitario">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.unitCost}
                      onChange={(e) => update('unitCost', e.target.value)}
                    />
                  </Field>
                  <Field label="Precio de venta">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={form.unitPrice}
                      onChange={(e) => update('unitPrice', e.target.value)}
                    />
                  </Field>
                  <Field label="Ubicación" className="col-span-2 sm:col-span-1">
                    <Input
                      value={form.location}
                      onChange={(e) => update('location', e.target.value)}
                      placeholder="Ej: Estante A-3"
                    />
                  </Field>
                </div>
                {/* Preview margen */}
                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Margen por unidad:</span>
                  {(() => {
                    const cost = safeNumber(form.unitCost)
                    const price = safeNumber(form.unitPrice)
                    const margin = price - cost
                    const pct = cost > 0 ? (margin / cost) * 100 : 0
                    return (
                      <span
                        className={cn(
                          'font-medium',
                          margin > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : margin < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-muted-foreground'
                        )}
                      >
                        {formatCurrency(margin)}
                        {cost > 0 && ` (+${pct.toFixed(0)}%)`}
                      </span>
                    )
                  })()}
                </div>
              </FormSection>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 shrink-0 border-t pt-4">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear repuesto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== ADJUST STOCK DIALOG ==============
function AdjustStockDialog({
  part,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  part: Part
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  submitting: boolean
}) {
  const [quantity, setQuantity] = React.useState<string>('0')
  const [movementType, setMovementType] = React.useState<string>('adjustment')
  const [reason, setReason] = React.useState<string>('')

  const qty = safeNumber(quantity)
  const newStock = Math.max(0, part.stock + qty)

  // Auto-sugerir tipo de movimiento según signo. qty se deriva de quantity.
  React.useEffect(() => {
    if (qty > 0) setMovementType('in')
    else if (qty < 0) setMovementType('out')
    else setMovementType('adjustment')
  }, [quantity])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (qty === 0) {
      toast.error('La cantidad a ajustar no puede ser 0')
      return
    }
    if (qty < 0 && Math.abs(qty) > part.stock) {
      toast.error(`Stock insuficiente. Stock actual: ${part.stock}`)
      return
    }
    onSubmit({
      quantity: qty,
      movementType,
      reason: reason.trim() || 'Ajuste manual',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ajustar stock
          </DialogTitle>
          <DialogDescription>
            Ajusta el inventario de <strong>{part.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stock actual */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Stock actual
              </div>
              <div className="text-xl font-bold">
                {part.stock}{' '}
                <span className="text-xs font-normal text-muted-foreground">{pluralizeUnit(part.unit, part.stock)}</span>
              </div>
            </div>
            <div
              className={cn(
                'rounded-md border px-3 py-2',
                newStock < part.stock
                  ? 'border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800'
                  : newStock > part.stock
                    ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800'
                    : 'bg-muted/30'
              )}
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Nuevo stock
              </div>
              <div className="text-xl font-bold">{newStock}</div>
            </div>
          </div>

          {/* Cantidad */}
          <Field label="Cantidad a ajustar" hint="Usa signo negativo para restar stock">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(String(safeNumber(quantity, 0) - 1))}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-center font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(String(safeNumber(quantity, 0) + 1))}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </Field>

          {/* Tipo de movimiento */}
          <Field label="Tipo de movimiento">
            <Select value={movementType} onValueChange={setMovementType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MOVEMENT_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label} ({v.sign})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Motivo */}
          <Field label="Motivo">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Compra a proveedor, merma, ajuste de inventario…"
              rows={2}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || qty === 0}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aplicar ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== FORM HELPERS ==============
function FormSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <Separator className="flex-1" />
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
