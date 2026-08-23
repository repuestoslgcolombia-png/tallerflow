import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, created } from '@/lib/api'
import { runTrigger } from '@/lib/automations'

// GET /api/work-orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const technicianId = searchParams.get('technicianId')
    const customerId = searchParams.get('customerId')

    const workOrders = await db.workOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(technicianId ? { technicianId } : {}),
        ...(customerId ? { customerId } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { reportedIssue: { contains: search } },
                { customer: { firstName: { contains: search } } },
                { customer: { lastName: { contains: search } } },
                { customer: { phone: { contains: search } } },
                { device: { brand: { contains: search } } },
                { device: { model: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        device: true,
        technician: true,
        _count: { select: { quotes: true, timeline: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ok(workOrders)
  } catch (e) {
    return serverError('Error al listar órdenes', e)
  }
}

// POST /api/work-orders - crear orden
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.customerId) return badRequest('Cliente es obligatorio')
    if (!body.deviceId) return badRequest('Equipo es obligatorio')
    if (!body.reportedIssue) return badRequest('Problema reportado es obligatorio')

    // Generar código correlativo
    const settings = await db.workshopSetting.findFirst({ where: { id: 'default' } })
    const nextNumber = (settings?.counterWorkOrder || 0) + 1
    const year = new Date().getFullYear()
    const code = `OT-${year}-${String(nextNumber).padStart(3, '0')}`

    // Transacción: crear orden, incrementar contador, crear evento inicial
    const workOrder = await db.$transaction(async (tx) => {
      await tx.workshopSetting.update({
        where: { id: 'default' },
        data: { counterWorkOrder: nextNumber },
      })

      const wo = await tx.workOrder.create({
        data: {
          code,
          customerId: body.customerId,
          deviceId: body.deviceId,
          technicianId: body.technicianId || null,
          priority: body.priority || 'normal',
          serviceType: body.serviceType || 'revision',
          reportedIssue: body.reportedIssue,
          diagnosisText: body.diagnosisText || null,
          internalNotes: body.internalNotes || null,
          estimatedDoneAt: body.estimatedDoneAt ? new Date(body.estimatedDoneAt) : null,
          timeline: {
            create: {
              eventType: 'status_change',
              fromStatus: '',
              toStatus: 'received',
              title: 'Orden recibida',
              description: `Creada con prioridad ${body.priority || 'normal'}`,
            },
          },
        },
        include: {
          customer: true,
          device: true,
          technician: true,
          timeline: { orderBy: { createdAt: 'asc' } },
        },
      })

      return wo
    })

    await runTrigger('order_received', { workOrderId: workOrder.id })

    return created(workOrder)
  } catch (e) {
    return serverError('Error al crear orden', e)
  }
}
