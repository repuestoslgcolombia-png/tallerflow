# TallerFlow - Worklog de Desarrollo

## Contexto del Proyecto
**TallerFlow** es un sistema de gestión de talleres de reparación de equipos (computadores, celulares, impresoras). Es un MVP enfocado en los primeros 30 días del roadmap.

### Stack
- Next.js 16 App Router + TypeScript
- Prisma + SQLite
- shadcn/ui (New York) + Tailwind CSS 4
- React Query (server state) + Zustand (client state)
- Solo ruta `/` (SPA con navegación por estado)

### Arquitectura de Archivos
```
src/
  app/
    page.tsx                    # SPA shell (renderiza la vista activa)
    layout.tsx                  # Root layout con QueryProvider + Toaster
    api/                        # API Routes (REST)
      customers/route.ts + [id]/route.ts
      devices/route.ts + [id]/route.ts
      work-orders/route.ts + [id]/route.ts
      quotes/route.ts + [id]/route.ts + [id]/approve/route.ts
      parts/route.ts + [id]/route.ts
      dashboard/route.ts
      users/route.ts
      settings/route.ts
  components/
    ui/                         # shadcn/ui (YA EXISTEN - no tocar)
    providers/                  # QueryProvider
    tallerflow/                 # Componentes compartidos TallerFlow
      sidebar.tsx               # Navegación lateral
      header.tsx                # Header con título dinámico
      badges.tsx                # StatusBadge, PriorityBadge, etc.
  modules/                      # Vistas por módulo (A CREAR)
    dashboard/dashboard-view.tsx
    customers/customers-view.tsx
    customers/customer-detail-view.tsx
    devices/devices-view.tsx
    work-orders/work-orders-view.tsx
    work-orders/work-order-detail-view.tsx
    quotes/quotes-view.tsx
    inventory/inventory-view.tsx
    settings/settings-view.tsx
  store/
    app-store.ts                # Zustand store (navigate, currentView, selectedIds)
  lib/
    db.ts                       # Prisma client
    api.ts                      # Helpers ok(), badRequest(), serverError()
    constants.ts                # WORK_ORDER_STATUS, PRIORITY, formatCurrency, etc.
    hooks/api.ts                # Hooks de React Query (useCustomers, useWorkOrders, etc.)
```

### Estado del Desarrollo
- ✅ Schema Prisma definido y sincronizado (db:push ejecutado)
- ✅ Seed con 6 clientes, 6 equipos, 6 órdenes, 8 repuestos, 4 cotizaciones, 1 factura
- ✅ Todas las API routes creadas
- ✅ Layout principal (sidebar + header + footer) creado
- ✅ Store de navegación (app-store.ts) creado
- ✅ Hooks de API (lib/hooks/api.ts) creados
- ⏳ Vistas de módulos (PENDIENTE - delegado a subagents)

### Patrones a Seguir (IMPORTANTE)
1. **Imports**: `import { Button } from '@/components/ui/button'`, `import { useCustomers } from '@/lib/hooks/api'`, `import { WORK_ORDER_STATUS, formatCurrency } from '@/lib/constants'`
2. **Navegación**: `const { navigate } = useAppStore()` → `navigate('work-order-detail', { workOrderId: id })`
3. **Componentes shadcn disponibles**: button, card, input, label, textarea, select, dialog, sheet, table, badge, tabs, avatar, dropdown-menu, alert-dialog, separator, scroll-area, skeleton, progress, tooltip, popover, command, sonner (toast)
4. **Toasts**: `import { toast } from 'sonner'` para feedback
5. **Colores**: NO usar indigo/blue. Usar semantic tokens (bg-primary, text-foreground) o colores de Tailwind (emerald, amber, rose, sky, violet, teal, orange, slate)
6. **Tipos**: Los datos vienen de Prisma, usar `any` o tipos inferidos para simplificar
7. **Responsive**: Mobile-first, usar `sm:`, `md:`, `lg:` prefixes
8. **Footer**: Ya está en el layout principal (sticky). Las vistas no necesitan footer.

### API Hooks Disponibles (en src/lib/hooks/api.ts)
- `useCustomers(search)`, `useCustomer(id)`, `useCustomerMutations()` → { create, update, remove }
- `useDevices({ customerId?, search? })`, `useDeviceMutations()` → { create, update, remove }
- `useWorkOrders({ status?, search?, customerId?, technicianId? })`, `useWorkOrder(id)`, `useWorkOrderMutations()` → { create, update, patch, remove }
- `useQuotes({ workOrderId?, status? })`, `useQuoteMutations()` → { create, update, remove }
- `useParts({ search?, lowStock? })`, `usePart(id)`, `usePartMutations()` → { create, update }
- `useUsers()`, `useDashboard()`, `useSettings()`, `useSettingsMutation()`

