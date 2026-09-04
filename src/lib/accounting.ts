import { db } from '@/lib/db'

// ============== CONTABILIDAD MENSUAL ==============
// Cierre automático de mes: al abrir la app se cierran los períodos abiertos
// anteriores al mes en curso y se recalcula en vivo el mes actual.
// Patrón "cron ligero" igual que sweepDueReminders().

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

async function computeInvoiced(year: number, month: number): Promise<number> {
  const { start, end } = monthRange(year, month)
  const agg = await db.invoice.aggregate({
    where: {
      issuedAt: { gte: start, lt: end },
      status: { not: 'cancelled' },
    },
    _sum: { total: true },
  })
  return agg._sum.total || 0
}

async function computeCollected(year: number, month: number): Promise<number> {
  const { start, end } = monthRange(year, month)
  const agg = await db.payment.aggregate({
    where: { paidAt: { gte: start, lt: end } },
    _sum: { amount: true },
  })
  return agg._sum.amount || 0
}

async function computeOutstanding(): Promise<number> {
  const open = await db.invoice.findMany({
    where: { status: { in: ['pending', 'partial'] } },
    select: { total: true, paid: true },
  })
  return open.reduce((sum, i) => sum + Math.max(0, i.total - i.paid), 0)
}

// Backfill idempotente: crea registros Payment para facturas históricas que ya
// tienen dinero cobrado (paid > 0) pero aún no tienen ningún Payment en el libro.
async function backfillPayments() {
  const invoices = await db.invoice.findMany({
    where: { paid: { gt: 0 }, payments: { none: {} } },
    select: { id: true, paid: true, paidAt: true, issuedAt: true, paymentMethod: true },
  })
  if (invoices.length === 0) return

  for (const inv of invoices) {
    await db.payment.create({
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
export async function ensureAccountingPeriods() {
  await backfillPayments()
  const { year, month } = getCurrentMonth()
  const currentKey = monthKey(year, month)

  // 1) Cerrar períodos abiertos anteriores al mes actual
  const openPast = await db.monthlyAccounting.findMany({ where: { status: 'open' } })
  for (const period of openPast) {
    if (monthKey(period.year, period.month) < currentKey) {
      const invoiced = await computeInvoiced(period.year, period.month)
      const collected = await computeCollected(period.year, period.month)
      const lastDay = new Date(period.year, period.month, 0, 23, 59, 59, 999)
      await db.monthlyAccounting.update({
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
  const invoiced = await computeInvoiced(year, month)
  const collected = await computeCollected(year, month)
  const outstanding = await computeOutstanding()

  const existing = await db.monthlyAccounting.findUnique({
    where: { year_month: { year, month } },
  })
  const expenses = existing?.expenses || 0

  return db.monthlyAccounting.upsert({
    where: { year_month: { year, month } },
    update: {
      invoiced,
      collected,
      outstanding,
      profit: collected - expenses,
      status: 'open',
    },
    create: {
      year,
      month,
      invoiced,
      collected,
      outstanding,
      expenses: 0,
      profit: collected,
      status: 'open',
    },
  })
}

// Historial de los últimos N meses (snapshots cerrados + mes actual vivo)
export async function getAccountingHistory(months: number) {
  const { year, month } = getCurrentMonth()
  const cutoff = new Date(year, month - 1 - months, 1)

  const records = await db.monthlyAccounting.findMany({
    where: {
      OR: [{ year: { gt: cutoff.getFullYear() } }, { year: cutoff.getFullYear(), month: { gt: cutoff.getMonth() + 1 } }],
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: months,
  })

  return records
}
