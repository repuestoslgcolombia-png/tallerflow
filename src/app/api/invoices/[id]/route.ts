import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        workOrder: { include: { device: true, technician: true } },
        items: true,
      },
    })
    if (!invoice) return notFound('Factura no encontrada')
    return ok(invoice)
  } catch (e) {
    return serverError('Error al obtener factura', e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) return notFound('Factura no encontrada')

    // Acción: registrar pago
    if (body.action === 'register_payment') {
      const paidAmount = Number(body.paid) || 0
      const totalPaid = existing.paid + paidAmount
      const isFullyPaid = totalPaid >= existing.total

      const invoice = await db.invoice.update({
        where: { id },
        data: {
          paid: totalPaid,
          status: isFullyPaid ? 'paid' : 'partial',
          paymentMethod: body.paymentMethod || existing.paymentMethod,
          paidAt: isFullyPaid && !existing.paidAt ? new Date() : existing.paidAt,
          notes: body.notes !== undefined ? body.notes : undefined,
        },
        include: { customer: true, workOrder: { include: { device: true } }, items: true },
      })

      // Actualizar total pagado en la orden
      if (existing.workOrderId) {
        await db.workOrder.update({
          where: { id: existing.workOrderId },
          data: { totalPaid },
        })
      }

      return ok(invoice)
    }

    // Acción: anular factura
    if (body.action === 'cancel') {
      const invoice = await db.invoice.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { customer: true, workOrder: { include: { device: true } }, items: true },
      })
      return ok(invoice)
    }

    // Acción: marcar como pagada
    if (body.action === 'mark_paid') {
      const invoice = await db.invoice.update({
        where: { id },
        data: {
          status: 'paid',
          paid: existing.total,
          paidAt: existing.paidAt || new Date(),
          paymentMethod: body.paymentMethod || existing.paymentMethod,
        },
        include: { customer: true, workOrder: { include: { device: true } }, items: true },
      })

      if (existing.workOrderId) {
        await db.workOrder.update({
          where: { id: existing.workOrderId },
          data: { totalPaid: existing.total },
        })
      }

      return ok(invoice)
    }

    // Actualización normal
    const invoice = await db.invoice.update({
      where: { id },
      data: {
        notes: body.notes !== undefined ? body.notes : undefined,
        paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : undefined,
        status: body.status || undefined,
      },
      include: { customer: true, workOrder: { include: { device: true } }, items: true },
    })
    return ok(invoice)
  } catch (e) {
    return serverError('Error al actualizar factura', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) return notFound('Factura no encontrada')

    // Solo se pueden eliminar facturas pendientes o anuladas
    if (!['pending', 'cancelled'].includes(existing.status)) {
      return badRequest('Solo se pueden eliminar facturas pendientes o anuladas')
    }

    await db.invoice.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError('Error al eliminar factura', e)
  }
}
