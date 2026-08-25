'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  BookOpen,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  CheckCircle2,
  FileText,
  Clock,
  ListChecks,
  Star,
  Tag,
  Loader2,
  X,
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  Microwave,
  CookingPot,
  Thermometer,
  Wrench,
  Layers,
  User,
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
import { GuideStatusBadge, GuideDifficultyBadge } from '@/components/tallerflow/badges'

import { useRepairGuides, useRepairGuide, useRepairGuideMutations } from '@/lib/hooks/api'
import {
  DEVICE_TYPES,
  APPLIANCE_BRANDS,
  REPAIR_GUIDE_STATUS,
  formatDate,
  timeAgo,
  type DeviceTypeKey,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

// ============== ICON MAP ==============
const GUIDE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  washing_machine: WashingMachine,
  refrigerator: Refrigerator,
  freezer: Snowflake,
  gas_dryer: Flame,
  air_conditioner: Wind,
  tv: Tv,
  microwave: Microwave,
  oven: CookingPot,
  stove: CookingPot,
  water_heater: Thermometer,
  other: Wrench,
}

function GuideIcon({
  applianceType,
  className,
}: {
  applianceType: string
  className?: string
}) {
  const Icon = GUIDE_ICON_MAP[applianceType] || Wrench
  return <Icon className={className} />
}

// ============== TIPOS ==============
interface RepairGuide {
  id: string
  title: string
  summary?: string | null
  applianceType: string
  brand?: string | null
  model?: string | null
  symptoms?: string | null
  steps: string
  difficulty: string
  estimatedHours: number
  partsUsed?: string | null
  status: string
  version: number
  usageCount: number
  author?: { id: string; name: string } | null
  sourceWorkOrder?: { id: string; code: string } | null
  createdAt: string
  updatedAt: string
}

