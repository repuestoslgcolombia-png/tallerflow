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
| Asistente IA | `ai` (Vercel AI SDK) + `@ai-sdk/openai` | Streaming LLM, function calling, acciones confirmadas |
| LLM | OpenRouter → `deepseek/deepseek-chat` (fallback Groq `llama-3.3-70b`) | DeepSeek vía OpenRouter, sin API propia |

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
      assistant/                # Chat Hermes (streaming) + confirmación de acciones
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
    assistant/                  # Widget flotante Hermes (chat + confirmaciones)
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

## Módulo Asistente IA (Hermes)

**Hermes** es un asistente virtual que chatea con el dueño del taller en español y gestiona datos reales: consulta el estado del taller y ejecuta acciones de escritura (siempre con confirmación previa del usuario). Vive en un widget flotante global (`src/modules/assistant/assistant-widget.tsx`) montado en el root layout, visible en todas las vistas.

### Componentes

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/app/api/assistant/chat/route.ts` | POST: streaming NDJSON; GET: health check |
| `src/app/api/assistant/confirm/route.ts` | Ejecuta la `PendingAction` confirmada |
| `src/lib/assistant/agent.ts` | `getModel()` (OpenRouter/Groq), system prompt, `streamText` + NDJSON |
| `src/lib/assistant/tools.ts` | 12 tools de lectura + `proponerAccion`; `WRITE_ACTIONS` enum |
| `src/lib/assistant/executor.ts` | `executeAction()` — 11 acciones de escritura con validación |
| `src/lib/assistant/pending.ts` | Store de pendientes en `globalThis` (TTL 1h) |
| `src/modules/assistant/assistant-widget.tsx` | Chat, chips, confirmar/cancelar, resultado con navegación |

### Flujo de escritura (seguro por diseño)

1. El usuario pide una acción (crear cliente, orden, recordatorio, etc.).
2. El modelo llama `proponerAccion` — NO ejecuta nada, solo registra la `PendingAction` (TTL 1h).
3. El widget muestra una tarjeta amber **Confirmar/Cancelar**.
4. El usuario confirma → `POST /api/assistant/confirm` → `executeAction()` → resultado verde con link para navegar al detalle.

### Wire format NDJSON

`{type:'text', delta}` · `{type:'pending', pendingId, action, entity, resumen}` · `{type:'error'}` · `{type:'done'}`

### Modelo y proveedor

- `AI_PROVIDER=openrouter` → OpenRouter con `deepseek/deepseek-chat` (fallback si `AI_MODEL` no está definido).
- `AI_PROVIDER=groq` → Groq con `llama-3.3-70b-versatile`.
- Env vars en `.env.local`: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_GROQ_API_KEY`.

### Limitaciones v1 (conocidas, diferidas para futuras fases)

- ⚠️ **Pendientes efímeros**: `PendingAction` vive en `globalThis.__hermesPendingStore` con TTL 1h. No persiste entre restarts del dev server.
- ⚠️ **Sin memoria multi-sesión**: cada conversación comienza de cero. No hay reutilización de facts/conocimiento entre sesiones.
- ⚠️ **Single-user**: aceptable para MVP (solo tú), pero producción requerirá ACL + isolación de datos por usuario/sesión.
- ⚠️ **Sin auditoría formal**: solo logs NDJSON en streaming (volátiles). No hay tabla de auditoría duradera en Prisma.

### Arquitectura de memoria (4 capas) — Roadmap futuro

Inspirada en **TencentDB Agent Memory**, la arquitectura propuesta es:

```
┌─ L3: Core Knowledge ─────────────────────┐
│ Ground truth, merged facts, canónica      │
│ (Single source of truth for reuse)        │
└──────────────────────────────────────────┘
                      ↑
┌─ L2: Scenarios ──────────────────────────┐
│ Escenas de negocio (diagnóstico,         │
│ presupuesto, delivery), timeline          │
└──────────────────────────────────────────┘
                      ↑
┌─ L1: Atoms (Hechos Desnormalizados) ────┐
│ Facts reutilizables, embedding,          │
│ searchable, deduplicados semánticamente   │
└──────────────────────────────────────────┘
                      ↑
┌─ L0: Raw Recording (Redis Streams) ─────┐
│ JSON Lines completo, TTL 48h, auditoría  │
└──────────────────────────────────────────┘
```

**Fase 1 (Sprint 2, 1–2 días):** L0 — persistencia en Redis Streams (NDJSON crudo, recuperación, compliance).
**Fase 2 (Sprint 3, 3–4 días):** L1 — worker async extrae átomos, tabla `AIFactAtom`, búsqueda semántica.
**Fase 3+ (Diferir):** L2–L3, ACL, versionado de skills.
