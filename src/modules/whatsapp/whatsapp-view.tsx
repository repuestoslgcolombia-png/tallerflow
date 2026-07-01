'use client'

import { useState } from 'react'
import {
  MessageCircle,
  Plus,
  Search,
  Send,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Check,
  Clock,
  FileText,
  Users,
  MessageSquare,
  ShieldCheck,
  Star,
  Wrench,
  Bell,
  Receipt,
  Package,
  ChevronRight,
  Sparkles,
  History,
  Phone,
  ClipboardList,
  QrCode,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Wifi,
} from 'lucide-react'
import {
  useWhatsAppTemplates,
  useWhatsAppTemplateMutations,
  useWhatsAppMessages,
  useWhatsAppRender,
  sendWhatsAppMessage,
  useCustomers,
  useWhatsAppConnection,
  useWhatsAppConnectionMutation,
} from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import { formatDateTime, timeAgo, fullName, getInitials } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CATEGORY_ICONS: Record<string, any> = {
  general: MessageCircle,
  quotes: FileText,
  orders: ClipboardList,
  reminders: Bell,
  marketing: Sparkles,
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  quotes: 'Cotizaciones',
  orders: 'Órdenes',
  reminders: 'Recordatorios',
  marketing: 'Marketing',
}

export function WhatsAppView() {
  const [tab, setTab] = useState('connection')

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 sm:w-auto">
          <TabsTrigger value="connection" className="gap-1.5">
            <QrCode className="size-3.5" />
            <span className="hidden sm:inline">Conexión</span>
          </TabsTrigger>
          <TabsTrigger value="compose" className="gap-1.5">
            <Send className="size-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="size-3.5" />
            <span className="hidden sm:inline">Plantillas</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="size-3.5" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="mt-4">
          <ConnectionTab />
        </TabsContent>
        <TabsContent value="compose" className="mt-4">
          <ComposeTab />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============== Connection Tab ==============
function ConnectionTab() {
  const { data: conn, isLoading } = useWhatsAppConnection()
  const mutation = useWhatsAppConnectionMutation()

  const [phone, setPhone] = useState('')
  const [displayName, setDisplayName] = useState('')

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Estado: CONECTADO
  if (conn?.status === 'connected') {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              WhatsApp Business Conectado
            </CardTitle>
            <CardDescription>Tu número de negocio está enlazado y listo para enviar mensajes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">Número de teléfono</p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold">
                  <Phone className="size-3.5 text-emerald-500" />
                  {conn.phone}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">Nombre visible</p>
                <p className="mt-1 text-sm font-semibold">{conn.displayName || conn.businessName || 'Taller'}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">Conectado desde</p>
                <p className="mt-1 text-sm">{conn.connectedAt ? formatDateTime(conn.connectedAt) : '—'}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">Última actividad</p>
                <p className="mt-1 text-sm">{conn.lastSeenAt ? timeAgo(conn.lastSeenAt) : '—'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => mutation.mutate({ action: 'update_profile', displayName, businessName: displayName })}
                disabled={!displayName || mutation.isPending}
              >
                <Pencil className="size-3.5" /> Actualizar nombre
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-rose-600 hover:text-rose-700"
                onClick={() => mutation.mutate({ action: 'disconnect' })}
                disabled={mutation.isPending}
              >
                <Unlink className="size-3.5" /> Desconectar
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <Wifi className="size-4 shrink-0 text-emerald-600" />
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Los mensajes se envían a través de tu WhatsApp Business. El destinatario verá tu número de negocio como remitente.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="size-4" />
              Estado del Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Estado</span>
              <Badge className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="mr-1 size-1.5 animate-pulse rounded-full bg-emerald-500" />
                En línea
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Mensajes enviados</span>
              <span className="text-sm font-semibold">Activos</span>
            </div>
            <div className="rounded-lg border border-dashed p-3 text-center">
              <p className="text-xs text-muted-foreground">
                Para usar la API oficial de WhatsApp Business Cloud, configura tu token en la sección de ajustes avanzados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado: EMPAREJAMIENTO (QR generado)
  if (conn?.status === 'pairing') {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="pb-3 text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-base">
              <QrCode className="size-5 text-emerald-500" />
              Escanea el código QR
            </CardTitle>
            <CardDescription>Abre WhatsApp en tu teléfono y escanea este código para enlazar tu número de negocio</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {conn.qr && (
              <div className="rounded-xl border-2 border-emerald-200 bg-white p-4 dark:border-emerald-800">
                <img
                  src={conn.qr}
                  alt="QR WhatsApp"
                  className="size-64"
                />
              </div>
            )}

            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Código de emparejamiento</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-emerald-600">{conn.pairingCode}</p>
            </div>

            <div className="w-full rounded-md border bg-amber-50 p-3 dark:bg-amber-950/20">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                ⏱️ El código expira en 2 minutos. Si no puedes escanear a tiempo, genera uno nuevo.
              </p>
            </div>

            {/* Formulario de confirmación */}
            <div className="w-full space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Confirma tu número de WhatsApp Business</p>
              <div className="grid gap-2">
                <Label htmlFor="phone-confirm">Número de teléfono *</Label>
                <Input
                  id="phone-confirm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name-confirm">Nombre del negocio</Label>
                <Input
                  id="name-confirm"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="TallerTech Pro"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => mutation.mutate({ action: 'pair' })}
                  disabled={mutation.isPending}
                >
                  <RefreshCw className="size-3.5" /> Nuevo QR
                </Button>
                <Button
                  className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    mutation.mutate({ action: 'connect', phone, displayName, businessName: displayName })
                    setPhone('')
                    setDisplayName('')
                  }}
                  disabled={!phone || mutation.isPending}
                >
                  <Link2 className="size-3.5" /> Confirmar conexión
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado: DESCONECTADO (inicial)
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader className="pb-3 text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <MessageCircle className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-lg">Conecta tu WhatsApp Business</CardTitle>
          <CardDescription className="mx-auto max-w-md">
            Enlaza tu número de WhatsApp de negocio para enviar cotizaciones, facturas y recordatorios directamente desde TallerFlow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <QrCode className="mx-auto mb-1.5 size-5 text-emerald-500" />
              <p className="text-xs font-medium">1. Genera el QR</p>
              <p className="text-[10px] text-muted-foreground">Crea un código único</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <Smartphone className="mx-auto mb-1.5 size-5 text-emerald-500" />
              <p className="text-xs font-medium">2. Escanea</p>
              <p className="text-[10px] text-muted-foreground">Ábrelo en WhatsApp</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <CheckCircle2 className="mx-auto mb-1.5 size-5 text-emerald-500" />
              <p className="text-xs font-medium">3. Confirma</p>
              <p className="text-[10px] text-muted-foreground">Verifica tu número</p>
            </div>
          </div>

          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
            <p className="flex items-start gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <span>Tus mensajes se envían a través de WhatsApp Web/API usando tu número enlazado. No almacenamos tu contraseña ni claves privadas.</span>
            </p>
          </div>

          <Button
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            onClick={() => mutation.mutate({ action: 'pair' })}
            disabled={mutation.isPending}
          >
            <QrCode className="size-5" />
            {mutation.isPending ? 'Generando...' : 'Generar código QR'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============== Compose Tab ==============
function ComposeTab() {
  const { navigate } = useAppStore()
  const { data: templates, isLoading: templatesLoading } = useWhatsAppTemplates()
  const { data: customers } = useCustomers()
  const { mutateAsync: render } = useWhatsAppRender()

  const [customerId, setCustomerId] = useState('')
  const [workOrderId, setWorkOrderId] = useState('none')
  const [templateCode, setTemplateCode] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const selectedCustomer = customers?.find((c: any) => c.id === customerId)

  const handleSelectTemplate = async (code: string) => {
    setTemplateCode(code)
    if (customerId) {
      try {
        const result = await render({
          templateCode: code,
          customerId,
          workOrderId: workOrderId !== 'none' ? workOrderId : undefined,
        })
        setMessage(result.rendered)
      } catch {
        // si falla, solo cargar la plantilla sin renderizar
        const t = templates?.find((t: any) => t.code === code)
        setMessage(t?.body || '')
      }
    } else {
      const t = templates?.find((t: any) => t.code === code)
      setMessage(t?.body || '')
    }
  }

  const handleSelectCustomer = async (id: string) => {
    setCustomerId(id)
    setWorkOrderId('none')
    if (templateCode) {
      try {
        const result = await render({
          templateCode,
          customerId: id,
          workOrderId: workOrderId !== 'none' ? workOrderId : undefined,
        })
        setMessage(result.rendered)
      } catch {
        // ignore
      }
    }
  }

  const phone = selectedCustomer?.phone || ''
  const canSend = customerId && message.trim() && phone

  const handleSend = async () => {
    if (!canSend || !selectedCustomer) return
    setSending(true)
    try {
      await sendWhatsAppMessage({
        phone,
        message,
        customerId,
        workOrderId: workOrderId !== 'none' ? workOrderId : undefined,
        templateCode,
        customerName: fullName(selectedCustomer.firstName, selectedCustomer.lastName),
      })
      toast.success('Mensaje enviado por WhatsApp')
      setMessage('')
      setTemplateCode('')
      setCustomerId('')
      setWorkOrderId('none')
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    toast.success('Mensaje copiado al portapapeles')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Formulario de composición */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="size-4 text-emerald-500" />
              Componer Mensaje
            </CardTitle>
            <CardDescription>Selecciona un cliente y plantilla para enviar un mensaje por WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cliente */}
            <div className="grid gap-2">
              <Label>Cliente destinatario *</Label>
              <Select value={customerId} onValueChange={handleSelectCustomer}>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente..." /></SelectTrigger>
                <SelectContent>
                  {(customers || []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} {c.phone ? `· ${c.phone}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plantilla */}
            <div className="grid gap-2">
              <Label>Plantilla de mensaje</Label>
              <Select value={templateCode} onValueChange={handleSelectTemplate} disabled={templatesLoading}>
                <SelectTrigger><SelectValue placeholder="Selecciona una plantilla..." /></SelectTrigger>
                <SelectContent>
                  {(templates || []).map((t: any) => {
                    const Icon = CATEGORY_ICONS[t.category] || MessageCircle
                    return (
                      <SelectItem key={t.code} value={t.code}>
                        <Icon className="mr-1.5 size-4" />
                        {t.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {templatesLoading && <p className="text-[11px] text-muted-foreground">Cargando plantillas...</p>}
            </div>

            {/* Mensaje */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message">Mensaje *</Label>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopy} disabled={!message}>
                    <Copy className="size-3" /> Copiar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => setPreviewMode(!previewMode)}
                    disabled={!message}
                  >
                    <Eye className="size-3" /> {previewMode ? 'Editar' : 'Previsualizar'}
                  </Button>
                </div>
              </div>
              {previewMode ? (
                <div className="min-h-[160px] rounded-md border bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                    <MessageCircle className="size-3.5" /> Vista previa de WhatsApp
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{message}</p>
                </div>
              ) : (
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe o selecciona una plantilla..."
                  rows={8}
                  className="resize-y"
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                Variables disponibles: {'{cliente}'}, {'{equipo}'}, {'{codigo}'}, {'{total}'}, {'{fecha}'}, {'{taller}'}
              </p>
            </div>

            {/* Destino */}
            {selectedCustomer && (
              <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-900 dark:text-emerald-300">
                    {getInitials(fullName(selectedCustomer.firstName, selectedCustomer.lastName))}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{fullName(selectedCustomer.firstName, selectedCustomer.lastName)}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="size-3" />
                    {selectedCustomer.phone || 'Sin teléfono'}
                  </p>
                </div>
                {phone && (
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    Listo para enviar
                  </Badge>
                )}
              </div>
            )}

            {/* Botón enviar */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setMessage(''); setTemplateCode(''); setCustomerId('') }} disabled={!message && !customerId}>
                Limpiar
              </Button>
              <Button
                onClick={handleSend}
                disabled={!canSend || sending}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="size-4" />
                {sending ? 'Enviando...' : 'Enviar por WhatsApp'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plantillas rápidas laterales */}
      <div className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-amber-500" />
              Plantillas rápidas
            </CardTitle>
            <CardDescription className="text-xs">Toca para usar</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-3 pt-0">
                {(templates || []).map((t: any) => {
                  const Icon = CATEGORY_ICONS[t.category] || MessageCircle
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.code)}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50',
                        templateCode === t.code && 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                      )}
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{t.name}</p>
                          {t.isSystem && <Badge variant="secondary" className="shrink-0 text-[9px]">Sistema</Badge>}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{t.subject || t.body.substring(0, 60)}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============== Templates Tab ==============
function TemplatesTab() {
  const { data: templates, isLoading } = useWhatsAppTemplates()
  const { create, update, remove } = useWhatsAppTemplateMutations()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState<any | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = (templates || []).filter((t: any) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const categories = ['all', ...Array.from(new Set((templates || []).map((t: any) => t.category)))]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar plantilla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === 'all' ? 'Todas las categorías' : CATEGORY_LABELS[c] || c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Nueva Plantilla
        </Button>
      </div>

      {/* Grid de plantillas */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <FileText className="size-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">No hay plantillas</p>
              <p className="text-sm text-muted-foreground">Crea la primera plantilla de mensaje</p>
            </div>
            <Button variant="outline" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Crear plantilla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t: any) => {
            const Icon = CATEGORY_ICONS[t.category] || MessageCircle
            return (
              <Card key={t.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{t.name}</CardTitle>
                        <p className="font-mono text-[10px] text-muted-foreground">{t.code}</p>
                      </div>
                    </div>
                    {t.isSystem && <Badge variant="secondary" className="text-[9px]">Sistema</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2">
                  <p className="line-clamp-4 flex-1 text-xs text-muted-foreground">{t.body}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[t.category] || t.category}</Badge>
                    {!t.active && <Badge variant="outline" className="border-slate-300 text-[10px] text-slate-500">Inactiva</Badge>}
                  </div>
                  <div className="flex justify-end gap-1 pt-1">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditing(t)}>
                      <Pencil className="size-3" /> Editar
                    </Button>
                    {!t.isSystem && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-rose-600 hover:text-rose-700" onClick={() => setDeleteId(t.id)}>
                        <Trash2 className="size-3" /> Eliminar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit dialog */}
      {(createOpen || editing) && (
        <TemplateFormDialog
          open={createOpen || !!editing}
          onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditing(null) } }}
          template={editing}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>La plantilla será desactivada. Esta acción se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => { if (deleteId) remove.mutate(deleteId); setDeleteId(null) }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TemplateFormDialog({ open, onOpenChange, template }: { open: boolean; onOpenChange: (o: boolean) => void; template?: any | null }) {
  const { create, update } = useWhatsAppTemplateMutations()
  const isEdit = !!template

  const [code, setCode] = useState(template?.code || '')
  const [name, setName] = useState(template?.name || '')
  const [category, setCategory] = useState(template?.category || 'general')
  const [subject, setSubject] = useState(template?.subject || '')
  const [body, setBody] = useState(template?.body || '')

  const valid = code.trim() && name.trim() && body.trim()
  const pending = create.isPending || update.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const data = { code, name, category, subject: subject || null, body }
    if (isEdit) {
      update.mutate({ id: template.id, data: { name, category, subject: subject || null, body } }, { onSuccess: () => onOpenChange(false) })
    } else {
      create.mutate(data, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Modifica los campos de la plantilla.' : 'Crea una plantilla de mensaje reutilizable.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="quote_sent" disabled={isEdit} className="font-mono text-sm" />
              <p className="text-[11px] text-muted-foreground">Identificador único, sin espacios</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cotización enviada" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Descripción corta" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Cuerpo del mensaje *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hola {cliente},..."
              rows={10}
              className="resize-y font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Variables: {'{cliente}'}, {'{equipo}'}, {'{codigo}'}, {'{total}'}, {'{fecha}'}, {'{taller}'}, {'{telefono}'}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={!valid || pending}>{pending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear plantilla'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============== History Tab ==============
function HistoryTab() {
  const { navigate } = useAppStore()
  const { data: messages, isLoading } = useWhatsAppMessages({ limit: 50 })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <History className="size-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">No hay mensajes enviados</p>
            <p className="text-sm text-muted-foreground">Los mensajes que envíes aparecerán aquí</p>
          </div>
          <Button variant="outline" className="gap-1.5" onClick={() => navigate('whatsapp')}>
            <Send className="size-4" /> Enviar primer mensaje
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {messages.map((msg: any) => (
        <Card key={msg.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="size-10 shrink-0">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-900 dark:text-emerald-300">
                  {getInitials(msg.toName || msg.customer ? fullName(msg.customer?.firstName, msg.customer?.lastName) : '?')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <button
                      className="text-sm font-medium hover:underline"
                      onClick={() => navigate('customer-detail', { customerId: msg.customerId })}
                    >
                      {msg.toName || (msg.customer ? fullName(msg.customer.firstName, msg.customer.lastName) : 'Cliente')}
                    </button>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="size-3" /> {msg.toPhone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {msg.template && <Badge variant="outline" className="text-[10px]">{msg.template.name}</Badge>}
                    {msg.workOrder && (
                      <button
                        className="font-mono text-[10px] text-muted-foreground hover:underline"
                        onClick={() => navigate('work-order-detail', { workOrderId: msg.workOrderId })}
                      >
                        {msg.workOrder.code}
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo(msg.sentAt)}</span>
                  </div>
                </div>
                <div className="mt-2 rounded-md border bg-emerald-50/50 p-2.5 dark:bg-emerald-950/20">
                  <p className="whitespace-pre-wrap text-xs">{msg.message}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
