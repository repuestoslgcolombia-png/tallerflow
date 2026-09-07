# TallerFlow — Grafo de Conocimiento del Repositorio (artefacto F0)

> **Fuente:** GitNexus v1.6.11 — índice del repo (40.022 símbolos, 98.472 relaciones, 1.193 clústeres, 688 flujos de ejecución) + inventario estático verificado 2026-09-07.
> **Propósito:** briefing compartido de todos los agentes/expertos del lanzamiento SaaS. Regenerar tras el refactor multi-tenant: `bunx gitnexus@1.6.11 analyze`.
> **Estado main:** commit `56b99f5` (portal del cliente + smoke fix + security chore). Smoke test **77/77 OK** contra dev local.

## 1. Mapa de la aplicación (17 vistas SPA)

Ruta única `/` (SPA). Zustand `currentView` en `src/app/page.tsx` decide el módulo. Excepciones públicas en la misma ruta vía query params: `/?quote=<id>&token=<token>` (aprobación de cotización) y `/?portal=<token>` (portal del cliente, nuevo F0).

| Vista | Módulo (`src/modules/`) | Modelos que toca |
|---|---|---|
| daily-agenda, dashboard | daily-agenda, dashboard | dailyTask, workOrder, invoice, part, reminder |
| quick-register | quick-register | customer, device, workOrder (creación 1-shot) |
| customers, customer-detail | customers | customer, device, portalToken |
| devices | devices | device |
| work-orders, work-order-detail | work-orders | workOrder, quote, invoice, part (movimientos) |
| quotes | quotes | quote, quoteItem, workshopSetting |
| invoices | invoices | invoice, payment, workOrder |
| inventory | inventory | part, inventoryMovement |
| guides | guides | repairGuide |
| reminders | reminders | reminder, whatsAppMessage |
| scheduled-services | scheduled-services | reminder, workOrder |
| whatsapp | whatsapp | whatsAppTemplate, whatsAppMessage, connection, automationRule |
| automations | automations | automationRule, automationLog |
| settings | settings | workshopSetting, user |

## 2. API (22 grupos, 40+ handlers)

Raíz `src/app/api/`: accounting, assistant (chat/confirm), customers, daily-agenda, daily-tasks, dashboard, **debug/redis-status** ⚠️, devices, guides (+suggestions), invoices, notifications, parts, **portal** (nuevo), quick-register, quotes (+approve), reminders, scheduled-services, settings, users, whatsapp (automations, connection, messages, render, templates, invoices).

- Convención: `ok()/badRequest()/notFound()/serverError()` de `src/lib/api.ts`. Handlers con action-dispatch en PUT/PATCH (`{action:'change_status'|'adjust_stock'|...}`).
- **⚠️ Hotspot P0:** ningún handler valida sesión. `debug/redis-status` expone estado interno sin guard. El flujo `quotes/[id]/approve` y `portal/[token]` son los ÚNICOS endpoints deliberadamente públicos (token-based).
- Codificación de documentos: `WorkshopSetting.counter*` (OT/COT/FAC-YYYY-NNN) — **hotspot multi-tenant**: contadores pasan a ser por-taller (`@@unique([tenantId, code])`).
- WhatsApp: `lib/automations.ts` ejecuta reglas trigger→acción (envío directo + recordatorios diferidos).

## 3. Hermes (asistente IA)

`src/lib/assistant/`: agent.ts (modelo OpenRouter/Groq vía `getModel()`), tools.ts (13 tools, `jsonSchema()` plano, nunca zodSchema), executor.ts (11 acciones de escritura), pending.ts (store Redis TTL 1h — **ya migrado a Redis** en main, `lib/redis.ts` singleton ioredis). Widget global en layout.tsx. Streaming NDJSON. Endpoints `/api/assistant/*` ⚠️ sin rate-limit → costo LLM expuesto.

## 4. Infra y configuración

