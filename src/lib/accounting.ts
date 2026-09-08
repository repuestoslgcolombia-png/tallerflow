import { db } from '@/lib/db'
import { dbFor } from '@/lib/tenant/db-for'

// ============== CONTABILIDAD MENSUAL ==============
// Cierre automático de mes: al abrir la app se cierran los períodos abiertos
// anteriores al mes en curso y se recalcula en vivo el mes actual.
// Patrón "cron ligero" igual que sweepDueReminders().
// Multi-tenant: todas las funciones aceptan un tenantId; con él operan
// dentro del taller (dbFor) y sin él usan db global (solo tests/scripts).

type TenantDb = ReturnType<typeof dbFor> | typeof db

function scopedDb(tenantId?: string): TenantDb {
  return tenantId ? dbFor(tenantId) : db
}

export function monthKey(year: number, month: number): number {
  return year * 100 + month
}

export function getCurrentMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function monthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  }
}

export function daysToMonthEnd(): number {
  const { year, month } = getCurrentMonth()
  const lastDay = new Date(year, month, 0) // día 0 del mes siguiente = último día del mes
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.ceil((lastDay.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000)) + 1)
}

async function computeInvoiced(tdb: TenantDb, year: number, month: number): Promise<number> {
  const { start, end } = monthRange(year, month)
  const agg = await tdb.invoice.aggregate({
    where: {
      issuedAt: { gte: start, lt: end },
      status: { not: 'cancelled' },
    },
    _sum: { total: true },
  })
  return agg._sum.total || 0
}

async function computeCollected(tdb: TenantDb, year: number, month: number): Promise<number> {
  const { start, end } = monthRange(year, month)
  const agg = await tdb.payment.aggregate({
    where: { paidAt: { gte: start, lt: end } },
    _sum: { amount: true },
  })
  return agg._sum.amount || 0
}

async function computeOutstanding(tdb: TenantDb): Promise<number> {
  const open = await tdb.invoice.findMany({
    where: { status: { in: ['pending', 'partial'] } },
    select: { total: true, paid: true },
  })
  return open.reduce((sum, i) => sum + Math.max(0, i.total - i.paid), 0)
}

// Backfill idempotente: crea registros Payment para facturas históricas que ya
// tienen dinero cobrado (paid > 0) pero aún no tienen ningún Payment en el libro.
async function backfillPayments(tdb: TenantDb) {
  const invoices = await tdb.invoice.findMany({
    where: { paid: { gt: 0 }, payments: { none: {} } },
    select: { id: true, paid: true, paidAt: true, issuedAt: true, paymentMethod: true },
  })
  if (invoices.length === 0) return

  for (const inv of invoices) {
    await tdb.payment.create({
      data: {
        invoiceId: inv.id,
        amount: inv.paid,
        method: inv.paymentMethod || 'cash',
        paidAt: inv.paidAt || inv.issuedAt || new Date(),
      },
    })
  }
}

// Idempotente: cierra períodos abiertos vencidos y mantiene el mes actual en vivo.
export async function ensureAccountingPeriods(tenantId?: string) {
  const tdb = scopedDb(tenantId)
  await backfillPayments(tdb)
  const { year, month } = getCurrentMonth()
  const currentKey = monthKey(year, month)

  // 1) Cerrar períodos abiertos anteriores al mes actual
  const openPast = await tdb.monthlyAccounting.findMany({ where: { status: 'open' } })
  for (const period of openPast) {
    if (monthKey(period.year, period.month) < currentKey) {
      const invoiced = await computeInvoiced(tdb, period.year, period.month)
      const collected = await computeCollected(tdb, period.year, period.month)
      const lastDay = new Date(period.year, period.month, 0, 23, 59, 59, 999)
      await tdb.monthlyAccounting.update({
        where: { id: period.id },
        data: {
          invoiced,
          collected,
          profit: collected - (period.expenses || 0),
          status: 'closed',
          closedAt: lastDay,
        },
      })
    }
  }

  // 2) Upsert del mes actual (abierto) y recalcular en vivo
  const invoiced = await computeInvoiced(tdb, year, month)
  const collected = await computeCollected(tdb, year, month)
  const outstanding = await computeOutstanding(tdb)

  // unique compuesto tenantId_year_month: resolver por findFirst y upsert por id
  const existing = await tdb.monthlyAccounting.findFirst({
    where: { year, month },
  })
  const expenses = existing?.expenses || 0

  if (existing) {
    return tdb.monthlyAccounting.update({
      where: { id: existing.id },
      data: {
        invoiced,
        collected,
        outstanding,
        profit: collected - expenses,
        status: 'open',
      },
    })
  }

  return tdb.monthlyAccounting.create({
    // tenantId lo inyecta dbFor() en runtime
    data: {
      year,
      month,
      invoiced,
      collected,
      outstanding,
      expenses: 0,
      profit: collected,
      status: 'open',
    } as any,
  })
}

// Historial de los últimos N meses (snapshots cerrados + mes actual vivo)
export async function getAccountingHistory(months: number, tenantId?: string) {
  const tdb = scopedDb(tenantId)
  const { year, month } = getCurrentMonth()
  const cutoff = new Date(year, month - 1 - months, 1)

  const records = await tdb.monthlyAccounting.findMany({
    where: {
      OR: [{ year: { gt: cutoff.getFullYear() } }, { year: cutoff.getFullYear(), month: { gt: cutoff.getMonth() + 1 } }],
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: months,
  })

  return records
}
