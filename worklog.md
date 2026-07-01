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

---
Task ID: 2
Agent: orchestrator (main)
Task: Añadir módulos de Recordatorios y Facturas

Work Log:
- Extendí schema Prisma: añadí modelo Reminder (recordatorios post-servicio con tipo, canal, fecha, estado) e InvoiceItem (items de factura)
- Añadí relaciones inversas: Customer.reminders, WorkOrder.reminders, Invoice.items
- Ejecuté `bun run db:push` exitosamente
- Creé API routes: /api/reminders (GET, POST), /api/reminders/[id] (GET, PUT con actions: complete/snooze/cancel/reactivate, DELETE), /api/invoices (GET, POST con auto-cálculo desde items o cotización aprobada), /api/invoices/[id] (GET, PUT con actions: register_payment/cancel/mark_paid, DELETE)
- Actualicé /api/dashboard para incluir: remindersToday (top 5 recordatorios de hoy), totals.pendingReminders, totals.overdueReminders
- Añadí constantes: REMINDER_TYPES (5 tipos: follow_up, warranty_check, service_review, maintenance, custom con plantillas predeterminadas), REMINDER_STATUS, REMINDER_CHANNELS, PAYMENT_METHODS
- Actualicé badges.tsx: añadí ReminderStatusBadge, mejoré InvoiceStatusBadge con dot
- Añadí hooks: useReminders, useReminder, useReminderMutations (create/update/remove), useInvoices, useInvoice, useInvoiceMutations (create/update/remove)
- Actualicé store app-store.ts: añadí vistas 'invoices' y 'reminders', selectedInvoiceId, selectedReminderId, filtros
- Actualicé sidebar.tsx: añadí items Facturas y Recordatorios, separé en grupos "Operación" y "Gestión"
- Actualicé header.tsx: añadí títulos para invoices y reminders
- Actualicé page.tsx: añadí render de InvoicesView y RemindersView

Stage Summary:
- Backend completo para ambos módulos
- Faltan: vistas RemindersView, InvoicesView; actualización de DashboardView para mostrar recordatorios del día; actualización de WorkOrderDetailView para añadir botón "Generar Factura"
- Delego las vistas a subagents en paralelo (Task 2-A: Reminders + Dashboard update; Task 2-B: Invoices + WorkOrder update)

---
Task ID: 3
Agent: orchestrator (main)
Task: Finalización de módulos de Recordatorios y Facturas

Work Log:
- Creé src/modules/reminders/reminders-view.tsx: vista completa de recordatorios con stats (Pendientes Hoy, Vencidos, Pospuestos, Completados), filtros por estado, lista de cards con iconos por tipo, menú de acciones contextuales (completar, posponer, cancelar, reactivar, editar, eliminar), diálogos para crear/editar/completar/posponer con auto-llenado de plantillas según tipo
- Creé src/modules/invoices/invoices-view.tsx: vista completa de facturas con stats (Total, Pendientes, Pagadas, Ingresos del Mes), tabla con código/cliente/orden/equipo/estado/total/pagado, diálogos para crear factura desde orden (con items editables y cálculo de impuesto), ver detalle completo, registrar pagos parciales/totales, anular, eliminar
- Actualicé src/modules/work-orders/work-order-detail-view.tsx: añadí botón "Generar Factura" en el header (solo para órdenes entregadas sin factura), actualicé la tarjeta "Resumen Financiero" para mostrar info de factura si existe (código clickable, estado, total, pagado), añadí botón "Ver Factura" cuando ya existe, implementé componente CreateInvoiceFromOrderDialog que autocompleta items desde cotización aprobada o total de la orden
- Actualicé el dashboard (ya tenía soporte de recordatorios del subagent anterior) — verificado que muestra los 3 recordatorios de hoy correctamente
- Corregí bug de hooks llamados dentro de event handlers en reminders-view (moví useReminderMutations al top del componente)
- Añadí DialogClose al import en work-order-detail-view
- Silencié el console.log de db.ts que ensuciaba el dev.log
- Ejecuté seed de recordatorios (prisma/seed-reminders.ts): 8 recordatorios en distintos estados (3 pendientes hoy, 1 vencido, 1 pospuesto, 1 completado, 2 futuros)
- Verificación con Agent Browser:
  - Dashboard renderiza con KPIs + recordatorios de hoy ✓
  - Sidebar muestra los 2 nuevos módulos (Facturas, Recordatorios) agrupados en "Operación" ✓
  - Módulo Recordatorios: stats correctas, lista con 5 recordatorios pendientes, filtros funcionan ✓
  - Módulo Facturas: tabla con FAC-2024-001 (pagada), stats correctas ✓
  - Work Order Detail: botón "Generar Factura" aparece tras entregar orden ✓
  - Crear factura desde orden: diálogo autocompleta items desde cotización, cálculo de impuesto 19%, registro de pago ✓
  - Factura creada aparece en módulo de Facturas (FAC-2026-006) ✓
  - Diálogo crear recordatorio: auto-llenado de plantilla según tipo, fecha por defecto hoy+defaultDays ✓
  - Responsive móvil verificado ✓
  - Sin errores en consola ✓

