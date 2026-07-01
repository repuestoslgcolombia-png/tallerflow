'use client'

import { Sidebar } from '@/components/tallerflow/sidebar'
import { Header } from '@/components/tallerflow/header'
import { useAppStore } from '@/store/app-store'
import { DashboardView } from '@/modules/dashboard/dashboard-view'
import { CustomersView } from '@/modules/customers/customers-view'
import { CustomerDetailView } from '@/modules/customers/customer-detail-view'
import { DevicesView } from '@/modules/devices/devices-view'
import { WorkOrdersView } from '@/modules/work-orders/work-orders-view'
import { WorkOrderDetailView } from '@/modules/work-orders/work-order-detail-view'
import { QuotesView } from '@/modules/quotes/quotes-view'
import { InvoicesView } from '@/modules/invoices/invoices-view'
import { InventoryView } from '@/modules/inventory/inventory-view'
import { RemindersView } from '@/modules/reminders/reminders-view'
import { SettingsView } from '@/modules/settings/settings-view'

export default function HomePage() {
  const { currentView } = useAppStore()

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'customers' && <CustomersView />}
            {currentView === 'customer-detail' && <CustomerDetailView />}
            {currentView === 'devices' && <DevicesView />}
            {currentView === 'work-orders' && <WorkOrdersView />}
            {currentView === 'work-order-detail' && <WorkOrderDetailView />}
            {currentView === 'quotes' && <QuotesView />}
            {currentView === 'invoices' && <InvoicesView />}
            {currentView === 'inventory' && <InventoryView />}
            {currentView === 'reminders' && <RemindersView />}
            {currentView === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>

      <footer className="mt-auto border-t bg-background px-4 py-3 lg:px-6">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>
            <span className="font-medium text-foreground">TallerFlow</span> · Sistema de gestión de talleres
          </p>
          <p>v1.1 MVP · © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
