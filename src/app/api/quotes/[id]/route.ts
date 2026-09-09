import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'
import { runTrigger } from '@/lib/automations'
import { expireOverdueQuotes, logQuoteEvent } from '@/lib/quotes/history'
import { getNextStatuses, type WorkOrderStatusKey } from '@/lib/constants'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    await expireOverdueQuotes()

    const quote = await tdb.quote.findUnique({
      where: { id },
      include: {
        workOrder: {
          include: { customer: true, device: true },
        },
        items: { include: { part: true } },
        events: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!quote) return notFound('Cotización no encontrada')
    return ok(quote)
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Cotización no encontrada')
    }
    return serverError('Error al obtener cotización', e)
  }
}

// Actualizar cotización (items, notas, enviar)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const body = await req.json()

    const existing = await tdb.quote.findUnique({ where: { id } })
    if (!existing) return notFound('Cotización no encontrada')

    if (body.action === 'send') {
      // Enviar cotización al cliente
      const wo = await tdb.workOrder.findUnique({ where: { id: existing.workOrderId } })
      const quote = await tdb.$transaction(async (tx) => {
        const q = await tx.quote.update({
          where: { id },
          data: { status: 'sent', sentAt: new Date() },
          include: { workOrder: { include: { customer: true, device: true } }, items: { include: { part: true } } },
        })
        await logQuoteEvent(tx, {
          quoteId: id,
          eventType: 'sent',
          fromStatus: existing.status,
          toStatus: 'sent',
          description: `Cotización ${existing.code} enviada al cliente`,
        })
        if (wo && getNextStatuses(wo.status as WorkOrderStatusKey, wo.serviceType).includes('quoted')) {
          await tx.workOrder.update({
            where: { id: existing.workOrderId },
            data: { status: 'quoted' },
          })
          await tx.workOrderEvent.create({
            data: {
              workOrderId: existing.workOrderId,
              eventType: 'status_change',
              fromStatus: wo.status,
              toStatus: 'quoted',
              title: 'Cotización enviada',
              description: `Cotización ${existing.code} enviada al cliente`,
            },
          })
        }
        return q
      })

      await runTrigger('quote_sent', { workOrderId: existing.workOrderId, quoteId: id, tenantId: session.tenantId })

      const refreshed = await tdb.quote.findUnique({
        where: { id },
        include: {
          workOrder: { include: { customer: true, device: true } },
          items: { include: { part: true } },
        },
      })

      return ok(refreshed)
    }

    if (body.action === 'resend') {
      // Reenviar: actualiza fecha de envío; si estaba vencida, la reactiva con nueva validez
      if (existing.status === 'approved') {
        return badRequest('No se puede reenviar una cotización aprobada')
      }
      const wasExpired = existing.status === 'expired'
      const newValidUntil = body.validUntil
        ? new Date(body.validUntil)
        : wasExpired
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : existing.validUntil

      const wo = await tdb.workOrder.findUnique({ where: { id: existing.workOrderId } })
      const quote = await tdb.$transaction(async (tx) => {
        const q = await tx.quote.update({
          where: { id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            ...(wasExpired ? { validUntil: newValidUntil } : {}),
          },
          include: { workOrder: { include: { customer: true, device: true } }, items: { include: { part: true } } },
        })
        await logQuoteEvent(tx, {
          quoteId: id,
          eventType: 'resent',
          fromStatus: existing.status,
          toStatus: 'sent',
          description: wasExpired
            ? `Cotización ${existing.code} reactivada y reenviada. Nueva validez: ${(newValidUntil as Date).toISOString().slice(0, 10)}`
            : `Cotización ${existing.code} reenviada al cliente`,
        })
        if (wo && getNextStatuses(wo.status as WorkOrderStatusKey, wo.serviceType).includes('quoted')) {
          await tx.workOrder.update({
            where: { id: existing.workOrderId },
            data: { status: 'quoted' },
          })
          await tx.workOrderEvent.create({
            data: {
              workOrderId: existing.workOrderId,
              eventType: 'status_change',
              fromStatus: wo.status,
              toStatus: 'quoted',
              title: 'Cotización enviada',
              description: `Cotización ${existing.code} reenviada al cliente`,
            },
          })
        }
        return q
      })

      await runTrigger('quote_sent', { workOrderId: existing.workOrderId, quoteId: id, tenantId: session.tenantId })

      const refreshed = await tdb.quote.findUnique({
        where: { id },
        include: {
          workOrder: { include: { customer: true, device: true } },
          items: { include: { part: true } },
        },
      })

      return ok(refreshed)
    }

    if (body.action === 'reject') {
      const quote = await tdb.$transaction(async (tx) => {
        const q = await tx.quote.update({
          where: { id },
          data: {
            status: 'rejected',
            rejectionReason: body.reason || null,
          },
        })
        await logQuoteEvent(tx, {
          quoteId: id,
          eventType: 'rejected',
          fromStatus: existing.status,
          toStatus: 'rejected',
          description: body.reason ? `Motivo: ${body.reason}` : 'Rechazada por el taller',
        })
        return q
      })
      return ok(quote)
    }

    // Actualizar items
    if (body.items) {
      const settings = await tdb.workshopSetting.findFirst()
      const applyTax = body.applyTax !== undefined ? Boolean(body.applyTax) : existing.tax > 0
      const taxRate = applyTax
        ? Math.min(Math.max(Number(body.taxRate ?? settings?.taxRate ?? 0) || 0, 0), 100)
        : 0
      let subtotal = 0
      const itemsData = body.items.map((it: any) => {
        const total = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
        subtotal += total
        return {
          itemType: it.itemType || 'other',
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          total,
          partId: it.partId || null,
        }
      })
      const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0

      // Borrar items existentes y recrear
      await db.quoteItem.deleteMany({ where: { quoteId: id } })
      const quote = await tdb.$transaction(async (tx) => {
        const q = await tx.quote.update({
          where: { id },
          data: {
            notes: body.notes !== undefined ? body.notes : undefined,
            subtotal,
            tax: taxAmount,
            taxRate: applyTax ? taxRate : 0,
            total: subtotal + taxAmount,
            items: { create: itemsData },
          },
          include: { items: { include: { part: true } } },
        })
        await logQuoteEvent(tx, {
          quoteId: id,
          eventType: 'edited',
          description: `Ítems actualizados (${itemsData.length} ítems). Nuevo total: $${(subtotal + taxAmount).toFixed(0)}`,
        })
        return q
      })
      return ok(quote)
    }

    return badRequest('Acción no válida')
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Cotización no encontrada')
    }
    return serverError('Error al actualizar cotización', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const existing = await tdb.quote.findUnique({ where: { id } })
    if (!existing) return notFound('Cotización no encontrada')

    if (existing.status === 'approved') {
      return badRequest('No se puede eliminar una cotización aprobada')
    }

    await tdb.quote.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Cotización no encontrada')
    }
    return serverError('Error al eliminar cotización', e)
  }
}
