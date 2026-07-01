'use client'

import { Menu, Search, Bell, Plus } from 'lucide-react'
import { useAppStore, type View } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const VIEW_TITLES: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen operativo del taller' },
  'work-orders': { title: 'Órdenes de Trabajo', subtitle: 'Gestiona el flujo de reparaciones' },
  'work-order-detail': { title: 'Detalle de Orden', subtitle: 'Información completa de la orden' },
  customers: { title: 'Clientes', subtitle: 'Administra tu cartera de clientes' },
  'customer-detail': { title: 'Detalle de Cliente', subtitle: 'Historial y equipos del cliente' },
  devices: { title: 'Equipos', subtitle: 'Inventario de equipos registrados' },
  quotes: { title: 'Cotizaciones', subtitle: 'Cotizaciones enviadas y aprobaciones' },
  inventory: { title: 'Inventario', subtitle: 'Control de repuestos y stock' },
  settings: { title: 'Configuración', subtitle: 'Ajustes del taller' },
}

export function Header() {
  const { currentView, toggleSidebar, navigate } = useAppStore()
  const info = VIEW_TITLES[currentView]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex flex-col">
        <h1 className="text-base font-semibold leading-tight sm:text-lg">{info.title}</h1>
        <p className="hidden text-xs text-muted-foreground sm:block">{info.subtitle}</p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="h-9 w-56 pl-9 lg:w-64"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500" />
        </Button>

        <Button size="sm" className="gap-1.5" onClick={() => navigate('work-orders')}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nueva Orden</span>
        </Button>

        <Avatar className="size-9 border">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            CM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
