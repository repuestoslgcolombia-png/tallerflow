import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, created, notFound } from '@/lib/api'
import { randomUUID } from 'crypto'
import { expireOverdueQuotes, logQuoteEvent } from '@/lib/quotes/history'
import { getNextStatuses, type WorkOrderStatusKey } from '@/lib/constants'

// GET /api/quotes
export async function GET(req: NextRequest) {
  try {
    // Vencimiento lazy antes de listar
    await expireOverdueQuotes()

    const { searchParams } = new URL(req.url)
    const workOrderId = searchParams.get('workOrderId')
    const status = searchParams.get('status')

    const quotes = await db.quote.findMany({
      where: {
        ...(workOrderId ? { workOrderId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        workOrder: {
          include: { customer: true, device: true },
        },
        items: { include: { part: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(quotes)
  } catch (e) {
    return serverError('Error al listar cotizaciones', e)
  }
}

// POST /api/quotes - crear cotización
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.workOrderId) return badRequest('Orden de trabajo es obligatoria')
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return badRequest('Debe incluir al menos un ítem')
    }

    const wo = await db.workOrder.findUnique({ where: { id: body.workOrderId } })
    if (!wo) return notFound('Orden de trabajo no encontrada')

    // Generar código correlativo
    const settings = await db.workshopSetting.findFirst({ where: { id: 'default' } })
    const nextNumber = (settings?.counterQuote || 0) + 1
    const year = new Date().getFullYear()
    const code = `COT-${year}-${String(nextNumber).padStart(3, '0')}`

    // Calcular totales
    const taxRate = settings?.taxRate || 0
    let subtotal = 0
    const items = body.items.map((it: any) => {
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
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    const validUntil = body.validUntil
      ? new Date(body.validUntil)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días por defecto

    const quote = await db.$transaction(async (tx) => {
      await tx.workshopSetting.update({
        where: { id: 'default' },
        data: { counterQuote: nextNumber },
      })

      const q = await tx.quote.create({
        data: {
          workOrderId: body.workOrderId,
          code,
          status: body.sendImmediately ? 'sent' : 'draft',
          approvalToken: randomUUID(),
          notes: body.notes || null,
          validUntil,
          subtotal,
          tax: taxAmount,
          total,
          ...(body.sendImmediately ? { sentAt: new Date() } : {}),
          items: { create: items },
        },
        include: {
          workOrder: { include: { customer: true, device: true } },
          items: { include: { part: true } },
        },
      })

      await logQuoteEvent(tx, {
        quoteId: q.id,
        eventType: 'created',
        toStatus: q.status,
        description: `Cotización ${code} creada. Total: $${total.toFixed(0)}`,
      })

      if (body.sendImmediately) {
        await logQuoteEvent(tx, {
          quoteId: q.id,
          eventType: 'sent',
          fromStatus: 'draft',
          toStatus: 'sent',
          description: `Cotización ${code} enviada al cliente`,
        })
      }

      // Actualizar estado de la orden (solo si el flujo del servicio permite 'quoted')
      if (body.sendImmediately && getNextStatuses(wo.status as WorkOrderStatusKey, wo.serviceType).includes('quoted')) {
        await tx.workOrder.update({
          where: { id: body.workOrderId },
          data: { status: 'quoted' },
        })
        await tx.workOrderEvent.create({
          data: {
            workOrderId: body.workOrderId,
            eventType: 'status_change',
            fromStatus: wo.status,
            toStatus: 'quoted',
            title: 'Cotización enviada',
            description: `Cotización ${code} enviada al cliente`,
          },
        })
      }

      return q
    })

    const createdQuote = await db.quote.findUnique({
      where: { id: quote.id },
      include: {
        workOrder: { include: { customer: true, device: true } },
        items: { include: { part: true } },
      },
    })

    return created(createdQuote)
  } catch (e) {
    return serverError('Error al crear cotización', e)
  }
}
