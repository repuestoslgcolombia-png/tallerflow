import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/api'

// GET /api/whatsapp/automations/logs - últimas ejecuciones de automatizaciones
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const trigger = searchParams.get('trigger')
    const status = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100)

    const logs = await db.automationLog.findMany({
      where: {
        ...(trigger ? { trigger } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { sentAt: 'desc' },
      take: limit,
    })

    // Enriquecer con datos de cliente y orden (AutomationLog no tiene relaciones)
    const customerIds = [...new Set(logs.map((l) => l.customerId).filter(Boolean))] as string[]
    const workOrderIds = [...new Set(logs.map((l) => l.workOrderId).filter(Boolean))] as string[]

    const [customers, workOrders] = await Promise.all([
      db.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, firstName: true, lastName: true, phone: true },
      }),
      db.workOrder.findMany({
        where: { id: { in: workOrderIds } },
        select: { id: true, code: true },
      }),
    ])

    const customerMap = new Map(customers.map((c) => [c.id, c]))
    const workOrderMap = new Map(workOrders.map((w) => [w.id, w]))

    return ok(
      logs.map((log) => ({
        ...log,
        customer: log.customerId ? customerMap.get(log.customerId) || null : null,
        workOrder: log.workOrderId ? workOrderMap.get(log.workOrderId) || null : null,
      }))
    )
  } catch (e) {
    return serverError('Error al listar registros de automatizaciones', e)
  }
}
