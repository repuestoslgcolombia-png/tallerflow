'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  BookOpen,
  Clock,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  GuideIcon,
  parseJsonArray,
  parsePartsUsed,
  type RepairGuide,
} from '@/components/tallerflow/repair-guide-detail'
import { DEVICE_TYPES, APPLIANCE_BRANDS, type DeviceTypeKey } from '@/lib/constants'
import { cn } from '@/lib/utils'

export interface GuideFormState {
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

export const emptyGuideForm: GuideFormState = {
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

export function guideToForm(guide: RepairGuide): GuideFormState {
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

export function safeNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function buildGuidePayload(form: GuideFormState, isEdit: boolean): any {
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

  return payload
}

export function GuideFormDialog({
  open,
  onOpenChange,
  guide,
  initial,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  guide?: RepairGuide
  initial?: Partial<GuideFormState>
  onSubmit: (data: any) => void
  submitting: boolean
}) {
  const isEdit = !!guide
  const [form, setForm] = React.useState<GuideFormState>(() =>
    guide ? guideToForm(guide) : { ...emptyGuideForm, ...(initial || {}) }
  )

  React.useEffect(() => {
    if (open) setForm(guide ? guideToForm(guide) : { ...emptyGuideForm, ...(initial || {}) })
  }, [open, guide, initial])

  const update = <K extends keyof GuideFormState>(key: K, value: GuideFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.steps.trim()) {
      toast.error('El título y el procedimiento son obligatorios')
      return
    }
    onSubmit(buildGuidePayload(form, isEdit))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="size-5" /> : <Plus className="size-5" />}
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
              <FormSection title="Información básica" icon={<BookOpen className="size-4" />}>
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
                              <GuideIcon applianceType={key} className="size-4" />
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
              <FormSection title="Síntomas" icon={<Search className="size-4" />}>
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
              <FormSection title="Procedimiento" icon={<ListChecks className="size-4" />}>
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
              <FormSection title="Detalles" icon={<Clock className="size-4" />}>
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
                  {!isEdit && (
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
                  )}
                </div>
                <Field label="Repuestos utilizados" hint="Separados por coma. Cantidad opcional: Condensador (x2)">
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
              {initial ? 'Guardar como guía' : isEdit ? 'Guardar cambios' : 'Crear guía'}
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
      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  )
}

export function Field({
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
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}