### Constantes Disponibles (en src/lib/constants.ts)
- `WORK_ORDER_STATUS` - estados con label, color, dot, description, step
- `PRIORITY` - prioridades con label, color
- `DEVICE_TYPES` - tipos de equipo
- `QUOTE_STATUS`, `INVOICE_STATUS`, `USER_ROLES`, `MOVEMENT_TYPES`
- `STATUS_FLOW` - flujo de estados válidos
- `getNextStatuses(current)` - estados siguientes posibles
- `formatCurrency(amount, symbol?)`, `formatDate(date)`, `formatDateTime(date)`, `timeAgo(date)`
- `getInitials(name)`, `fullName(firstName, lastName)`

### Componentes de Badge Disponibles (en src/components/tallerflow/badges.tsx)
- `StatusBadge({ status })` - badge de estado de orden
- `PriorityBadge({ priority })` - badge de prioridad
- `QuoteStatusBadge({ status })`, `InvoiceStatusBadge({ status })`, `RoleBadge({ role })`

---
Task ID: 0
Agent: orchestrator (main)
Task: Setup inicial del proyecto TallerFlow

Work Log:
- Definí schema Prisma con 11 entidades del dominio (Customer, Device, WorkOrder, WorkOrderEvent, Diagnosis, Quote, QuoteItem, Part, InventoryMovement, Invoice, AuditLog, WorkshopSetting, User)
- Ejecuté `bun run db:push` para sincronizar schema con SQLite
- Creé seed con datos realistas: 4 usuarios (admin, 2 técnicos, recepción), 6 clientes, 6 equipos, 6 órdenes en distintos estados, 8 repuestos, 4 cotizaciones, 1 factura
- Creé todas las API routes REST para todas las entidades
- Creé el store de navegación con Zustand (app-store.ts)
- Creé hooks de React Query para todas las entidades (lib/hooks/api.ts)
- Creé el layout principal: Sidebar + Header + Footer (SPA shell en page.tsx)
- Creé componentes de badges reutilizables

Stage Summary:
- Base completa lista para que subagents construyan las vistas de módulos
- 9 vistas por crear: dashboard, customers (list+detail), devices, work-orders (list+detail), quotes, inventory, settings
- Las vistas deben seguir los patrones documentados arriba

---
Task ID: 1-C
Agent: full-stack-developer (WorkOrders + Quotes + Inventory)
Task: Construcción de las 4 vistas de Órdenes de Trabajo, Cotizaciones e Inventario

