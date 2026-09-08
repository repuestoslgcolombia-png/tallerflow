import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, created } from '@/lib/api'
import { runTrigger } from '@/lib/automations'

// GET /api/work-orders
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const technicianId = searchParams.get('technicianId')
    const customerId = searchParams.get('customerId')

    const workOrders = await tdb.workOrder.findMany({
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
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al listar órdenes', e)
  }
}

// POST /api/work-orders - crear orden
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()

    if (!body.customerId) return badRequest('Cliente es obligatorio')
    if (!body.deviceId) return badRequest('Equipo es obligatorio')
    if (!body.reportedIssue) return badRequest('Problema reportado es obligatorio')

    // Generar código correlativo
    const settings = await tdb.workshopSetting.findFirst()
    const nextNumber = (settings?.counterWorkOrder || 0) + 1
    const year = new Date().getFullYear()
    const code = `OT-${year}-${String(nextNumber).padStart(3, '0')}`

    // Transacción: crear orden, incrementar contador, crear evento inicial
    const workOrder = await tdb.$transaction(async (tx) => {
      // Settings del taller (id ya no es 'default': 1 por tenant)
      const ws = await tx.workshopSetting.findFirst()
      if (ws) {
        await tx.workshopSetting.update({
          where: { id: ws.id },
          data: { counterWorkOrder: nextNumber },
        })
      }

      const wo = await tx.workOrder.create({
        // tenantId lo inyecta dbFor() en runtime
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
          scheduledVisitAt: body.scheduledVisitAt ? new Date(body.scheduledVisitAt) : null,
          timeline: {
            create: {
              eventType: 'status_change',
              fromStatus: '',
              toStatus: 'received',
              title: 'Orden recibida',
              description: `Creada con prioridad ${body.priority || 'normal'}`,
            },
          },
        } as any,
        include: {
          customer: true,
          device: true,
          technician: true,
          timeline: { orderBy: { createdAt: 'asc' } },
        },
      })

      return wo
    })

    await runTrigger('order_received', { workOrderId: workOrder.id, tenantId: session.tenantId })

    return created(workOrder)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al crear orden', e)
  }
}
