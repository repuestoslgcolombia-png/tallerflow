import { create } from 'zustand'

export type View =
  | 'daily-agenda'
  | 'dashboard'
  | 'quick-register'
  | 'customers'
  | 'customer-detail'
  | 'devices'
  | 'work-orders'
  | 'work-order-detail'
  | 'quotes'
  | 'invoices'
  | 'inventory'
  | 'guides'
  | 'reminders'
  | 'scheduled-services'
  | 'whatsapp'
  | 'automations'
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
  selectedInvoiceId: string | null
  selectedReminderId: string | null

  // Filtros contextuales
  workOrderStatusFilter: string | null
  workOrderCustomerFilter: string | null
  reminderStatusFilter: string | null
  invoiceStatusFilter: string | null

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
  invoiceId?: string
  reminderId?: string
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
  selectedInvoiceId: null,
  selectedReminderId: null,

  workOrderStatusFilter: null,
  workOrderCustomerFilter: null,
  reminderStatusFilter: null,
  invoiceStatusFilter: null,

  navigate: (view, opts = {}) =>
    set({
      currentView: view,
      sidebarOpen: false,
      selectedCustomerId: opts.customerId ?? null,
      selectedWorkOrderId: opts.workOrderId ?? null,
      selectedQuoteId: opts.quoteId ?? null,
      selectedPartId: opts.partId ?? null,
      selectedInvoiceId: opts.invoiceId ?? null,
      selectedReminderId: opts.reminderId ?? null,
      workOrderStatusFilter: opts.statusFilter ?? null,
      workOrderCustomerFilter: opts.customerFilter ?? null,
    }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
}))
