import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, created, notFound } from '@/lib/api'
import { runTrigger } from '@/lib/automations'

// GET /api/invoices - listar facturas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const workOrderId = searchParams.get('workOrderId')
    const search = searchParams.get('search') || ''

    const invoices = await db.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
        ...(workOrderId ? { workOrderId } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { customer: { firstName: { contains: search } } },
                { customer: { lastName: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        workOrder: { include: { device: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(invoices)
  } catch (e) {
    return serverError('Error al listar facturas', e)
  }
}

// POST /api/invoices - crear factura (generalmente desde una orden de trabajo)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.workOrderId) return badRequest('Orden de trabajo es obligatoria')
    if (!body.customerId) return badRequest('Cliente es obligatorio')

    // Verificar que la orden exista y no tenga ya una factura
    const wo = await db.workOrder.findUnique({
      where: { id: body.workOrderId },
      include: { invoice: true, quotes: { include: { items: true }, where: { status: 'approved' } } },
    })
    if (!wo) return notFound('Orden de trabajo no encontrada')
    if (wo.invoice) return badRequest('Esta orden ya tiene una factura asociada')

    // Generar código correlativo
    const settings = await db.workshopSetting.findFirst({ where: { id: 'default' } })
    const nextNumber = (settings?.counterInvoice || 0) + 1
    const year = new Date().getFullYear()
    const code = `FAC-${year}-${String(nextNumber).padStart(3, '0')}`

    // Calcular totales desde items (o usar datos de la orden)
    const taxRate = settings?.taxRate || 0
    const applyTax = body.applyTax !== undefined ? Boolean(body.applyTax) : true
    let itemsData: any[] = []

    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      // Items enviados explícitamente
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
    } else if (wo.quotes.length > 0) {
      // Copiar items de la cotización aprobada más reciente
      const quote = wo.quotes[0]
      itemsData = quote.items.map((it: any) => ({
        itemType: it.itemType,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      }))
    } else {
      // Item genérico basado en el total de la orden
      itemsData = [
        {
          itemType: 'other',
          description: `Servicio de reparación - ${wo.code}`,
          quantity: 1,
          unitPrice: wo.totalAmount || 0,
          total: wo.totalAmount || 0,
        },
      ]
    }

    const subtotal = itemsData.reduce((sum, it) => sum + it.total, 0)
    const taxAmount = applyTax ? subtotal * (taxRate / 100) : 0
    const total = subtotal + taxAmount

    // Coherencia: una factura "pagada" siempre registra el pago completo
    let initialPaid = body.paid !== undefined ? Number(body.paid) : 0
    let status = body.status || 'pending'
    if (status === 'paid') initialPaid = total
    if (initialPaid >= total && total > 0) {
      initialPaid = total
      status = 'paid'
    } else if (initialPaid > 0) {
      status = 'partial'
    }

    const invoice = await db.$transaction(async (tx) => {
      await tx.workshopSetting.update({
        where: { id: 'default' },
        data: { counterInvoice: nextNumber },
      })

      const inv = await tx.invoice.create({
        data: {
          code,
          workOrderId: body.workOrderId,
          customerId: body.customerId,
          subtotal,
          tax: taxAmount,
          total,
          paid: initialPaid,
          paymentMethod: body.paymentMethod || null,
          status,
          notes: body.notes || null,
          paidAt: status === 'paid' ? new Date() : null,
          items: { create: itemsData },
        },
        include: {
          customer: true,
          workOrder: { include: { device: true } },
          items: true,
        },
      })

      // Actualizar la orden con el total pagado
      await tx.workOrder.update({
        where: { id: body.workOrderId },
        data: {
          totalAmount: total,
          totalPaid: initialPaid,
        },
      })

      return inv
    })

    await runTrigger('invoice_created', {
      workOrderId: body.workOrderId,
      customerId: body.customerId,
      invoiceId: invoice.id,
    })

    if (invoice.status === 'paid') {
      await runTrigger('payment_received', {
        workOrderId: body.workOrderId,
        customerId: body.customerId,
        invoiceId: invoice.id,
      })
    }

    return created(invoice)
  } catch (e) {
    return serverError('Error al crear factura', e)
  }
}
