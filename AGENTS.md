# TallerFlow - AGENTS.md

## Commands
- Dev: `bun run dev` (port 3000, logs piped to `dev.log`)
- Lint: `bun run lint` (permissive ESLint config — most rules off)
- Build: `bun run build` (standalone output to `.next/standalone/`)
- DB sync: `bun run db:push` → then `bun run db:generate`
- DB reset: `bun run db:reset`
- CI: `bun install` → `bun run db:generate` → `bun run lint` → `bun run build`

## Architecture
- Single `/` SPA route (no Next.js pages/router). Zustand `currentView` drives which module renders in `src/app/page.tsx`.
- 13 views: daily-agenda, dashboard, customers, customer-detail, devices, work-orders, work-order-detail, quotes, invoices, inventory, reminders, whatsapp, settings. **Dashboard now renders DailyAgendaView** (has replaced the old dashboard).
- Navigation: `useAppStore().navigate('view-name', { workOrderId?: id, ... })`
- Server state: TanStack React Query. Hooks in `src/lib/hooks/api.ts`.
- DB: SQLite via Prisma. Schema in `prisma/schema.prisma` (15 models).
- UI: shadcn/ui New York, Tailwind CSS v4, `@/components/ui/` (already exist).

## Supabase Auth
- Supabase está configurado solo para autenticación (no reemplaza Prisma/SQLite).
- Helpers en `src/utils/supabase/`: `server.ts` (createServerClient), `client.ts` (createBrowserClient), `middleware.ts` (request client).
- `src/middleware.ts` refresca la sesión en cada request. El matcher excluye archivos estáticos.
- `.env.local` tiene las credenciales (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

## Important Quirks
- **React strict mode: OFF** (`next.config.ts`). Hooks may be called conditionally without warnings.
- **TypeScript errors ignored at build** (`ignoreBuildErrors: true`). `noImplicitAny: false`.
- **Colors: NO indigo/blue.** Use `PART_CATEGORIES` colors or tailwind: emerald, amber, rose, sky, violet, teal, orange, slate.
- **Locale: es-CO** for dates (`formatDate`, `formatDateTime`) and currency (`formatCurrency`).
- **All text in Spanish.** UI labels, constants, error messages are hardcoded in Spanish.
- **`DATABASE_URL`** in `.env` points to a hardcoded path; update for your environment.
- **`'use client'`** on all view components and interactive components.
- **Reusable badges:** `StatusBadge`, `PriorityBadge`, `QuoteStatusBadge`, `InvoiceStatusBadge`, `ReminderStatusBadge`, `RoleBadge` from `@/components/tallerflow/badges`.
- **shadcn components** should NOT be recreated (already in `@/components/ui/`).
- **Imports:** `@/` maps to `./src/`. Use `@/lib/constants`, `@/lib/hooks/api`, `@/store/app-store`, `@/components/ui/button`, etc.
- **Toasts:** `import { toast } from 'sonner'` for feedback.
- **Responsive:** Mobile-first. Use `sm:`, `md:`, `lg:` prefixes. Tables need `overflow-x-auto` wrapper.
- **Footer** is already in `src/app/page.tsx` — views should NOT include their own footer.
- **Module views** go in `src/modules/<module>/<module>-view.tsx` as named exports.
- **Daily Agenda + DailyTask:** Schema has `DailyTask` model (id, title, taskDate, isCompleted, assigneeId, priority, sortOrder). API at `/api/daily-agenda` (GET aggregated today data) and `/api/daily-tasks` (CRUD). Hooks: `useDailyAgenda()`, `useDailyTaskMutations()`. The landing page defaults to `daily-agenda` view. After creating/modifying daily tasks, invalidate `['daily-agenda']` and `['daily-tasks']` query keys.
