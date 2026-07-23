'use client'

import { useState } from 'react'
import { Store, Phone, Mail, MapPin, Percent, DollarSign, Hash, Save, RotateCcw, ImageIcon } from 'lucide-react'
import { useSettings, useSettingsMutation } from '@/lib/hooks/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface SettingsForm {
  name: string
  phone: string
  email: string
  address: string
  logoUrl: string
  currency: string
  currencySymbol: string
  taxRate: number | string
}

export function SettingsView() {
  const { data: settings, isLoading } = useSettings()

  if (isLoading || !settings) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return <SettingsForm settings={settings} key={settings.id} />
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
    })
    setDirty(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configuración del Taller</h2>
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
            Información del Taller
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
                <Mail className="size-3.5 text-muted-foreground" /> Email
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
              <p className="text-[11px] text-muted-foreground">Se mostrará en documentos PDF generados</p>
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
            Configuración de Facturación
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
            Contadores de Documentos
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
