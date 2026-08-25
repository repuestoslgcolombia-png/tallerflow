'use client'

import { useState } from 'react'
import { Store, Phone, Mail, MapPin, Percent, DollarSign, Hash, Save, RotateCcw, ImageIcon, Users, Plus, Loader2, UserRound, ShieldCheck } from 'lucide-react'
import { useSettings, useSettingsMutation, useUsers, useUserMutations } from '@/lib/hooks/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface SettingsForm {
  name: string
  phone: string
  email: string
  address: string
  logoUrl: string
  currency: string
  currencySymbol: string
  taxRate: number | string
  warrantyPolicy: string
}

export function SettingsView() {
  const { data: settings, isLoading } = useSettings()

  return (
    <>
      <TeamSection />
      {isLoading || !settings ? (
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <SettingsForm settings={settings} key={settings.id} />
      )}
    </>
  )
}

const ROLE_LABELS: Record<string, string> = {
  technician: 'Técnico',
  receptionist: 'Recepcionista',
  admin: 'Administrador',
}

const ROLE_CLASSES: Record<string, string> = {
  technician: 'border-sky-300 bg-sky-50 text-sky-700',
  receptionist: 'border-violet-300 bg-violet-50 text-violet-700',
  admin: 'border-amber-300 bg-amber-50 text-amber-700',
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function TeamSection() {
  const { data: users, isLoading } = useUsers(true)
  const { create, setActive } = useUserMutations()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('technician')

  const team: any[] = users || []
  const canSubmit = name.trim() && phone.trim()

  const handleAdd = () => {
    if (!canSubmit) return
    create.mutate(
      { name: name.trim(), phone: phone.trim(), role },
      {
        onSuccess: () => {
          setName('')
          setPhone('')
          setRole('technician')
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Equipo de trabajo</h2>
          <p className="text-sm text-muted-foreground">Gestiona los técnicos y el personal del taller.</p>
        </div>
      </div>

      {/* Agregar miembro */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-md bg-violet-100 text-violet-600">
              <UserRound className="size-4" />
            </div>
            Agregar técnico
          </CardTitle>
          <CardDescription>Los técnicos aparecerán al asignar órdenes de trabajo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-12">
            <div className="space-y-1.5 sm:col-span-5">
              <Label htmlFor="team-name">Nombre *</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-4">
              <Label htmlFor="team-phone" className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> WhatsApp *
              </Label>
              <Input
                id="team-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+57 300 123 4567"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label>Rol</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Técnico</SelectItem>
                  <SelectItem value="receptionist">Recepcionista</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleAdd} disabled={!canSubmit || create.isPending} className="gap-1.5">
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {create.isPending ? 'Agregando...' : 'Agregar técnico'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista del equipo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
              <Users className="size-4" />
            </div>
            Miembros del equipo
          </CardTitle>
          <CardDescription>
            {team.length} {team.length === 1 ? 'miembro' : 'miembros'} · usa el interruptor para activar o desactivar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <Skeleton className="h-10" />}
          {!isLoading && team.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aún no hay miembros. Agrega el primer técnico.
            </p>
          )}
          {team.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className={`truncate text-sm font-medium ${!u.active ? 'text-muted-foreground' : ''}`}>
                    {u.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.phone || 'Sin teléfono'}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className={ROLE_CLASSES[u.role] || ''}>
                  {ROLE_LABELS[u.role] || u.role}
                </Badge>
                <Switch
                  checked={u.active}
                  onCheckedChange={(v) => setActive.mutate({ id: u.id, active: v })}
                  aria-label={`Activar ${u.name}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsForm({ settings }: { settings: any }) {
  const mutation = useSettingsMutation()
  const [form, setForm] = useState<SettingsForm>({
    name: settings.name || '',
    phone: settings.phone || '',
    email: settings.email || '',
    address: settings.address || '',
    logoUrl: settings.logoUrl || '',
    currency: settings.currency || 'COP',
    currencySymbol: settings.currencySymbol || '$',
    taxRate: settings.taxRate ?? 0,
    warrantyPolicy: settings.warrantyPolicy || '',
  })
  const [dirty, setDirty] = useState(false)

  const update = (field: keyof SettingsForm, value: string | number) => {
    setForm((f) => ({ ...f, [field]: value }))
    setDirty(true)
  }

  const handleSave = () => {
    mutation.mutate({
      ...form,
      taxRate: Number(form.taxRate) || 0,
    })
    setDirty(false)
  }

  const handleReset = () => {
    setForm({
      name: settings.name || '',
      phone: settings.phone || '',
      email: settings.email || '',
      address: settings.address || '',
      logoUrl: settings.logoUrl || '',
      currency: settings.currency || 'COP',
      currencySymbol: settings.currencySymbol || '$',
      taxRate: settings.taxRate ?? 0,
      warrantyPolicy: settings.warrantyPolicy || '',
    })
    setDirty(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configuración del taller</h2>
          <p className="text-sm text-muted-foreground">Personaliza la información y parámetros de tu taller</p>
        </div>
        {dirty && (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            Cambios sin guardar
          </Badge>
        )}
      </div>

      {/* Información del taller */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Store className="size-4" />
            </div>
            Información del taller
          </CardTitle>
          <CardDescription>Datos que aparecerán en cotizaciones y facturas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre del taller *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="TallerTech Pro"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> Teléfono
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+57 300 123 4567"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" /> Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="contacto@taller.com"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address" className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" /> Dirección
              </Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Calle 45 #23-18, Bogotá"
                rows={2}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="logoUrl" className="flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-muted-foreground" /> URL del logo
              </Label>
              <Input
                id="logoUrl"
                value={form.logoUrl}
                onChange={(e) => update('logoUrl', e.target.value)}
                placeholder="https://..."
              />
              <p className="text-[11px] text-muted-foreground">Se mostrará en los documentos PDF generados</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="warrantyPolicy" className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-muted-foreground" /> Política de garantías
              </Label>
              <Textarea
                id="warrantyPolicy"
                value={form.warrantyPolicy}
                onChange={(e) => update('warrantyPolicy', e.target.value)}
                placeholder="Ej: Todas las reparaciones incluyen 3 meses de garantía sobre mano de obra y repuestos instalados..."
                rows={3}
              />
              <p className="text-[11px] text-muted-foreground">Se imprimirá en todas las facturas y cotizaciones generadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de facturación */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
              <DollarSign className="size-4" />
            </div>
            Configuración de facturación
          </CardTitle>
          <CardDescription>Parámetros monetarios y de impuestos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda (código)</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
                placeholder="COP"
                maxLength={5}
              />
              <p className="text-[11px] text-muted-foreground">ISO 4217</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currencySymbol">Símbolo</Label>
              <Input
                id="currencySymbol"
                value={form.currencySymbol}
                onChange={(e) => update('currencySymbol', e.target.value)}
                placeholder="$"
                maxLength={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxRate" className="flex items-center gap-1.5">
                <Percent className="size-3.5 text-muted-foreground" /> Tasa de impuesto (%)
              </Label>
              <Input
                id="taxRate"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.taxRate}
                onChange={(e) => update('taxRate', e.target.value)}
                placeholder="19"
              />
              <p className="text-[11px] text-muted-foreground">IVA aplicado a cotizaciones y facturas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contadores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-md bg-violet-100 text-violet-600">
              <Hash className="size-4" />
            </div>
            Contadores de documentos
          </CardTitle>
          <CardDescription>Se incrementan automáticamente al crear documentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Órdenes (OT)</p>
              <p className="mt-1 text-2xl font-bold">{settings.counterWorkOrder}</p>
              <p className="text-[10px] text-muted-foreground">Próxima: OT-{new Date().getFullYear()}-{String(settings.counterWorkOrder + 1).padStart(3, '0')}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Cotizaciones</p>
              <p className="mt-1 text-2xl font-bold">{settings.counterQuote}</p>
              <p className="text-[10px] text-muted-foreground">Próxima: COT-{new Date().getFullYear()}-{String(settings.counterQuote + 1).padStart(3, '0')}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Facturas</p>
              <p className="mt-1 text-2xl font-bold">{settings.counterInvoice}</p>
              <p className="text-[10px] text-muted-foreground">Próxima: FAC-{new Date().getFullYear()}-{String(settings.counterInvoice + 1).padStart(3, '0')}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Los contadores garantizan códigos únicos. No se pueden editar manualmente para mantener la integridad.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Save / Reset actions */}
      <div className="flex items-center justify-end gap-2 pb-4">
        <Button variant="outline" onClick={handleReset} disabled={!dirty || mutation.isPending} className="gap-1.5">
          <RotateCcw className="size-4" /> Descartar
        </Button>
        <Button onClick={handleSave} disabled={!dirty || mutation.isPending} className="gap-1.5">
          <Save className="size-4" />
          {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