Work Log:
- Leí worklog.md y exploré el proyecto (page.tsx, app-store.ts, lib/hooks/api.ts, lib/constants.ts, badges.tsx, schema Prisma, componentes shadcn/ui disponibles) para entender patrones y APIs existentes
- Creé `src/modules/work-orders/work-orders-view.tsx`: vista de lista con toolbar (búsqueda + píldoras de filtro de estado horizontales + botón "Nueva Orden"), fila de 4 stat cards clickeables (Activas, En Diagnóstico, Por Aprobar, Listas Entrega), tabla con código mono, cliente (nombre+teléfono), equipo (icono+brand model+serial), StatusBadge, PriorityBadge, técnico (avatar inicial o "Sin asignar"), Recibida (timeAgo) y Total. Implementada navegación por fila. Respeta `workOrderStatusFilter` del store (con botón para limpiar). Diálogo de creación con selects para cliente/equipo/prioridad/técnico, textareas para problema reportado y notas internas, y fecha estimada. Filtra equipos por cliente seleccionado y muestra link "Registrar equipo" si no hay. Tras crear exitosamente, navega al detalle.
- Creé `src/modules/work-orders/work-order-detail-view.tsx`: vista detalle rica con grid lg:grid-cols-3. Header con código mono, badges, dropdown "Cambiar Estado" (solo estados válidos vía getNextStatuses), botón "Crear Cotización" y "Eliminar" (solo si received/cancelled, con AlertDialog). Columna izquierda (col-span-2): Card "Información de la Orden" con problema/diagnóstico/notas internas (destacadas en amber) + fechas, Card "Cliente y Equipo" en dos sub-paneles (cliente clickeable → customer-detail), Card "Timeline" con timeline vertical custom (línea + dots + iconos por eventType: CheckCircle2/MessageSquare/UserCog/FileText), Card "Cotizaciones" con cards individuales + botones Ver/Enviar/Link. Columna derecha: Card "Estado Actual" con StatusBadge + step indicator + Progress + botones de avance, Card "Técnico Asignado" con diálogo de asignación, Card "Resumen Financiero" con total/pagado/saldo + badge de pago, Card "Diagnóstico" (muestra diagnosis si existe o botón para agregar vía diagnosisText), Card "Repuestos Utilizados". 4 diálogos: Edit (problema, notas, prioridad, técnico, fecha estimada), CreateQuote (items dinámicos con tipo/descripción/cantidad/precio unit./total auto-calculado, +19% IVA, checkbox "Enviar inmediatamente"), AssignTech, Diagnosis (textarea que guarda a diagnosisText), ViewQuote (tabla de items + totales + copiar link).
- Creé `src/modules/quotes/quotes-view.tsx`: vista de lista con búsqueda + píldoras de estado + 4 stat cards (Total, Pendientes, Aprobadas, Valor aprobado). Tabla con código mono, cliente+code OT, equipo, QuoteStatusBadge, items count, total, vencimiento. Acciones por dropdown: Ver detalle (diálogo con tabla de items + totales + notas + validUntil + approvedBy + copiar link), Copiar link aprobación, Enviar (solo draft), Eliminar (solo no aprobadas con AlertDialog). Estados vacío/loading/error.
- Creé `src/modules/inventory/inventory-view.tsx`: vista de inventario con búsqueda + select de categoría (derivable de datos) + switch "Stock bajo" + botón "Nuevo Repuesto". 4 stat cards (Total repuestos, Stock bajo, Valor inventario=Σstock*unitCost, Valor venta potencial=Σstock*unitPrice). Tabla con SKU mono, nombre+descripción, categoría badge, stock (con dot color: rose si <=0, amber si <=minStock, emerald si ok) + unidad, stock mín., costo, venta, ubicación. Acciones: Ajustar stock (diálogo con input ±, botones +/-, tipo de movimiento auto-sugerido por signo pero editable, motivo textarea, preview de nuevo stock), Editar, Desactivar/Activar. Diálogo de create/edit con todos los campos (SKU, nombre, descripción, categoría con datalist, unidad select, stock inicial solo en create, minStock, unitCost, unitPrice, ubicación).
- Validé con `bunx eslint` que mis 4 archivos no tuvieran errores (los 2 errores de lint restantes son de archivos customers-view.tsx y devices-view.tsx de otro agente).
- Revisé dev.log: el único error de compilación restante es `@/modules/settings/settings-view` faltante (otro agente). Mis 4 archivos compilan limpios.

Stage Summary:
- 4 vistas completas y funcionales: WorkOrdersView (lista+create), WorkOrderDetailView (detalle con timeline/quotes/diagnóstico/financiero), QuotesView (lista+detalle), InventoryView (lista+ajuste stock+create/edit)
- Todas usan los hooks de React Query existentes (useWorkOrders, useWorkOrder, useWorkOrderMutations, useQuotes, useQuoteMutations, useParts, usePartMutations, useCustomers, useDevices, useUsers)
- Navegación vía Zustand store (navigate, selectedWorkOrderId, workOrderStatusFilter)
- Componentes shadcn/ui: Button, Card, Input, Label, Textarea, Select, Dialog, AlertDialog, DropdownMenu, Skeleton, Separator, Progress, Switch, Badge, Table, ScrollArea
- Badges reutilizables: StatusBadge, PriorityBadge, QuoteStatusBadge
- Iconos: ClipboardList, Plus, Search, Filter, ChevronRight, ArrowLeft, MoreHorizontal, Eye, Pencil, Trash2, FileText, Send, Copy, Check, X, CheckCircle2, MessageSquare, UserCog, Package, AlertTriangle, TrendingDown, ArrowUp, ArrowDown, Hash, MapPin, DollarSign, Link, History, Wrench, Clock, Calendar, User, Laptop, Smartphone, Cpu, Monitor, Tablet, Printer, Boxes, Wallet, ShoppingBag, Loader2, Settings
- Paleta de colores sin indigo/blue: emerald, amber, rose, sky, violet, teal, orange, slate
- Funciones helper usadas: formatCurrency, formatDate, formatDateTime, timeAgo, fullName, getNextStatuses, WORK_ORDER_STATUS, PRIORITY, DEVICE_TYPES, QUOTE_STATUS, MOVEMENT_TYPES
- Toasts de sonner para feedback (links copiados, cotizaciones enviadas, etc.)
- Copy to clipboard via navigator.clipboard.writeText con URL formato `${window.location.origin}/?quote=${id}&token=${approvalToken}`
- Mobile-first responsive en todas las vistas (grid sm:cols-2 / lg:cols-3 / lg:cols-4)
