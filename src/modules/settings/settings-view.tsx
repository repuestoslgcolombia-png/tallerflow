'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Store, Phone, Mail, MapPin, Percent, DollarSign, Hash, Save, RotateCcw, ImageIcon, Users, Plus, Loader2, UserRound, ShieldCheck, Globe, Copy, KeyRound, Trash2, Code2, Eye, EyeOff } from 'lucide-react'
import { useSettings, useSettingsMutation, useUsers, useUserMutations, useApiKeys, useApiKeyMutations } from '@/lib/hooks/api'
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
import { toast } from 'sonner'

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
      <WebIntegrationsSection />
      <AccountSection />
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

// ============== MI CUENTA (cambiar contraseña) ==============
// El usuario logueado cambia su contraseña sin salir de la app.
// Cuentas con email/password: se verifica la contraseña actual antes
// de permitir el cambio. Cuentas solo-Google: definen su primera
// contraseña (desde entonces pueden ingresar también por correo).

function AccountSection() {
  const [email, setEmail] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [checking, setChecking] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    // Email + si la cuenta tiene contraseña (provider email con credenciales)
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email ?? '')
        const emailIdentity = (session.user.identities ?? []).find((i: any) =>
          (i.identity_data?.email ?? i.provider === 'email')
        )
        // provider 'email' con contraseña presente; google-only si no
        setHasPassword(!!emailIdentity || session.user.app_metadata?.providers?.includes('email') === true)
      }
      setChecking(false)
    })
  }, [])

  const canSubmit =
    !checking &&
    !loading &&
    newPassword.length >= 8 &&
    newPassword === confirm &&
    (!hasPassword || currentPassword.length > 0) &&
    newPassword !== currentPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirm) {
      toast.error('Las contraseñas nuevas no coinciden')
      return
    }
    if (hasPassword && newPassword === currentPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual')
      return
    }

    const supabase = createClient()
    setLoading(true)

    try {
      // Verificar la contraseña actual ANTES de cambiar (no basta la sesión:
      // evita que alguien en una PC compartida cambie la contraseña sin conocerla)
      if (hasPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword,
        })
        if (signInError) {
          toast.error('La contraseña actual es incorrecta')
          setLoading(false)
          return
        }
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message || 'No se pudo actualizar la contraseña')
        setLoading(false)
        return
      }

      toast.success(
        hasPassword
          ? 'Contraseña actualizada'
          : 'Contraseña definida: ya puedes ingresar también con tu correo'
      )
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
      setLoading(false)
    } catch {
      toast.error('No se pudo actualizar la contraseña')
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex size-7 items-center justify-center rounded-md bg-amber-100 text-amber-600">
            <KeyRound className="size-4" />
          </div>
          Mi cuenta
        </CardTitle>
        <CardDescription>
          {hasPassword
            ? 'Cambia la contraseña de acceso a TallerFlow'
            : 'Define una contraseña para ingresar también con tu correo'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {checking ? (
          <Skeleton className="h-40" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="account-email" className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" /> Correo de la cuenta
              </Label>
              <Input id="account-email" type="email" value={email} disabled readOnly />
            </div>

            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrent((v) => !v)}
                  >
                    {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-password-account">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password-account"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showNew ? 'Ocultar' : 'Mostrar'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password-account">Confirmar contraseña</Label>
                <Input
                  id="confirm-password-account"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Mínimo 8 caracteres. Al cambiarla, tu sesión actual se mantiene activa.
            </p>

            <div className="flex justify-end">
              <Button type="submit" disabled={!canSubmit} className="gap-1.5">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

// ============== INTEGRACIONES WEB (captación de solicitudes) ==============
// API keys para que la web del taller envíe formularios de solicitud de
// servicio → bandeja "Solicitudes Web". Incluye snippets listos para copiar.

function WebIntegrationsSection() {
  const { data: keys, isLoading } = useApiKeys()
  const { create, revoke } = useApiKeyMutations()
  const [newName, setNewName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showSnippets, setShowSnippets] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://TU-DOMINIO-TALLERFLOW'

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      toast.success('Copiado al portapapeles')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    const result = await create.mutateAsync(newName.trim())
    setCreatedKey(result?.key || null)
    setNewName('')
  }

  const widgetSnippet = `<!-- Formulario de solicitud de servicio TallerFlow -->
<div id="tallerflow-form"></div>
<script src="${baseUrl}/widget.js" data-key="TU_API_KEY" async></script>`

  const curlSnippet = `curl -X POST ${baseUrl}/api/public/leads \\
  -H "Authorization: Bearer TU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "María", "lastName": "Gómez",
    "phone": "3001234567", "address": "Calle 10 #5-5",
    "deviceType": "washing_machine", "deviceBrand": "LG",
    "reportedIssue": "No desagua"
  }'`

  const formSnippet = `<form action="${baseUrl}/api/public/leads" method="POST">
  <input type="hidden" name="sourceUrl" value="https://TU-WEB.COM/contacto">
  <input type="hidden" name="deviceType" value="washing_machine">
  <input name="firstName" placeholder="Nombre" required>
  <input name="lastName" placeholder="Apellido" required>
  <input name="phone" placeholder="Teléfono" required>
  <input name="reportedIssue" placeholder="Describe el problema" required>
  <!-- IMPORTANTE: incluir el header Authorization requiere JS;
       para formularios HTML puros usa el widget o la API -->
</form>`

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex size-7 items-center justify-center rounded-md bg-teal-100 text-teal-600">
            <Globe className="size-4" />
          </div>
          Integraciones Web
          </CardTitle>
        <CardDescription>
          Conecta la página web de tu taller: las solicitudes de servicio llegan a la bandeja "Solicitudes Web"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Crear key */}
        <div className="flex gap-2">
          <Input
            placeholder="Nombre de la integración (ej. Web del taller)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!newName.trim() || create.isPending} className="gap-1.5">
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Crear
          </Button>
        </div>

        {/* Key recién creada: mostrar UNA vez */}
        {createdKey && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-800">
              <KeyRound className="size-4" /> Copia tu API key ahora — no volverá a mostrarse
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-white px-2 py-1.5 font-mono text-xs">
                {createdKey}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(createdKey, 'new-key')}>
                {copied === 'new-key' ? '✓' : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de keys */}
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (keys || []).length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Aún no tienes API keys. Crea una para conectar tu web.
          </p>
        ) : (
          <div className="space-y-2">
            {(keys || []).map((k: any) => (
              <div key={k.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{k.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{k.keyPrefix}…</p>
                  <p className="text-[11px] text-muted-foreground">
                    {k._count?.leads ?? 0} solicitudes ·{' '}
                    {k.lastUsedAt ? `último uso ${new Date(k.lastUsedAt).toLocaleDateString('es-CO')}` : 'sin uso aún'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={k.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}>
                    {k.active ? 'Activa' : 'Revocada'}
                  </Badge>
                  {k.active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-rose-600 hover:text-rose-600"
                      onClick={() => revoke.mutate(k.id)}
                      title="Revocar"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Snippets */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setShowSnippets(!showSnippets)}
          >
            <Code2 className="size-4" />
            {showSnippets ? 'Ocultar' : 'Ver'} código de integración
          </Button>
          {showSnippets && (
            <div className="mt-2 space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium">1. Widget (recomendado — WordPress, Wix, HTML):</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">{widgetSnippet}</pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium">2. API REST (para desarrolladores):</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">{curlSnippet}</pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium">3. Formulario HTML (redirect con ?sent=ok):</p>
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">{formSnippet}</pre>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Nota: el método &lt;form&gt; directo no puede enviar el header Authorization (limitación de HTML);
                  para formularios sin JS usa el widget.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
