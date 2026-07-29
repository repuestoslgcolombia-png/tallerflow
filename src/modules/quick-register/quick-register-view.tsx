'use client'

import { useState, type ReactNode } from 'react'
import {
  UserPlus,
  User,
  Phone,
  MapPin,
  IdCard,
  Calendar,
  Clock,
  Wrench,
  Laptop,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  ClipboardList,
} from 'lucide-react'
import { useQuickRegisterMutation } from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import { DEVICE_TYPES, SERVICE_TYPES, PRIORITY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 18; h++) {
  for (const m of ['00', '30']) {
    if (h === 18 && m === '30') break
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${m}`)
  }
}

const DEVICE_KEYS = Object.keys(DEVICE_TYPES)
const SERVICE_KEYS = Object.keys(SERVICE_TYPES)
const PRIORITY_KEYS = Object.keys(PRIORITY)

interface FormData {
  firstName: string
  lastName: string
  phone: string
  address: string
  documentId: string
  serviceType: string
  visitDate: Date | undefined
  visitTime: string
  deviceType: string
  deviceBrand: string
  deviceModel: string
  reportedIssue: string
  priority: string
}

const initialForm: FormData = {
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  documentId: '',
  serviceType: 'revision',
  visitDate: undefined,
  visitTime: '',
  deviceType: '',
  deviceBrand: '',
  deviceModel: '',
  reportedIssue: '',
  priority: 'normal',
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Cliente', 'Servicio', 'Equipo']
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
              i < current ? 'bg-primary text-primary-foreground' : i === current ? 'bg-primary/20 text-primary ring-2 ring-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            {i < current ? <CheckCircle2 className="size-4" /> : i + 1}
          </div>
          <span className={cn('hidden text-sm sm:inline', i === current ? 'font-medium text-foreground' : 'text-muted-foreground')}>
            {labels[i]}
          </span>
          {i < total - 1 && <div className={cn('h-px w-8 sm:w-12', i < current ? 'bg-primary' : 'bg-border')} />}
        </div>
      ))}
    </div>
  )
}

export function QuickRegisterView() {
  const { navigate } = useAppStore()
  const mutation = useQuickRegisterMutation()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validateStep(s: number): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (s === 0) {
      if (!form.firstName.trim()) errs.firstName = 'Obligatorio'
      if (!form.lastName.trim()) errs.lastName = 'Obligatorio'
      if (!form.phone.trim()) errs.phone = 'Obligatorio'
      if (!form.address.trim()) errs.address = 'Obligatorio'
    }
    if (s === 2) {
      if (!form.deviceType) errs.deviceType = 'Selecciona un tipo'
      if (!form.reportedIssue.trim()) errs.reportedIssue = 'Describe el problema'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 3))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function handleSubmit() {
    if (!validateStep(2)) { setStep(2); return }
    mutation.mutate(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        documentId: form.documentId.trim() || undefined,
        serviceType: form.serviceType,
        visitDate: form.visitDate?.toISOString(),
        visitTime: form.visitTime || undefined,
        deviceType: form.deviceType,
        deviceBrand: form.deviceBrand.trim() || undefined,
        deviceModel: form.deviceModel.trim() || undefined,
        reportedIssue: form.reportedIssue.trim(),
        priority: form.priority,
      },
      {
        onSuccess: (data: any) => {
          setForm(initialForm)
          setStep(0)
        },
      }
    )
  }

  const isLoading = mutation.isPending
  const result = mutation.data as any
  const serviceConf = SERVICE_TYPES[form.serviceType as keyof typeof SERVICE_TYPES] || SERVICE_TYPES.revision

  function renderFieldError(field: keyof FormData) {
    if (!errors[field]) return null
    return <p className="text-xs text-rose-500">{errors[field]}</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Captación Rápida</h1>
        <p className="text-sm text-muted-foreground">Registra un cliente, programa la visita y crea la orden de servicio en segundos</p>
      </div>

      {result ? (() => {
    const wo = result.workOrder
    return (
      <Card className="mx-auto max-w-lg border-emerald-200 bg-emerald-50">
        <CardHeader className="items-center gap-2 pb-2 pt-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>
          <CardTitle className="text-xl">¡Registro completado!</CardTitle>
          <CardDescription>Se ha creado todo correctamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <div className="divide-y rounded-lg border bg-white">
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">Orden</span>
              <span className="text-sm font-medium">{wo.code}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">Cliente</span>
              <span className="text-sm font-medium">{result.customer.firstName} {result.customer.lastName}</span>
            </div>
            <div className="flex justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground">Servicio</span>
              <span className="text-sm font-medium">{serviceConf.label}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => navigate('work-order-detail', { workOrderId: wo.id })}>
              <ClipboardList className="mr-2 size-4" />
              Ver orden
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => { setForm(initialForm); setStep(0) }}>
              <UserPlus className="mr-2 size-4" />
              Nuevo registro
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  })() : (
        <>
          <StepIndicator current={step} total={3} />

          {mutation.isError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="size-4 shrink-0" />
                {(mutation.error as Error).message}
              </div>
            )}

          <Card>
            <CardContent className="pt-6">
              {/* STEP 1: Cliente */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <User className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Datos del cliente</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">
                        Nombre <span className="text-rose-500">*</span>
                      </Label>
                      <Input id="firstName" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Nombre del cliente" />
                      {renderFieldError('firstName')}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">
                        Apellido <span className="text-rose-500">*</span>
                      </Label>
                      <Input id="lastName" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Apellido del cliente" />
                      {renderFieldError('lastName')}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">
                        Teléfono <span className="text-rose-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="phone" className="pl-9" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="300 123 4567" />
                      </div>
                      {renderFieldError('phone')}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="documentId">Documento</Label>
                      <div className="relative">
                        <IdCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="documentId" className="pl-9" value={form.documentId} onChange={(e) => set('documentId', e.target.value)} placeholder="C.C. / NIT" />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">
                      Dirección <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input id="address" className="pl-9" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Calle 123 # 45-67, Barrio" />
                    </div>
                    {renderFieldError('address')}
                  </div>
                </div>
              )}

              {/* STEP 2: Servicio y agenda */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Calendar className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Tipo de servicio y agenda</h2>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="serviceType">Tipo de servicio</Label>
                    <Select value={form.serviceType} onValueChange={(v) => set('serviceType', v)}>
                      <SelectTrigger id="serviceType">
                        <SelectValue placeholder="Selecciona tipo de servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_KEYS.map((key) => {
                          const conf = SERVICE_TYPES[key as keyof typeof SERVICE_TYPES]
                          return (
                            <SelectItem key={key} value={key}>
                              {conf.label}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="visitDate">Fecha de visita técnica</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="visitDate"
                            variant="outline"
                            className={cn('w-full justify-start font-normal', !form.visitDate && 'text-muted-foreground')}
                          >
                            <Calendar className="mr-2 size-4" />
                            {form.visitDate ? format(form.visitDate, 'PPP', { locale: es }) : 'Selecciona fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={form.visitDate}
                            onSelect={(d) => set('visitDate', d)}
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="visitTime">Hora de visita</Label>
                      <Select value={form.visitTime} onValueChange={(v) => set('visitTime', v)}>
                        <SelectTrigger id="visitTime">
                          <div className="flex items-center">
                            <Clock className="mr-2 size-4 shrink-0 text-muted-foreground" />
                            <SelectValue placeholder="Selecciona hora" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Equipo y problema */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Laptop className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Equipo y problema</h2>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deviceType">
                      Tipo de equipo <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={form.deviceType} onValueChange={(v) => set('deviceType', v)}>
                      <SelectTrigger id="deviceType">
                        <SelectValue placeholder="Selecciona tipo de equipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEVICE_KEYS.map((key) => {
                          const conf = DEVICE_TYPES[key as keyof typeof DEVICE_TYPES]
                          return (
                            <SelectItem key={key} value={key}>
                              {conf.label}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {renderFieldError('deviceType')}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="deviceBrand">Marca</Label>
                      <Input id="deviceBrand" value={form.deviceBrand} onChange={(e) => set('deviceBrand', e.target.value)} placeholder="LG, Samsung, Whirlpool..." />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="deviceModel">Modelo</Label>
                      <Input id="deviceModel" value={form.deviceModel} onChange={(e) => set('deviceModel', e.target.value)} placeholder="WA13T, RT29..." />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reportedIssue">
                      Problema reportado <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      id="reportedIssue"
                      value={form.reportedIssue}
                      onChange={(e) => set('reportedIssue', e.target.value)}
                      placeholder="Describe el problema que presenta el equipo..."
                      rows={3}
                    />
                    {renderFieldError('reportedIssue')}
                  </div>
                </div>
              )}

              {/* STEP 3.5: Confirmación (se muestra como parte del step 3) */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <CheckCircle2 className="size-5 text-primary" />
                    <h2 className="text-lg font-semibold">Confirmar registro</h2>
                  </div>

                  <div className="divide-y rounded-lg border">
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Cliente</span>
                      <span className="text-sm font-medium">{form.firstName} {form.lastName}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Teléfono</span>
                      <span className="text-sm font-medium">{form.phone}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Dirección</span>
                      <span className="text-sm font-medium">{form.address}</span>
                    </div>
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Servicio</span>
                      <span className="text-sm font-medium">{serviceConf.label}</span>
                    </div>
                    {form.visitDate && (
                      <div className="flex justify-between px-4 py-3">
                        <span className="text-sm text-muted-foreground">Visita</span>
                        <span className="text-sm font-medium">
                          {format(form.visitDate, 'PPP', { locale: es })}{form.visitTime ? ` - ${form.visitTime}` : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Equipo</span>
                      <span className="text-sm font-medium">
                        {DEVICE_TYPES[form.deviceType as keyof typeof DEVICE_TYPES]?.label || form.deviceType}
                        {form.deviceBrand ? ` - ${form.deviceBrand}` : ''}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <span className="text-sm text-muted-foreground">Problema</span>
                      <p className="mt-1 text-sm font-medium">{form.reportedIssue}</p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_KEYS.map((key) => {
                          const p = PRIORITY[key as keyof typeof PRIORITY]
                          return (
                            <SelectItem key={key} value={key}>
                              {p.label}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de navegación */}
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={back} disabled={step === 0 || isLoading}>
              <ArrowLeft className="mr-2 size-4" />
              Atrás
            </Button>
            {step < 3 ? (
              <Button onClick={next}>
                {step === 2 ? 'Revisar' : 'Siguiente'}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    Registrar y ver orden
                  </>
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}