function parseJsonArray(value?: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function parsePartsUsed(value?: string | null): { partId?: string | null; name: string; qty: number }[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
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
export function GuidesView() {
  // Filtros
  const [search, setSearch] = React.useState('')
  const [applianceFilter, setApplianceFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: guides = [], isLoading } = useRepairGuides({
    search: debouncedSearch,
    applianceType: applianceFilter,
    status: statusFilter,
  })

  const { create, update, remove } = useRepairGuideMutations()

  const [detailGuideId, setDetailGuideId] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingGuide, setEditingGuide] = React.useState<RepairGuide | null>(null)
  const [archiveGuide, setArchiveGuide] = React.useState<RepairGuide | null>(null)

  const stats = React.useMemo(() => {
    const list = guides as RepairGuide[]
    const total = list.length
    const active = list.filter((g) => g.status === 'active').length
    const drafts = list.filter((g) => g.status === 'draft').length
    const usages = list.reduce((s, g) => s + g.usageCount, 0)
    return { total, active, drafts, usages }
  }, [guides])

  const handlePublish = (g: RepairGuide) => {
    update.mutate({ id: g.id, data: { action: 'publish' } })
  }

  const handleArchive = (g: RepairGuide) => {
    remove.mutate(g.id, { onSuccess: () => setArchiveGuide(null) })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER + STATS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Base de conocimiento
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Guías de reparación reutilizables para el taller.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nueva guía
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label="Guías"
            value={String(stats.total)}
            color="text-sky-600 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Activas"
            value={String(stats.active)}
            color="text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
          />
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="Borradores"
            value={String(stats.drafts)}
            color="text-amber-600 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Usos"
            value={String(stats.usages)}
            color="text-violet-600 bg-violet-100 dark:bg-violet-950/40 dark:text-violet-400"
          />
        </div>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, síntoma, marca, modelo o paso…"
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(REPAIR_GUIDE_STATUS).map(([key, conf]) => (
                  <SelectItem key={key} value={key}>
                    {conf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pills de tipo de equipo */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              <span>Tipo de equipo</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
              <GuidePill
                active={applianceFilter === 'all'}
                onClick={() => setApplianceFilter('all')}
                icon={<Wrench className="h-4 w-4" />}
                label="Todos"
              />
              {(Object.keys(DEVICE_TYPES) as DeviceTypeKey[]).map((key) => (
                <GuidePill
                  key={key}
                  active={applianceFilter === key}
                  onClick={() => setApplianceFilter(key)}
                  icon={<GuideIcon applianceType={key} className="h-4 w-4" />}
                  label={DEVICE_TYPES[key].label}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLA PRINCIPAL */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Guías de reparación
            <Badge variant="secondary" className="ml-1">
              {(guides as RepairGuide[]).length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Procedimientos documentados para acelerar reparaciones recurrentes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (guides as RepairGuide[]).length === 0 ? (
            <EmptyState
              onCreate={() => setCreateOpen(true)}
              hasFilters={!!search || applianceFilter !== 'all' || statusFilter !== 'all'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">Guía</TableHead>
                    <TableHead className="min-w-[140px]">Equipo</TableHead>
                    <TableHead className="min-w-[110px]">Estado</TableHead>
                    <TableHead className="min-w-[100px]">Dificultad</TableHead>
                    <TableHead className="min-w-[110px]">Horas</TableHead>
                    <TableHead className="min-w-[90px]">Versión</TableHead>
                    <TableHead className="min-w-[80px]">Usos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(guides as RepairGuide[]).map((guide) => {
                    const dt = DEVICE_TYPES[guide.applianceType as DeviceTypeKey]
                    return (
                      <TableRow
                        key={guide.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setDetailGuideId(guide.id)}
                      >
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium leading-tight">{guide.title}</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {guide.brand && (
                                <>
                                  <span>{guide.brand}</span>
                                  {guide.model && (
                                    <>
                                      <span className="text-muted-foreground/40">·</span>
                                      <span>{guide.model}</span>
                                    </>
                                  )}
                                </>
                              )}
                              {guide.author?.name && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {guide.author.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dt ? (
                            <Badge variant="outline" className="gap-1 whitespace-nowrap">
                              <GuideIcon applianceType={guide.applianceType} className="h-3 w-3" />
                              {dt.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <GuideStatusBadge status={guide.status} />
                        </TableCell>
                        <TableCell>
                          <GuideDifficultyBadge difficulty={guide.difficulty} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{guide.estimatedHours ? `${guide.estimatedHours} h` : '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1 font-mono">
                            <History className="h-3 w-3" />
                            v{guide.version}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{guide.usageCount}</span>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => setDetailGuideId(guide.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingGuide(guide)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {guide.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handlePublish(guide)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Publicar
                                </DropdownMenuItem>
                              )}
                              {guide.status !== 'retired' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setArchiveGuide(guide)}
                                    className="text-rose-600 focus:text-rose-700"
                                  >
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archivar
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

      {/* DETAIL DIALOG */}
      <GuideDetailDialog
        guideId={detailGuideId}
        onClose={() => setDetailGuideId(null)}
        onEdit={(guide) => {
          setDetailGuideId(null)
          setEditingGuide(guide)
        }}
      />

      {/* CREATE DIALOG */}
      <GuideFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(data) => create.mutate(data, { onSuccess: () => setCreateOpen(false) })}
        submitting={create.isPending}
      />

      {/* EDIT DIALOG */}
      {editingGuide && (
        <GuideFormDialog
          key={editingGuide.id}
          open={true}
          onOpenChange={(o) => !o && setEditingGuide(null)}
          guide={editingGuide}
          onSubmit={(data) => update.mutate(
            { id: editingGuide.id, data },
            { onSuccess: () => setEditingGuide(null) }
          )}
          submitting={update.isPending}
        />
      )}

      {/* ARCHIVE CONFIRM */}
      <AlertDialog open={!!archiveGuide} onOpenChange={(o) => !o && setArchiveGuide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar guía?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveGuide && (
                <>
                  La guía <strong>{archiveGuide.title}</strong> dejará de aparecer en las
                  sugerencias de órdenes de trabajo. Podrás reactivarla luego desde la opción
                  "Publicar".
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveGuide && handleArchive(archiveGuide)}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
            >
              Archivar
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
            <p className="text-lg sm:text-xl font-bold tracking-tight truncate">{value}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <div className={cn('rounded-md p-1.5 shrink-0', color)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============== GUIDE PILL ==============
function GuidePill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
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
    </button>
  )
}

// ============== EMPTY STATE ==============
function EmptyState({ onCreate, hasFilters }: { onCreate: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">
        {hasFilters ? 'No se encontraron guías' : 'No hay guías'}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {hasFilters
          ? 'Prueba con otros filtros o términos de búsqueda.'
          : 'Documenta tu primera reparación para acelerar las futuras.'}
      </p>
      {!hasFilters && (
        <Button onClick={onCreate} className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Nueva guía
        </Button>
      )}
    </div>
  )
}

// ============== GUIDE DETAIL DIALOG ==============
function GuideDetailDialog({
  guideId,
  onClose,
  onEdit,
}: {
  guideId: string | null
  onClose: () => void
  onEdit: (guide: RepairGuide) => void
}) {
  const { data, isLoading } = useRepairGuide(guideId)
  const guide = data as RepairGuide | undefined

  return (
    <Dialog open={!!guideId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {isLoading || !guide ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <GuideDetailContent guide={guide} onClose={onClose} onEdit={() => onEdit(guide)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function GuideDetailContent({
  guide,
  onClose,
  onEdit,
}: {
  guide: RepairGuide
  onClose: () => void
  onEdit: () => void
}) {
  const dt = DEVICE_TYPES[guide.applianceType as DeviceTypeKey]
  const symptoms = parseJsonArray(guide.symptoms)
  const parts = parsePartsUsed(guide.partsUsed)
  const steps = guide.steps.split('\n').map((s) => s.trim()).filter(Boolean)

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-start gap-3 pr-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {dt && (
                <Badge variant="outline" className="gap-1">
                  <GuideIcon applianceType={guide.applianceType} className="h-3 w-3" />
                  {dt.label}
                </Badge>
              )}
              <GuideStatusBadge status={guide.status} />
              <GuideDifficultyBadge difficulty={guide.difficulty} />
              <Badge variant="secondary" className="font-mono">v{guide.version}</Badge>
            </div>
            <div>{guide.title}</div>
          </div>
        </DialogTitle>
        {guide.summary && (
          <DialogDescription className="text-sm leading-relaxed">
            {guide.summary}
          </DialogDescription>
        )}
      </DialogHeader>

      <ScrollArea className="flex-1 -mx-6 px-6 max-h-[60vh]">
        <div className="space-y-5 pb-2">
          {/* META */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Información
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Marca</div>
                <div className="text-sm font-medium">{guide.brand || '—'}</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Modelo</div>
                <div className="text-sm font-medium">{guide.model || '—'}</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Horas</div>
                <div className="text-sm font-medium flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {guide.estimatedHours ? `${guide.estimatedHours} h` : '—'}
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Usos</div>
                <div className="text-sm font-medium flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-violet-500" />
                  {guide.usageCount}
                </div>
              </div>
            </div>
          </div>

          {/* SÍNTOMAS */}
          {symptoms.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                Síntomas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {symptoms.map((s) => (
                  <Badge key={s} variant="secondary" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* PROCEDIMIENTO */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              Procedimiento
            </h4>
            {steps.length > 0 ? (
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed">
                    <span className="shrink-0 mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{guide.steps}</p>
            )}
          </div>

          {/* REPUESTOS */}
          {parts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                Repuestos utilizados
              </h4>
              <div className="space-y-1.5">
                {parts.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm"
                  >
                    <span className="min-w-0 truncate">{p.name}</span>
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      ×{p.qty}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORIGEN */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {guide.author?.name && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Autor: {guide.author.name}
              </span>
            )}
            {guide.sourceWorkOrder?.code && (
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Origen: {guide.sourceWorkOrder.code}
              </span>
            )}
            <span>Creada {formatDate(guide.createdAt)}</span>
            <span>Actualizada {timeAgo(guide.updatedAt)}</span>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        <Button onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogFooter>
    </>
  )
}

// ============== GUIDE FORM DIALOG (CREATE/EDIT) ==============
interface GuideFormState {
  title: string
  summary: string
  applianceType: string
  brand: string
  model: string
  symptomsText: string
  steps: string
  difficulty: string
  estimatedHours: string
  partsText: string
  status: string
}

const emptyGuideForm: GuideFormState = {
  title: '',
  summary: '',
  applianceType: 'washing_machine',
  brand: '',
  model: '',
  symptomsText: '',
  steps: '',
  difficulty: 'media',
  estimatedHours: '1',
  partsText: '',
  status: 'draft',
}

function guideToForm(guide: RepairGuide): GuideFormState {
  return {
    title: guide.title || '',
    summary: guide.summary || '',
    applianceType: guide.applianceType || 'washing_machine',
    brand: guide.brand || '',
    model: guide.model || '',
    symptomsText: parseJsonArray(guide.symptoms).join(', '),
    steps: guide.steps || '',
    difficulty: guide.difficulty || 'media',
    estimatedHours: guide.estimatedHours != null ? String(guide.estimatedHours) : '1',
    partsText: parsePartsUsed(guide.partsUsed)
      .map((p) => (p.qty && p.qty !== 1 ? `${p.name} (x${p.qty})` : p.name))
      .join(', '),
    status: guide.status || 'draft',
  }
}

function GuideFormDialog({
  open,
  onOpenChange,
  guide,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  guide?: RepairGuide
  onSubmit: (data: any) => void
  submitting: boolean
}) {
  const isEdit = !!guide
  const [form, setForm] = React.useState<GuideFormState>(() =>
    guide ? guideToForm(guide) : emptyGuideForm
  )

  React.useEffect(() => {
    if (open) setForm(guide ? guideToForm(guide) : emptyGuideForm)
  }, [open, guide])

  const update = <K extends keyof GuideFormState>(key: K, value: GuideFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.steps.trim()) {
      toast.error('El título y el procedimiento son obligatorios')
      return
    }

    const symptomsArray = form.symptomsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const partsArray = form.partsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const m = s.match(/^(.*?)\s*\(x(\d+)\)$/)
        if (m) return { name: m[1].trim(), qty: parseInt(m[2], 10) || 1 }
        return { name: s, qty: 1 }
      })

    const payload: any = {
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      applianceType: form.applianceType,
      brand: form.brand || null,
      model: form.model.trim() || null,
      symptoms: symptomsArray,
      steps: form.steps.trim(),
      difficulty: form.difficulty,
      estimatedHours: safeNumber(form.estimatedHours),
      partsUsed: partsArray,
    }

    if (!isEdit) payload.status = form.status

    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEdit ? 'Editar guía' : 'Nueva guía de reparación'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza el procedimiento. Si la guía está activa, se generará una nueva versión.'
              : 'Documenta un procedimiento reutilizable. Los campos marcados con * son obligatorios.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 -mx-6 px-6 max-h-[65vh]">
            <div className="space-y-5 pb-2">
              {/* INFORMACIÓN BÁSICA */}
              <FormSection title="Información básica" icon={<BookOpen className="h-4 w-4" />}>
                <Field label="Título" required>
                  <Input
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="Ej: Cambio de rodamientos en lavadora"
                    required
                  />
                </Field>
                <Field label="Resumen">
                  <Textarea
                    value={form.summary}
                    onChange={(e) => update('summary', e.target.value)}
                    placeholder="Resumen breve de cuándo aplicar esta guía…"
                    rows={2}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Tipo de equipo" required>
                    <Select value={form.applianceType} onValueChange={(v) => update('applianceType', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(DEVICE_TYPES) as DeviceTypeKey[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <GuideIcon applianceType={key} className="h-4 w-4" />
                              {DEVICE_TYPES[key].label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Marca">
                    <Select value={form.brand} onValueChange={(v) => update('brand', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una marca" />
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
              </FormSection>

              {/* SÍNTOMAS */}
              <FormSection title="Síntomas" icon={<Search className="h-4 w-4" />}>
                <Field
                  label="Síntomas frecuentes"
                  hint="Separados por coma. Se usan para sugerir esta guía. Ej: no desagua, hace ruido, no enciende"
                >
                  <Input
                    value={form.symptomsText}
                    onChange={(e) => update('symptomsText', e.target.value)}
                    placeholder="no desagua, hace ruido, no enciende"
                  />
                </Field>
              </FormSection>

              {/* PROCEDIMIENTO */}
              <FormSection title="Procedimiento" icon={<ListChecks className="h-4 w-4" />}>
                <Field
                  label="Pasos"
                  required
                  hint="Uno por línea. Ej:\n1. Desconectar la lavadora.\n2. Retirar la tapa trasera."
                >
                  <Textarea
                    value={form.steps}
                    onChange={(e) => update('steps', e.target.value)}
                    placeholder={'1. Desconectar el equipo.\n2. Retirar la tapa.\n3. Inspeccionar la pieza.'}
                    rows={7}
                    required
                  />
                </Field>
              </FormSection>

              {/* DETALLES */}
              <FormSection title="Detalles" icon={<Clock className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Dificultad">
                    <Select value={form.difficulty} onValueChange={(v) => update('difficulty', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="compleja">Compleja</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Horas estimadas">
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={form.estimatedHours}
                      onChange={(e) => update('estimatedHours', e.target.value)}
                      placeholder="1"
                    />
                  </Field>
                  <Field label="Estado">
                    <Select value={form.status} onValueChange={(v) => update('status', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="active">Activa</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field
                  label="Repuestos utilizados"
                  hint="Separados por coma. Cantidad opcional: Condensador (x2)"
                >
                  <Input
                    value={form.partsText}
                    onChange={(e) => update('partsText', e.target.value)}
                    placeholder="Rodamiento 6205, Condensador 40µF (x2)"
                  />
                </Field>
              </FormSection>
            </div>
          </ScrollArea>

          <Separator className="my-2" />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear guía'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== FORM SECTION ==============
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
      <h4 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {title}
      </h4>
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
      <Label>
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
    </div>
  )
}
