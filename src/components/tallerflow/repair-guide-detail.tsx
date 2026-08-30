'use client'

import {
  BookOpen,
  Clock,
  FileText,
  ListChecks,
  Pencil,
  Search,
  Star,
  Tag,
  User,
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
  Sparkles,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GuideStatusBadge, GuideDifficultyBadge } from '@/components/tallerflow/badges'
import { DEVICE_TYPES, formatDate, timeAgo } from '@/lib/constants'
import { cn } from '@/lib/utils'

// ============== HELPERS COMPARTIDOS ==============

export function parseJsonArray(value?: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

export function parsePartsUsed(value?: string | null): { partId?: string | null; name: string; qty: number }[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function formatPartsInput(parts: { partId?: string | null; name: string; qty: number }[]): string {
  return parts.map((p) => (p.qty && p.qty !== 1 ? `${p.name} (x${p.qty})` : p.name)).join(', ')
}

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

export function GuideIcon({
  applianceType,
  className,
}: {
  applianceType: string
  className?: string
}) {
  const Icon = GUIDE_ICON_MAP[applianceType] || Wrench
  return <Icon className={className} />
}

// ============== TIPO ==============
export interface RepairGuide {
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
  score?: number
  match?: { brand?: boolean; model?: boolean; symptom?: boolean }
}

function MatchBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
      <Sparkles className="size-3" />
      {children}
    </span>
  )
}

// ============== CONTENIDO DEL VISOR ==============
export function RepairGuideDetailContent({
  guide,
  onEdit,
}: {
  guide: RepairGuide
  onEdit?: () => void
}) {
  const dt = DEVICE_TYPES[guide.applianceType as keyof typeof DEVICE_TYPES]
  const symptoms = parseJsonArray(guide.symptoms)
  const parts = parsePartsUsed(guide.partsUsed)
  const steps = guide.steps.split('\n').map((s) => s.trim()).filter(Boolean)

  return (
    <>
      <div className="space-y-5 pb-2">
        {/* Match de relevancia */}
        {guide.score !== undefined && (
          <div className="flex items-center gap-1.5 rounded-md border bg-primary/5 px-3 py-2">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">Relevancia</span>
            {guide.match?.brand && <MatchBadge>Marca</MatchBadge>}
            {guide.match?.model && <MatchBadge>Modelo</MatchBadge>}
            {guide.match?.symptom && <MatchBadge>Síntoma</MatchBadge>}
          </div>
        )}

        {/* META */}
        <div>
          <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
            <Tag className="size-4 text-muted-foreground" />
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
                <Clock className="size-3.5 text-muted-foreground" />
                {guide.estimatedHours ? `${guide.estimatedHours} h` : '—'}
              </div>
            </div>
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Usos</div>
              <div className="text-sm font-medium flex items-center gap-1">
                <Star className="size-3.5 text-violet-500" />
                {guide.usageCount}
              </div>
            </div>
          </div>
        </div>

        {/* SÍNTOMAS */}
        {symptoms.length > 0 && (
          <div>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
              <Search className="size-4 text-muted-foreground" />
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
          <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
            <ListChecks className="size-4 text-muted-foreground" />
            Procedimiento
          </h4>
          {steps.length > 0 ? (
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
              {guide.steps}
            </div>
          )}
        </div>

        {/* REPUESTOS */}
        {parts.length > 0 && (
          <div>
            <h4 className="flex items-center gap-1.5 mb-2 text-sm font-semibold">
              <Wrench className="size-4 text-muted-foreground" />
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
              <User className="size-3.5" />
              Autor: {guide.author.name}
            </span>
          )}
          {guide.sourceWorkOrder?.code && (
            <span className="flex items-center gap-1">
              <FileText className="size-3.5" />
              Origen: {guide.sourceWorkOrder.code}
            </span>
          )}
          <span>Creada {formatDate(guide.createdAt)}</span>
          <span>Actualizada {timeAgo(guide.updatedAt)}</span>
        </div>
      </div>
    </>
  )
}

// ============== VISOR COMPARTIDO (HEADER + SCROLL + FOOTER) ==============
export function RepairGuideDialog({
  open,
  onOpenChange,
  guide,
  onEdit,
  maxWidth = 'xl',
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  guide: RepairGuide | null | undefined
  onEdit?: () => void
  maxWidth?: 'xl' | '2xl'
}) {
  if (!guide) return null
  const dt = DEVICE_TYPES[guide.applianceType as keyof typeof DEVICE_TYPES]
  const w = maxWidth === '2xl' ? 'sm:max-w-2xl' : 'sm:max-w-xl'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[90vh] overflow-hidden flex flex-col', w)}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            {dt && (
              <Badge variant="outline" className="gap-1">
                <GuideIcon applianceType={guide.applianceType} className="size-3" />
                {dt.label}
              </Badge>
            )}
            <GuideStatusBadge status={guide.status} />
            <GuideDifficultyBadge difficulty={guide.difficulty} />
            <Badge variant="secondary" className="font-mono">
              v{guide.version}
            </Badge>
            <Badge variant="outline" className="gap-1 font-mono">
              <BookOpen className="size-3" /> {guide.usageCount} uso{guide.usageCount === 1 ? '' : 's'}
            </Badge>
          </div>
          <h2 className="text-lg font-semibold leading-snug">{guide.title}</h2>
          {guide.summary && <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{guide.summary}</p>}
        </div>
        <ScrollArea className="flex-1 py-3 max-h-[55vh]">
          <RepairGuideDetailContent guide={guide} onEdit={onEdit} />
        </ScrollArea>
        <DialogFooter className="gap-2 sm:gap-2 pt-2">
          {onEdit && (
            <Button onClick={onEdit}>
              <Pencil className="size-4 mr-2" /> Editar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}