Stage Summary:
- 2 módulos nuevos completos y funcionales: Recordatorios (seguimiento post-servicio) y Facturas (facturación y pagos)
- Integración con Work Order Detail: botón "Generar Factura" en órdenes entregadas
- Dashboard actualizado con tarjeta "Recordatorios de Hoy" (3 pendientes) + banner de vencidos
- 8 recordatorios seed en distintos estados para demostración
- Todos los flujos verificados end-to-end con Agent Browser
- Lint pasa sin errores

---
Task ID: 4
Agent: orchestrator (main)
Task: Integración de modo oscuro y optimización móvil

Work Log:
- Creé ThemeProvider con next-themes (src/components/theme/theme-provider.tsx) y ThemeToggle (src/components/theme/theme-toggle.tsx) con menú desplegable de 3 opciones: Claro, Oscuro, Sistema
- Actualicé layout.tsx: añadí ThemeProvider con attribute="class", storageKey="tallerflow-theme", enableSystem, disableTransitionOnChange. Añadí script anti-flash (inline en <head>) que aplica el tema antes de la hidratación para evitar parpadeo
- Mejoré globals.css significativamente:
  - Variables dark mode con tono azulado-grisáceo sutil (no negro puro) para mejor contraste
  - Primary color en dark mode: verde esmeralda (oklch 0.62 0.14 165) para coherencia con la marca
  - Scrollbars estilizadas (thin) con variables dedicadas para light/dark
  - Mejoras de contraste: placeholders de inputs en dark mode
  - Media queries para diálogos y dropdowns en móvil (ocupan casi toda la pantalla)
  - Safe area para iOS (notch/home indicator)
  - Tap targets mínimos de 40px en móvil
- Actualicé header.tsx: añadí ThemeToggle, mejoré responsive (gap reducido en móvil, avatar oculto en móvil, búsqueda oculta en móvil, truncado de título)
- Actualicé sidebar.tsx: ancho responsive (85vw max 300px en móvil), animación suave con duration-300, shadow-xl en móvil, overlay con bg-black/50
- Actualicé page.tsx: padding responsive (p-3 sm:p-4 lg:p-6), footer con safe-bottom para iOS
- Arreglé todas las tablas para scroll horizontal en móvil: envolví cada <Table> en <div className="overflow-x-auto"> en:
  - work-orders-view.tsx (tabla principal)
  - customers-view.tsx (tabla principal)
  - customer-detail-view.tsx (3 tablas: equipos, órdenes, facturas)
  - quotes-view.tsx (tabla principal + tabla de items del diálogo)
  - devices-view.tsx (tabla principal)
  - inventory-view.tsx (tabla principal)
- Verificación con Agent Browser:
  - Modo claro desktop: ✓ Dashboard, Órdenes, Detalle de Orden, Facturas, Inventario
  - Modo oscuro desktop: ✓ Dashboard, Órdenes, Detalle de Orden, Facturas
  - Modo oscuro móvil (390x844): ✓ Dashboard, Órdenes (con scroll horizontal), Recordatorios, Inventario
  - Diálogos en móvil: ✓ Crear recordatorio se abre correctamente
  - Toggle de tema: ✓ Cambio instantáneo entre Claro/Oscuro/Sistema
  - Persistencia: ✓ El tema se mantiene tras recargar (localStorage)
  - Anti-flash: ✓ Script en <head> previene parpadeo
  - Sin errores de consola en ningún modo

Stage Summary:
- Modo oscuro completamente funcional con 3 opciones (Claro/Oscuro/Sistema) y persistencia
- Paleta dark mode optimizada: fondo azulado-grisáceo sutil, primary verde esmeralda, scrollbars estilizadas
- Responsive móvil optimizado: sidebar con ancho fluido (85vw), tablas con scroll horizontal, diálogos a pantalla casi completa, tap targets mínimos, safe area iOS
- Todas las tablas de todos los módulos ahora tienen overflow-x-auto para scroll horizontal en móvil
- Lint pasa sin errores, verificación end-to-end con Agent Browser exitosa

