import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
    return ok(quote)
  } catch (e) {
    return serverError('Error al obtener cotización', e)
  }
}

// Actualizar cotización (items, notas, enviar)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.quote.findUnique({ where: { id } })
    if (!existing) return notFound('Cotización no encontrada')

    if (body.action === 'send') {
      // Enviar cotización al cliente
      const wo = await db.workOrder.findUnique({ where: { id: existing.workOrderId } })
      const quote = await db.$transaction(async (tx) => {
        const q = await tx.quote.update({
          where: { id },
          data: { status: 'sent' },
          include: { workOrder: { include: { customer: true, device: true } }, items: { include: { part: true } } },
        })
        if (wo && wo.status !== 'quoted') {
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
      return ok(quote)
    }

    if (body.action === 'reject') {
      const quote = await db.quote.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason: body.reason || null,
        },
      })
      return ok(quote)
    }

    // Actualizar items
    if (body.items) {
      const settings = await db.workshopSetting.findFirst({ where: { id: 'default' } })
      const taxRate = settings?.taxRate || 0
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
      const taxAmount = subtotal * (taxRate / 100)

      // Borrar items existentes y recrear
      await db.quoteItem.deleteMany({ where: { quoteId: id } })
      const quote = await db.quote.update({
        where: { id },
        data: {
          notes: body.notes !== undefined ? body.notes : undefined,
          subtotal,
          tax: taxAmount,
          total: subtotal + taxAmount,
          items: { create: itemsData },
        },
        include: { items: { include: { part: true } } },
      })
      return ok(quote)
    }

    return badRequest('Acción no válida')
  } catch (e) {
    return serverError('Error al actualizar cotización', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.quote.findUnique({ where: { id } })
    if (!existing) return notFound('Cotización no encontrada')

    if (existing.status === 'approved') {
      return badRequest('No se puede eliminar una cotización aprobada')
    }

    await db.quote.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError('Error al eliminar cotización', e)
  }
}
