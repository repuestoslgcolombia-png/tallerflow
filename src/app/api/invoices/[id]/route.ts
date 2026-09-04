import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'
import { runTrigger } from '@/lib/automations'

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
      if (paidAmount <= 0) return badRequest('El monto del pago debe ser mayor que cero')
      const totalPaid = existing.paid + paidAmount
      const isFullyPaid = totalPaid >= existing.total

      const invoice = await db.$transaction(async (tx) => {
        const inv = await tx.invoice.update({
          where: { id },
          data: {
            paid: totalPaid,
            status: isFullyPaid ? 'paid' : 'partial',
            paymentMethod: body.paymentMethod || existing.paymentMethod,
            paidAt: isFullyPaid && !existing.paidAt ? new Date() : existing.paidAt,
          },
          include: { customer: true, workOrder: { include: { device: true } }, items: true },
        })

        // Registrar el abono en el libro de pagos (atribuye ingreso al mes correcto)
        await tx.payment.create({
          data: {
            invoiceId: id,
            amount: paidAmount,
            method: body.paymentMethod || existing.paymentMethod || 'cash',
            notes: body.notes ? String(body.notes) : null,
            paidAt: new Date(),
            createdBy: body.createdBy || null,
          },
        })

        // Actualizar total pagado en la orden
        if (existing.workOrderId) {
          await tx.workOrder.update({
            where: { id: existing.workOrderId },
            data: { totalPaid },
          })
        }

        return inv
      })

      await runTrigger('payment_received', {
        workOrderId: existing.workOrderId || undefined,
        customerId: existing.customerId,
        invoiceId: id,
      })

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
      const remaining = Math.max(0, existing.total - existing.paid)

      const invoice = await db.$transaction(async (tx) => {
        const inv = await tx.invoice.update({
          where: { id },
          data: {
            status: 'paid',
            paid: existing.total,
            paidAt: existing.paidAt || new Date(),
            paymentMethod: body.paymentMethod || existing.paymentMethod,
          },
          include: { customer: true, workOrder: { include: { device: true } }, items: true },
        })

        // Registrar en el libro de pagos el saldo restante cobrado
        if (remaining > 0) {
          await tx.payment.create({
            data: {
              invoiceId: id,
              amount: remaining,
              method: body.paymentMethod || existing.paymentMethod || 'cash',
              paidAt: new Date(),
              createdBy: body.createdBy || null,
            },
          })
        }

        if (existing.workOrderId) {
          await tx.workOrder.update({
            where: { id: existing.workOrderId },
            data: { totalPaid: existing.total },
          })
        }

        return inv
      })

      await runTrigger('payment_received', {
        workOrderId: existing.workOrderId || undefined,
        customerId: existing.customerId,
        invoiceId: id,
      })

      return ok(invoice)
    }

    // Acción: actualizar items, notas y campos generales
    if (body.action === 'update_items') {
      // Recalcular totales desde los nuevos items
      const settings = await db.workshopSetting.findFirst({ where: { id: 'default' } })
      const applyTax = body.applyTax !== undefined ? Boolean(body.applyTax) : existing.tax > 0
      const taxRate = applyTax
        ? Math.min(Math.max(Number(body.taxRate ?? settings?.taxRate ?? 0) || 0, 0), 100)
        : 0

      let itemsData: any[] = []
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        itemsData = body.items.map((it: any) => {
          const total = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
          return {
            itemType: it.itemType || 'other',
            description: it.description,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            total,
          }
        })
      }

      const subtotal = itemsData.reduce((sum, it) => sum + it.total, 0)
      const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0
      const total = subtotal + taxAmount

      // Ajustar paid/status para mantener coherencia con el nuevo total
      let nextPaid = existing.paid
      let nextStatus = body.status || existing.status
      if (existing.status !== 'cancelled') {
        if (nextPaid >= total) {
          nextPaid = total
          nextStatus = 'paid'
        } else if (existing.status === 'paid') {
          // Era pagada y el nuevo total es mayor: queda con saldo
          nextStatus = 'partial'
        }
      }

      // Borrar items existentes y recrear
      await db.invoiceItem.deleteMany({ where: { invoiceId: id } })

      const invoice = await db.invoice.update({
        where: { id },
        data: {
          subtotal,
          tax: taxAmount,
          taxRate: applyTax ? taxRate : 0,
          total,
          paid: nextPaid,
          status: nextStatus,
          paidAt:
            nextStatus === 'paid' && !existing.paidAt ? new Date() : existing.paidAt,
          notes: body.notes !== undefined ? body.notes : undefined,
          paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : undefined,
          items: { create: itemsData },
        },
        include: { customer: true, workOrder: { include: { device: true } }, items: true },
      })

      // Actualizar el totalAmount de la orden vinculada
      if (existing.workOrderId) {
        await db.workOrder.update({
          where: { id: existing.workOrderId },
          data: { totalAmount: total },
        })
      }

      return ok(invoice)
    }

    // Actualización normal
    // Mantener coherencia paid/status cuando se cambia el estado manualmente
    const nextStatus = body.status || undefined
    const data: any = {
      notes: body.notes !== undefined ? body.notes : undefined,
      paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : undefined,
      status: nextStatus,
    }
    if (nextStatus === 'paid') {
      data.paid = existing.total
      data.paidAt = existing.paidAt || new Date()
    } else if (nextStatus === 'pending' || nextStatus === 'cancelled') {
      data.paid = 0
      data.paidAt = null
    }

    const becomingPaid = nextStatus === 'paid' && existing.status !== 'paid'
    const remaining = Math.max(0, existing.total - existing.paid)

    const invoice = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.update({
        where: { id },
        data,
        include: { customer: true, workOrder: { include: { device: true } }, items: true },
      })

      if (becomingPaid && remaining > 0) {
        await tx.payment.create({
          data: {
            invoiceId: id,
            amount: remaining,
            method: data.paymentMethod || existing.paymentMethod || 'cash',
            paidAt: new Date(),
            createdBy: body.createdBy || null,
          },
        })
      }

      // Sincronizar la orden vinculada
      if (existing.workOrderId && data.paid !== undefined) {
        await tx.workOrder.update({
          where: { id: existing.workOrderId },
          data: { totalPaid: data.paid },
        })
      }

      return inv
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
