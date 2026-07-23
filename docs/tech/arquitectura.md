# Arquitectura técnica — TallerFlow

## Visión general

TallerFlow es una aplicación web **full-stack monolítica** basada en Next.js App Router. Toda la lógica vive en un único repositorio para maximizar la velocidad de desarrollo.

```
┌─────────────────────────────────────────────────────┐
│                   Navegador / PWA                   │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────┐
│              Next.js App (Vercel)                   │
│  ┌──────────────┐  ┌─────────────────────────────┐  │
│  │  React UI    │  │   API Routes (REST)         │  │
│  │  (App Router)│  │   (src/app/api/...)         │  │
│  └──────────────┘  └──────────────┬──────────────┘  │
└─────────────────────────────────── │ ───────────────┘
                                     │
┌────────────────────────────────────▼───────────────┐
│              Prisma ORM                            │
└────────────────────────────────────┬───────────────┘
                                     │
┌────────────────────────────────────▼───────────────┐
│              SQLite (desarrollo) / PostgreSQL (prod)│
└─────────────────────────────────────────────────────┘
```

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | Next.js 16 (App Router) | SSR, API Routes, routing integrado |
| Lenguaje | TypeScript 5 | Tipado estático, menos bugs |
| Estilos | Tailwind CSS 4 | Productividad, diseño consistente |
| UI Components | shadcn/ui (New York) | Componentes accesibles y personalizables |
| Icons | lucide-react | Set de iconos moderno y ligero |
| ORM | Prisma 6 | Migraciones declarativas, tipos automáticos |
| Base de datos | SQLite (dev) / PostgreSQL (prod) | Relaciones complejas, fácil migración |
| Server State | TanStack Query (React Query) | Cache, invalidación, optimistic updates |
| Client State | Zustand | Estado de navegación y UI |
| Tema | next-themes | Modo oscuro/claro/sistema con persistencia |
| Notificaciones UI | sonner | Toasts elegantes y accesibles |
| Forms | react-hook-form + zod | Validación y manejo de formularios |

## Estructura de módulos

```
src/
  app/
    page.tsx                    # SPA shell (renderiza la vista activa)
    layout.tsx                  # Root layout con ThemeProvider + QueryProvider
    api/                        # API Routes REST
      customers/                # CRUD clientes
      devices/                  # CRUD equipos
      work-orders/              # CRUD órdenes + eventos + estados
      quotes/                   # CRUD cotizaciones + aprobación pública
      invoices/                 # CRUD facturas + pagos
      reminders/                # CRUD recordatorios + acciones
      parts/                    # CRUD repuestos + ajustes de stock
      whatsapp/                 # Plantillas y envío de mensajes
      dashboard/                # Métricas agregadas
      users/                    # Técnicos disponibles
      settings/                 # Configuración del taller
  components/
    ui/                         # shadcn/ui (componentes base)
    theme/                      # ThemeProvider + ThemeToggle
    tallerflow/                 # Componentes compartidos (sidebar, header, badges)
    providers/                  # QueryProvider
  modules/                      # Vistas por módulo
    dashboard/
    customers/
    devices/
    work-orders/
    quotes/
    invoices/
    inventory/
    reminders/
    whatsapp/                   # Vista de mensajes WhatsApp
    settings/
  store/
    app-store.ts                # Zustand store (navegación SPA)
  lib/
    db.ts                       # Prisma client (singleton con cache invalidation)
    api.ts                      # Helpers de respuesta HTTP
    constants.ts                # Constantes del dominio + helpers
    hooks/api.ts                # Hooks de React Query
```

## Modelos de datos principales

```
User ──────────────┐
                   │ technician
Customer ──────────┼──── WorkOrder ──── Quote ──── QuoteItem
    │              │         │           │
    │              │         │           └─── Part (referencia)
    └──── Device ──┘         │
                   │         ├─── WorkOrderEvent (timeline)
                   │         ├─── Diagnosis
                   │         ├─── Invoice ──── InvoiceItem
                   │         ├─── InventoryMovement
                   │         └─── Reminder
                   │
WorkshopSetting ──── Configuración global (impuestos, contadores, moneda)
```

## Convenciones

- **API Routes REST** para todas las operaciones (GET, POST, PUT, PATCH, DELETE).
- **Client Components** (`'use client'`) para todas las vistas (SPA con navegación por estado).
- **Zustand** para navegación entre vistas (sin routing de Next.js, solo ruta `/`).
- **React Query** para todo el estado del servidor (cache, refetch, mutations).
- **shadcn/ui** para todos los componentes de UI base.
- **Tailwind CSS** con semantic tokens (no colores hardcoded).
- **Modo oscuro**: usar variantes `dark:` o semantic tokens, nunca colores absolutos.

## Decisiones técnicas

| Decisión | Motivo |
|---------|--------|
| SPA con navegación por estado | UX más rápida (sin recargas), simpler deployment |
| SQLite en desarrollo | Cero configuración, fácil reseteo |
| Zustand sobre Context | Menos re-renders, API más simple |
| React Query sobre fetch manual | Cache automática, invalidación por keys |
| shadcn/ui sobre componentes custom | Accesibilidad lista, consistencia visual |
| next-themes sobre solución custom | Persistencia, anti-flash, soporte sistema |

## Módulo WhatsApp

El módulo de WhatsApp permite:

1. **Plantillas de mensajes** predefinidas para diferentes eventos (cotización enviada, equipo listo, seguimiento post-servicio, etc.)
2. **Envío directo** vía `https://wa.me/` (WhatsApp Web/API sin costos)
3. **Variables dinámicas** en plantillas (`{cliente}`, `{equipo}`, `{codigo}`, `{total}`, `{fecha}`)
4. **Integración con recordatorios**: cada recordatorio puede enviarse por WhatsApp con un clic
5. **Historial de mensajes** enviados por orden de trabajo
6. **Vista dedicada** con conversaciones recientes y plantillas

### Cómo funciona el envío

Por defecto, TallerFlow usa `https://wa.me/<numero>?text=<mensaje>` que abre WhatsApp Web/App con el mensaje pre-escrito. Esto no requiere API de WhatsApp Business y es gratis.

Para uso en producción a escala, se puede integrar la **WhatsApp Business API Cloud** de Meta (requiere token y número verificado). La arquitectura está preparada para este cambio.
