# TallerFlow - AGENTS.md

## Commands
- Dev: `bun run dev` (port 3001; stderr→stdout via `2>&1`)
- Lint: `bun run lint` (ESLint — most rules off)
- Build: `bun run build` (runs `prisma generate && next build`)
- Start (prod): `bun run start` (standalone `.next/standalone/server.js` → `server.log`)
- DB push: `bun run db:push`
- DB generate: `bun run db:generate` (auto-runs on `bun install` via `postinstall`)
- DB migrate: `bun run db:migrate`
- DB reset: `bun run db:reset`
- No CI pipeline — `.github/workflows/` is empty

## Architecture
- Single `/` SPA route (no Next.js pages/router). Zustand `currentView` drives which module renders in `src/app/page.tsx`.
- 13 views mapped in `page.tsx`: daily-agenda + dashboard (both → `DailyAgendaView`), customers, customer-detail, devices, work-orders, work-order-detail, quotes, invoices, inventory, reminders, whatsapp, settings.
- Navigation: `useAppStore().navigate('view-name', { workOrderId?: id, ... })`
- Server state: TanStack React Query. Hooks in `src/lib/hooks/api.ts`.
- DB: PostgreSQL via Neon (Prisma). Schema in `prisma/schema.prisma` (19 models).
- UI: shadcn/ui New York, Tailwind CSS v4, `@/components/ui/` (already exist).
- Libraries in active use: dnd-kit (drag & drop), framer-motion (animations), recharts (charts), react-hook-form + zod (forms), date-fns (dates), sonner (toasts).
- Domain: **electrodomésticos del hogar** (lavadoras, neveras, aires acondicionados, TVs, etc.) — NOT computers/phones despite `worklog.md` saying otherwise. Trust `layout.tsx` metadata and `prisma/schema.prisma` enums.

## Supabase Auth
- Supabase is configured for auth only (does not replace Prisma/Neon).
- Helpers in `src/utils/supabase/`: `server.ts` (createServerClient), `client.ts` (createBrowserClient), `middleware.ts` (request client).
- `src/middleware.ts` refreshes session on every request. Matcher excludes static files.
- `.env.local` holds `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Important Quirks
- **React strict mode: OFF** (`next.config.ts`). Hooks may be called conditionally without warnings.
- **TypeScript errors ignored at build** (`ignoreBuildErrors: true`). `noImplicitAny: false`.
- **Colors: NO indigo/blue.** Use `PART_CATEGORIES` colors or tailwind: emerald, amber, rose, sky, violet, teal, orange, slate.
- **Locale: es-CO** for dates (`formatDate`, `formatDateTime`) and currency (`formatCurrency`).
- **All text in Spanish.** UI labels, constants, error messages are hardcoded in Spanish.
- **`DATABASE_URL`** hardcoded in both `.env` and `src/lib/db.ts` — update in both places.
- **`'use client'`** on all view components and interactive components.
- **Reusable badges:** `StatusBadge`, `PriorityBadge`, `QuoteStatusBadge`, `InvoiceStatusBadge`, `ReminderStatusBadge`, `RoleBadge` from `@/components/tallerflow/badges`.
- **shadcn components** should NOT be recreated (already in `@/components/ui/`).
- **Imports:** `@/` maps to `./src/`. Use `@/lib/constants`, `@/lib/hooks/api`, `@/store/app-store`, `@/components/ui/button`, etc.
- **Toasts:** `import { toast } from 'sonner'` for feedback.
- **Responsive:** Mobile-first. Use `sm:`, `md:`, `lg:` prefixes. Tables need `overflow-x-auto` wrapper.
- **Footer** is already in `src/app/page.tsx` — views should NOT include their own footer.
- **Module views** go in `src/modules/<module>/<module>-view.tsx` as named exports.
- **Daily Agenda + DailyTask:** Schema has `DailyTask` model (id, title, taskDate, isCompleted, assigneeId, priority, sortOrder). API at `/api/daily-agenda` (GET aggregated today data) and `/api/daily-tasks` (CRUD). Hooks: `useDailyAgenda()`, `useDailyTaskMutations()`. The landing page defaults to `daily-agenda` view. After creating/modifying daily tasks, invalidate `['daily-agenda']` and `['daily-tasks']` query keys.
- **Prisma client caching:** `src/lib/db.ts` caches PrismaClient in global scope and auto-busts cache when schema changes (checks `@prisma/client` mtime + model existence). No manual `prisma generate` needed after `db:push`.