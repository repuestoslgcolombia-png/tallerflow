import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, created } from '@/lib/api'

// GET /api/reminders - listar recordatorios con filtros
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const workOrderId = searchParams.get('workOrderId')
    const type = searchParams.get('type')
    const dueToday = searchParams.get('dueToday') === 'true'
    const overdue = searchParams.get('overdue') === 'true'

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const reminders = await tdb.reminder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
        ...(workOrderId ? { workOrderId } : {}),
        ...(type ? { type } : {}),
        ...(dueToday
          ? {
              status: 'pending',
              dueDate: { gte: startOfToday, lt: endOfToday },
            }
          : {}),
        ...(overdue
          ? {
              status: 'pending',
              dueDate: { lt: startOfToday },
            }
          : {}),
      },
      include: {
        customer: true,
        workOrder: { include: { device: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    })

    return ok(reminders)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al listar recordatorios', e)
  }
}

// POST /api/reminders - crear recordatorio
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()

    if (!body.customerId) return badRequest('Cliente es obligatorio')
    if (!body.title) return badRequest('Título es obligatorio')
    if (!body.dueDate) return badRequest('Fecha del recordatorio es obligatoria')

    const reminder = await tdb.reminder.create({
      data: {
        customerId: body.customerId,
        workOrderId: body.workOrderId || null,
        type: body.type || 'follow_up',
        title: body.title,
        message: body.message || null,
        dueDate: new Date(body.dueDate),
        channel: body.channel || 'whatsapp',
        status: 'pending',
        priority: body.priority || 'normal',
        daysAfter: body.daysAfter !== undefined ? Number(body.daysAfter) : null,
      } as any,
      include: {
        customer: true,
        workOrder: { include: { device: true } },
      },
    })

    return created(reminder)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al crear recordatorio', e)
  }
}
