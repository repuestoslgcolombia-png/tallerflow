'use client'

import { Sidebar } from '@/components/tallerflow/sidebar'
import { Header } from '@/components/tallerflow/header'
import { useAppStore } from '@/store/app-store'
import { DailyAgendaView } from '@/modules/daily-agenda/daily-agenda-view'
import { DashboardView } from '@/modules/dashboard/dashboard-view'
import { CustomersView } from '@/modules/customers/customers-view'
import { CustomerDetailView } from '@/modules/customers/customer-detail-view'
import { DevicesView } from '@/modules/devices/devices-view'
import { WorkOrdersView } from '@/modules/work-orders/work-orders-view'
import { WorkOrderDetailView } from '@/modules/work-orders/work-order-detail-view'
import { QuotesView } from '@/modules/quotes/quotes-view'
import { InvoicesView } from '@/modules/invoices/invoices-view'
import { InventoryView } from '@/modules/inventory/inventory-view'
import { GuidesView } from '@/modules/guides/guides-view'
import { RemindersView } from '@/modules/reminders/reminders-view'
import { WhatsAppView } from '@/modules/whatsapp/whatsapp-view'
import { AutomationsView } from '@/modules/automations/automations-view'
import { SettingsView } from '@/modules/settings/settings-view'
import { QuickRegisterView } from '@/modules/quick-register/quick-register-view'

export default function HomePage() {
  const { currentView } = useAppStore()

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            {(currentView === 'daily-agenda' || currentView === 'dashboard') && <DailyAgendaView />}
            {currentView === 'quick-register' && <QuickRegisterView />}
            {currentView === 'customers' && <CustomersView />}
            {currentView === 'customer-detail' && <CustomerDetailView />}
            {currentView === 'devices' && <DevicesView />}
            {currentView === 'work-orders' && <WorkOrdersView />}
            {currentView === 'work-order-detail' && <WorkOrderDetailView />}
            {currentView === 'quotes' && <QuotesView />}
            {currentView === 'invoices' && <InvoicesView />}
            {currentView === 'inventory' && <InventoryView />}
            {currentView === 'guides' && <GuidesView />}
            {currentView === 'reminders' && <RemindersView />}
            {currentView === 'whatsapp' && <WhatsAppView />}
            {currentView === 'automations' && <AutomationsView />}
            {currentView === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>

      <footer className="safe-bottom mt-auto border-t bg-background px-4 py-3 lg:px-6">
        <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>
            <span className="font-semibold text-primary">TallerFlow</span> · Gestión de talleres de electrodomésticos
          </p>
          <p>v1.3 · © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}
