'use client'

import {
  LayoutDashboard,
  Users,
  Laptop,
  ClipboardList,
  FileText,
  Package,
  Settings,
  Wrench,
  X,
  Bell,
  Receipt,
  MessageCircle,
} from 'lucide-react'
import { useAppStore, type View } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface NavItem {
  id: View
  label: string
  icon: typeof LayoutDashboard
  description: string
  group: 'operation' | 'admin'
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Vista general', group: 'operation' },
  { id: 'work-orders', label: 'Órdenes', icon: ClipboardList, description: 'Órdenes de trabajo', group: 'operation' },
  { id: 'customers', label: 'Clientes', icon: Users, description: 'Gestión de clientes', group: 'operation' },
  { id: 'devices', label: 'Equipos', icon: Laptop, description: 'Inventario de equipos', group: 'operation' },
  { id: 'quotes', label: 'Cotizaciones', icon: FileText, description: 'Cotizaciones y aprobaciones', group: 'operation' },
  { id: 'invoices', label: 'Facturas', icon: Receipt, description: 'Facturación y pagos', group: 'operation' },
  { id: 'reminders', label: 'Recordatorios', icon: Bell, description: 'Seguimiento post-servicio', group: 'operation' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Mensajería y plantillas', group: 'operation' },
  { id: 'inventory', label: 'Inventario', icon: Package, description: 'Repuestos y stock', group: 'admin' },
  { id: 'settings', label: 'Configuración', icon: Settings, description: 'Ajustes del taller', group: 'admin' },
]

export function Sidebar() {
  const { currentView, sidebarOpen, navigate, setSidebar } = useAppStore()

  return (
    <>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebar(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-[300px] flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 ease-in-out lg:static lg:w-72 lg:max-w-none lg:translate-x-0 lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header del sidebar */}
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Wrench className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight">TallerFlow</span>
              <span className="text-[11px] text-muted-foreground leading-tight">Gestión de talleres</span>
            </div>
          </div>
          <button
            onClick={() => setSidebar(false)}
            className="rounded-md p-1.5 hover:bg-sidebar-accent lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Operación
          </p>
          {NAV_ITEMS.filter((i) => i.group === 'operation').map((item) => {
            const Icon = item.icon
            const active = currentView === item.id ||
              (item.id === 'customers' && currentView === 'customer-detail') ||
              (item.id === 'work-orders' && currentView === 'work-order-detail')

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className={cn('size-4.5 shrink-0', active ? '' : 'text-muted-foreground group-hover:text-foreground')} />
                <div className="flex flex-col items-start">
                  <span>{item.label}</span>
                  <span className={cn('text-[11px] font-normal', active ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {item.description}
                  </span>
                </div>
              </button>
            )
          })}
          <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Gestión
          </p>
          {NAV_ITEMS.filter((i) => i.group === 'admin').map((item) => {
            const Icon = item.icon
            const active = currentView === item.id

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className={cn('size-4.5 shrink-0', active ? '' : 'text-muted-foreground group-hover:text-foreground')} />
                <div className="flex flex-col items-start">
                  <span>{item.label}</span>
                  <span className={cn('text-[11px] font-normal', active ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {item.description}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="border-t p-4">
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="text-xs font-semibold text-sidebar-foreground">TallerTech Pro</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Bogotá, Colombia</p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Sistema operativo
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
