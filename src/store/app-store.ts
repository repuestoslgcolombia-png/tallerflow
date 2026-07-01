import { create } from 'zustand'

export type View =
  | 'dashboard'
  | 'customers'
  | 'customer-detail'
  | 'devices'
  | 'work-orders'
  | 'work-order-detail'
  | 'quotes'
  | 'inventory'
  | 'settings'

interface AppState {
  // Navegación
  currentView: View
  sidebarOpen: boolean

  // IDs seleccionados (para vistas detalle)
  selectedCustomerId: string | null
  selectedWorkOrderId: string | null
  selectedQuoteId: string | null
  selectedPartId: string | null

  // Filtros contextuales
  workOrderStatusFilter: string | null
  workOrderCustomerFilter: string | null

  // Acciones
  navigate: (view: View, opts?: NavigateOptions) => void
  toggleSidebar: () => void
  setSidebar: (open: boolean) => void
}

interface NavigateOptions {
  customerId?: string
  workOrderId?: string
  quoteId?: string
  partId?: string
  statusFilter?: string | null
  customerFilter?: string | null
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  sidebarOpen: false,

  selectedCustomerId: null,
  selectedWorkOrderId: null,
  selectedQuoteId: null,
  selectedPartId: null,

  workOrderStatusFilter: null,
  workOrderCustomerFilter: null,

  navigate: (view, opts = {}) =>
    set({
      currentView: view,
      sidebarOpen: false,
      selectedCustomerId: opts.customerId ?? null,
      selectedWorkOrderId: opts.workOrderId ?? null,
      selectedQuoteId: opts.quoteId ?? null,
      selectedPartId: opts.partId ?? null,
      workOrderStatusFilter: opts.statusFilter ?? null,
      workOrderCustomerFilter: opts.customerFilter ?? null,
    }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
}))
