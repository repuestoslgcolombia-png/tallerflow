'use client'

import * as React from 'react'
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
  Star,
  X,
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GuideStatusBadge, GuideDifficultyBadge } from '@/components/tallerflow/badges'
import {
  GuideIcon,
  RepairGuideDialog,
  type RepairGuide,
} from '@/components/tallerflow/repair-guide-detail'
import { GuideFormDialog } from '@/components/tallerflow/repair-guide-form'

import { useRepairGuides, useRepairGuideMutations } from '@/lib/hooks/api'
import {
  DEVICE_TYPES,
  REPAIR_GUIDE_STATUS,
  type DeviceTypeKey,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

// ============== COMPONENTE PRINCIPAL ==============
export function GuidesView() {
  const { navigate } = useAppStore()
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

  const [detailGuide, setDetailGuide] = React.useState<RepairGuide | null>(null)
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
            color="text-sky-700 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400"
          />
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="Borradores"
            value={String(stats.drafts)}
            color="text-sky-700 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Usos"
            value={String(stats.usages)}
            color="text-sky-700 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400"
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
                    <TableHead className="min-w-[100px]">Versión · Usos</TableHead>
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
                        onClick={() => setDetailGuide(guide)}
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
                              {guide.sourceWorkOrder?.code && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate('work-order-detail', { workOrderId: guide.sourceWorkOrder?.id })
                                    }}
                                    className="inline-flex items-center gap-0.5 text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {guide.sourceWorkOrder.code}
                                  </button>
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
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {guide.estimatedHours > 0 && (
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Clock className="h-3 w-3" />
                                {guide.estimatedHours}h
                              </span>
                            )}
                            <Badge variant="secondary" className="gap-1 font-mono">
                              <History className="h-3 w-3" />
                              v{guide.version}
                            </Badge>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Star className="h-3 w-3" />
                              {guide.usageCount}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
<DropdownMenuItem onClick={() => setDetailGuide(guide)}>
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
        guide={detailGuide}
        onClose={() => setDetailGuide(null)}
        onEdit={(g) => {
          setDetailGuide(null)
          setEditingGuide(g)
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
  guide,
  onClose,
  onEdit,
}: {
  guide: RepairGuide | null
  onClose: () => void
  onEdit: (guide: RepairGuide) => void
}) {
  const { update } = useRepairGuideMutations()
  const open = !!guide

  // Incrementar uso al abrir el detalle (tabla de la base de conocimiento)
  React.useEffect(() => {
    if (guide) update.mutate({ id: guide.id, data: { action: 'increment_usage' } })
  }, [guide?.id])

  return (
    <RepairGuideDialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      guide={guide}
      maxWidth="2xl"
      onEdit={guide ? () => onEdit(guide) : undefined}
    />
  )
}