- **Next 16** + Turbopack, React 19, strict mode OFF, `ignoreBuildErrors: true`, noImplicitAny false.
- **Prisma 6.19** + Neon Postgres (`DATABASE_URL`, `DIRECT_URL`). `src/lib/db.ts` ⚠️ credenciales hardcodeadas (P0 F1) + cache-bust por mtime del cliente.
- **Supabase**: helpers SSR listos (`src/utils/supabase/`) pero **auth NO cableada** — no existe login, ni guard, ni `supabase.auth` en el código. Solo middleware de refresco de sesión.
- **Redis**: `REDIS_URL` (Upstash) en uso real (Hermes pendientes + L0 logging streams).
- **Vercel**: proyecto vinculado `tallerflow` (team `team_ZHH...`, Node 24). `vercel.json` solo buildCommand. Sin crons. Deploy previo existe: `tallerflow-gilt.vercel.app`.
- Env vars requeridas: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_GROQ_API_KEY`.
- Quirk Windows: `next build` con dev server vivo → EPERM `query_engine-windows.dll.node`. Detener dev antes de build.

## 5. Modelo de dominio (19 modelos)

Núcleo operativo: **Customer → Device → WorkOrder → Diagnosis → Quote → Invoice → Payment**. Soporte: Part/InventoryMovement, RepairGuide, Reminder, DailyTask, WhatsApp*, AutomationRule/Log, AuditLog, MonthlyAccounting, WorkshopSetting, PortalToken.

- Flujos por serviceType (`lib/constants.ts`): `revision` = 3 estados (received→approved→delivered); `mantenimiento/instalacion` = cortos; resto = flujo completo 8 estados.
- `WorkshopSetting.id = "default"` — single-tenant por diseño actual.
- Enums como Strings libres (no Prisma enums) —-documentado en comentarios del schema.

## 6. Deuda técnica conocida (pre-lanzamiento)

1. **Seguridad P0:** APIs abiertas (sin auth), credenciales en `db.ts`+`.env` (este ya desversionado, pero el historial git los retiene), PAT GitHub en URL del remote, `/api/debug` expuesto.
2. **Single-tenant:** sin `tenantId`, sin ACL de roles real (`role` es String decorativo), WorkshopSetting singleton.
3. TS `ignoreBuildErrors` — se pueden colar errores de tipos al build.
4. WhatsApp: integración simulada/QR no oficial (Cloud API queda como roadmap).
5. Sin CI pipeline (`.github/workflows/` vacío), sin tests automatizados (solo smoke script), sin backups.

## 7. Hotspots del refactor multi-tenant (F2) — mapeados

| Área | Cambio | Símbolos afectados (blast radius) |
|---|---|---|
| Schema Prisma | `Tenant`, `TenantUser`, `tenantId` en 10+ modelos, `@@unique([tenantId, code|sku])` | Todos los handlers que usan `db.<modelo>` |
| `src/lib/db.ts` | Exportar `db` + `dbFor(tenantId)` (extensión withTenant) | 40+ handlers, `lib/hooks/api.ts` (nuevo header/contexto) |
| Contadores | `WorkshopSetting.counter*` → por tenant, transaccional | work-orders, quotes, invoices (POST create) |
| Handlers | `requireTenantSession()` como primera línea | Los 40+ handlers |
| Públicos | portal/[token], quotes/[id]/approve: resolver tenant vía registro (ya aislado por token) | Solo lectura del settings del tenant correcto (`workshopSetting.findUnique({id:'default'})` → por tenant) |
| Hermes | tools de lectura + executor con tenant de la sesión | `tools.ts` (13), `executor.ts` (11 acciones) |
| Dashboard/agenda | Queries agregadas + filtros por tenant | daily-agenda, dashboard, notifications |

## 8. Reglas del grafo (obligatorias para agentes)

- Antes de editar un símbolo: `bunx gitnexus@1.6.11 impact "nombre" --direction upstream`. Riesgo UNKNOWN ≠ seguro — confirmar con búsqueda de texto.
- Antes de commit: `bunx gitnexus@1.6.11 detect-changes --scope all` (limpio = sin `partial:true`/`truncated:true`).
- NUNCA find-and-replace para renombrar; usar tool `rename`.
- Índice stale tras commits: re-ejecutar `analyze` cuando el AGENTS.md lo indique.
