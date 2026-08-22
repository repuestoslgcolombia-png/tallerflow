import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'
import { runTrigger } from '@/lib/automations'

// GET /api/quotes/[id]/approve?token=xxx - validar token y obtener cotización
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    const quote = await db.quote.findUnique({
      where: { id },
      include: {
        workOrder: {
          include: { customer: true, device: true },
        },
        items: { include: { part: true } },
      },
    })

    if (!quote) return notFound('Cotización no encontrada')
    if (token && quote.approvalToken !== token) {
      return badRequest('Token de aprobación inválido')
    }

    return ok(quote)
  } catch (e) {
    return serverError('Error al validar cotización', e)
  }
}

// POST /api/quotes/[id]/approve - aprobar o rechazar
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { token, decision, name, reason } = body

    const quote = await db.quote.findUnique({
      where: { id },
      include: { workOrder: true },
    })

    if (!quote) return notFound('Cotización no encontrada')
    if (quote.approvalToken !== token) {
      return badRequest('Token de aprobación inválido')
    }
    if (quote.status !== 'sent' && quote.status !== 'draft') {
      return badRequest(`Esta cotización ya fue procesada (${quote.status})`)
    }

    if (decision === 'approve') {
      const result = await db.$transaction(async (tx) => {
        const updated = await tx.quote.update({
          where: { id },
          data: {
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: name || 'Cliente',
          },
        })

        // Mover orden a aprobada
        const wo = await tx.workOrder.update({
          where: { id: quote.workOrderId },
          data: { status: 'approved', totalAmount: quote.total },
        })

        await tx.workOrderEvent.create({
          data: {
            workOrderId: quote.workOrderId,
            eventType: 'status_change',
            fromStatus: quote.workOrder.status,
            toStatus: 'approved',
            title: 'Cotización aprobada',
            description: `Aprobada por ${name || 'Cliente'} vía enlace. Total: $${quote.total}`,
          },
        })

        return { quote: updated, workOrder: wo }
      })

      await runTrigger('quote_approved', { workOrderId: quote.workOrderId, quoteId: id })

      return ok(result)
    }

    if (decision === 'reject') {
      const updated = await db.quote.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason: reason || null,
        },
      })
      await db.workOrderEvent.create({
        data: {
          workOrderId: quote.workOrderId,
          eventType: 'note',
          title: 'Cotización rechazada',
          description: `Rechazada por ${name || 'Cliente'}${reason ? `: ${reason}` : ''}`,
        },
      })
      return ok({ quote: updated })
    }

    return badRequest('Decisión inválida. Use "approve" o "reject"')
  } catch (e) {
    return serverError('Error al procesar aprobación', e)
  }
}
