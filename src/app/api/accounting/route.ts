import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError } from '@/lib/api'
import {
  ensureAccountingPeriods,
  getAccountingHistory,
  getCurrentMonth,
  daysToMonthEnd,
} from '@/lib/accounting'

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  })
}

// GET /api/accounting - contabilidad mensual (cierra meses vencidos y devuelve historial)
export async function GET(_req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const current = await ensureAccountingPeriods(session.tenantId)
    const { year, month } = getCurrentMonth()

    const history = (await getAccountingHistory(6, session.tenantId)).map((r) => ({
      year: r.year,
      month: r.month,
      label: monthLabel(r.year, r.month),
      invoiced: r.invoiced,
      collected: r.collected,
      outstanding: r.outstanding,
      expenses: r.expenses,
      profit: r.profit,
      status: r.status,
      closedAt: r.closedAt,
      isCurrent: r.year === year && r.month === month,
    }))

    return ok({
      current: {
        year: current.year,
        month: current.month,
        label: monthLabel(current.year, current.month),
        invoiced: current.invoiced,
        collected: current.collected,
        outstanding: current.outstanding,
        expenses: current.expenses,
        profit: current.profit,
        status: current.status,
        closedAt: current.closedAt,
      },
      history,
      daysToClose: daysToMonthEnd(),
    })
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al obtener contabilidad', e)
  }
}

// PUT /api/accounting - registrar gastos del mes en curso
export async function PUT(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()
    const expenses = Number(body.expenses)
    if (body.expenses !== undefined && (Number.isNaN(expenses) || expenses < 0)) {
      return badRequest('Los gastos deben ser un número mayor o igual a cero')
    }

    const { year, month } = getCurrentMonth()
    await ensureAccountingPeriods(session.tenantId)

    const data: Record<string, unknown> = {}
    if (body.expenses !== undefined) data.expenses = expenses
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null

    // unique compuesto tenantId_year_month: resolver por findFirst (la extensión filtra tenant)
    let record = await tdb.monthlyAccounting.findFirst({
      where: { year, month },
    })
    if (record) {
      record = await tdb.monthlyAccounting.update({
        where: { id: record.id },
        data,
      })

      const profit = record.collected - (record.expenses || 0)
      if (body.expenses !== undefined) {
        record = await tdb.monthlyAccounting.update({
          where: { id: record.id },
          data: { profit },
        })
      }
    }

    return ok(record)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al actualizar contabilidad', e)
  }
}
