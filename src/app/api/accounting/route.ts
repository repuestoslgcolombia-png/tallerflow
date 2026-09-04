import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
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
    const current = await ensureAccountingPeriods()
    const { year, month } = getCurrentMonth()

    const history = (await getAccountingHistory(6)).map((r) => ({
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
    return serverError('Error al obtener contabilidad', e)
  }
}

// PUT /api/accounting - registrar gastos del mes en curso
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const expenses = Number(body.expenses)
    if (body.expenses !== undefined && (Number.isNaN(expenses) || expenses < 0)) {
      return badRequest('Los gastos deben ser un número mayor o igual a cero')
    }

    const { year, month } = getCurrentMonth()
    await ensureAccountingPeriods()

    const data: Record<string, unknown> = {}
    if (body.expenses !== undefined) data.expenses = expenses
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null

    const record = await db.monthlyAccounting.update({
      where: { year_month: { year, month } },
      data,
    })

    const profit = record.collected - (record.expenses || 0)
    if (body.expenses !== undefined) {
      await db.monthlyAccounting.update({
        where: { year_month: { year, month } },
        data: { profit },
      })
    }

    const updated = await db.monthlyAccounting.findUnique({
      where: { year_month: { year, month } },
    })

    return ok(updated)
  } catch (e) {
    return serverError('Error al actualizar contabilidad', e)
  }
}
