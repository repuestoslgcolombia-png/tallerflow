'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, Search, Plus, Command } from 'lucide-react'
import { useAppStore, type View } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme'
import { NotificationBell } from '@/components/tallerflow/notification-bell'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Laptop,
  FileText,
  Receipt,
  Package,
  Bell,
  MessageCircle,
  Settings,
} from 'lucide-react'

const VIEW_TITLES: Record<View, { title: string; subtitle: string }> = {
  'daily-agenda': { title: 'Flujo Diario', subtitle: 'Agenda, tareas y alertas del día' },
  dashboard: { title: 'Flujo Diario', subtitle: 'Agenda, tareas y alertas del día' },
  'quick-register': { title: 'Captación Rápida', subtitle: 'Registro exprés de cliente y orden de servicio' },
  'work-orders': { title: 'Órdenes de Trabajo', subtitle: 'Gestiona el flujo de reparaciones' },
  'work-order-detail': { title: 'Detalle de Orden', subtitle: 'Información completa de la orden' },
  customers: { title: 'Clientes', subtitle: 'Administra tu cartera de clientes' },
  'customer-detail': { title: 'Detalle de Cliente', subtitle: 'Historial y equipos del cliente' },
  devices: { title: 'Equipos', subtitle: 'Inventario de equipos registrados' },
  quotes: { title: 'Cotizaciones', subtitle: 'Cotizaciones enviadas y aprobaciones' },
  invoices: { title: 'Facturas', subtitle: 'Facturación y registro de pagos' },
  inventory: { title: 'Inventario', subtitle: 'Control de repuestos y stock' },
  reminders: { title: 'Recordatorios', subtitle: 'Seguimiento post-servicio a clientes' },
  whatsapp: { title: 'WhatsApp', subtitle: 'Mensajería y plantillas de comunicación' },
  settings: { title: 'Configuración', subtitle: 'Ajustes del taller' },
}

// Quick navigation items for command palette
const QUICK_NAV = [
  { view: 'dashboard' as View, label: 'Flujo Diario', icon: LayoutDashboard, hint: 'Agenda y tareas del día' },
  { view: 'work-orders' as View, label: 'Órdenes de Trabajo', icon: ClipboardList, hint: 'Ver todas las órdenes' },
  { view: 'customers' as View, label: 'Clientes', icon: Users, hint: 'Gestión de clientes' },
  { view: 'devices' as View, label: 'Equipos', icon: Laptop, hint: 'Inventario de equipos' },
  { view: 'quotes' as View, label: 'Cotizaciones', icon: FileText, hint: 'Cotizaciones y aprobaciones' },
  { view: 'invoices' as View, label: 'Facturas', icon: Receipt, hint: 'Facturación y pagos' },
  { view: 'inventory' as View, label: 'Repuestos', icon: Package, hint: 'Inventario de repuestos' },
  { view: 'reminders' as View, label: 'Recordatorios', icon: Bell, hint: 'Seguimiento post-servicio' },
  { view: 'whatsapp' as View, label: 'WhatsApp', icon: MessageCircle, hint: 'Mensajería y plantillas' },
  { view: 'settings' as View, label: 'Configuración', icon: Settings, hint: 'Ajustes del taller' },
]

export function Header() {
  const { currentView, toggleSidebar, navigate } = useAppStore()
  const info = VIEW_TITLES[currentView]
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Atajo de teclado: Cmd/Ctrl + K abre la paleta de comandos
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
      if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen])

  // Focus en el input cuando se abre la paleta
  useEffect(() => {
    if (paletteOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [paletteOpen])

  const handlePaletteChange = (open: boolean) => {
    setPaletteOpen(open)
    if (!open) setSearch('')
  }

  const filteredNav = QUICK_NAV.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.hint.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:gap-3 sm:px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>

        <div className="min-w-0 flex-1 flex-col">
          <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">{info?.title ?? 'TallerFlow'}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{info?.subtitle ?? ''}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Botón de búsqueda global (command palette) */}
          <Button
            variant="outline"
            size="sm"
            className="hidden h-9 gap-2 px-2 text-muted-foreground md:flex"
            onClick={() => setPaletteOpen(true)}
            aria-label="Buscar (Ctrl+K)"
          >
            <Search className="size-4" />
            <span className="hidden lg:inline">Buscar...</span>
            <kbd className="ml-1 hidden items-center gap-0.5 rounded border bg-muted px-1 py-0.5 text-[10px] font-medium lg:flex">
              <Command className="size-2.5" />K
            </kbd>
          </Button>

          {/* Icono de búsqueda en móvil */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 md:hidden"
            onClick={() => setPaletteOpen(true)}
            aria-label="Buscar"
          >
            <Search className="size-5" />
          </Button>

          <ThemeToggle />

          <NotificationBell />

          <Button
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => navigate('work-orders')}
            aria-label="Nueva orden"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nueva Orden</span>
          </Button>

          <Avatar className="hidden size-9 border sm:flex">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              CM
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Command Palette / Búsqueda global */}
      <Dialog open={paletteOpen} onOpenChange={handlePaletteChange}>
        <DialogContent className="top-[15%] gap-0 p-0 sm:max-w-[520px]" onKeyDown={(e) => {
          if (e.key === 'Enter' && filteredNav.length > 0) {
            navigate(filteredNav[0].view)
            setPaletteOpen(false)
          }
        }}>
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar módulos, órdenes, clientes..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Navegación rápida
            </p>
            {filteredNav.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.view}
                      onClick={() => {
                        navigate(item.view)
                        setPaletteOpen(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.hint}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity hover:opacity-100">
                        ↵
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