---
Task ID: 5
Agent: orchestrator (main)
Task: Fusión con repo de GitHub + módulo de WhatsApp

Work Log:
- Cloné y analicé el repositorio https://github.com/arenaglomerante-cloud/taller.git
  - Es un proyecto skeleton/boilerplate con estructura modular, schema Prisma con enums (PostgreSQL), documentación completa (visión, roadmap, arquitectura) y CI/CD con GitHub Actions
  - No tenía módulo de WhatsApp implementado (solo mencionado en roadmap)
  - Nuestro TallerFlow ya tenía mucha más funcionalidad que el repo
- Fusioné la documentación del repo:
  - Actualicé docs/product/vision.md con estado actual (v1.2) y nuevas funcionalidades
  - Actualicé docs/tech/arquitectura.md con stack completo, modelos de datos y sección dedicada al módulo WhatsApp
  - Actualicé docs/product/roadmap-90-dias.md marcando Fases 1 y 2 como completadas
  - Creé .github/workflows/ci.yml adaptado a Bun
- Implementé el módulo de WhatsApp completo:
  - Schema Prisma: añadí modelos WhatsAppTemplate (plantillas con código, categoría, body, isSystem) y WhatsAppMessage (historial de envíos con relaciones a customer, workOrder, reminder, template)
  - Añadí relaciones inversas en Customer (messages), WorkOrder (messages), Reminder (whatsApp)
  - API Routes: 
    - /api/whatsapp/templates (GET, POST) + [id] (PUT, DELETE) — CRUD de plantillas
    - /api/whatsapp/messages (GET, POST) — historial y registro de envíos
    - /api/whatsapp/render (POST) — renderiza plantilla con variables ({cliente}, {equipo}, {codigo}, {total}, {fecha}, {taller}, {telefono})
  - Hooks de React Query: useWhatsAppTemplates, useWhatsAppTemplateMutations, useWhatsAppMessages, useWhatsAppMessageMutations, useWhatsAppRender, sendWhatsAppMessage (helper que abre wa.me y registra el envío), buildWhatsAppUrl
  - Vista WhatsAppView con 3 pestañas:
    - Enviar: formulario con selección de cliente, plantilla, mensaje editable, vista previa estilo WhatsApp, botón enviar (abre wa.me)
    - Plantillas: grid de tarjetas con búsqueda, filtro por categoría, CRUD completo (crear/editar/eliminar)
    - Historial: lista de mensajes enviados con cliente, teléfono, plantilla usada, orden vinculada, fecha
  - 10 plantillas del sistema (isSystem=true, no editables/eliminables): order_received, quote_sent, quote_approved, order_ready, order_delivered, follow_up, warranty_check, service_review, maintenance_reminder, custom_message
  - Cada plantilla tiene cuerpo con variables y formato WhatsApp (emojis, negritas con asteriscos)
- Actualicé store (app-store.ts): añadí vista 'whatsapp'
- Actualicé sidebar: añadí item WhatsApp con icono MessageCircle en grupo "Operación"
- Actualicé header: añadí título "WhatsApp" con subtítulo "Mensajería y plantillas de comunicación"
- Actualicé page.tsx: añadí render de WhatsAppView
- Verificación con Agent Browser:
  - Módulo WhatsApp carga con 3 pestañas ✓
  - Pestaña Enviar: selección de cliente (7 clientes), selección de plantilla (10 plantillas), renderizado de variables ({cliente}→"Andrés Quintero", {taller}→"TallerTech Pro") ✓
  - Pestaña Plantillas: 10 plantillas visibles, botones editar ✓
  - Pestaña Historial: vacía (sin envíos previos) con empty state ✓
  - Sin errores de consola ✓
  - APIs responden 200 ✓

Stage Summary:
- Documentación del repo de GitHub fusionada y actualizada al estado actual
- CI/CD de GitHub Actions añadido (adaptado a Bun)
- Módulo de WhatsApp completo: 10 plantillas del sistema, composición con vista previa, envío vía wa.me, historial, CRUD de plantillas personalizadas
- Variables dinámicas en plantillas: {cliente}, {equipo}, {codigo}, {total}, {fecha}, {taller}, {telefono}
- Lint pasa sin errores, verificación end-to-end exitosa
