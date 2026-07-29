import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, created } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.firstName || !body.lastName) return badRequest('Nombre y apellido son obligatorios')
    if (!body.phone) return badRequest('Teléfono es obligatorio')
    if (!body.address) return badRequest('Dirección es obligatoria')
    if (!body.deviceType) return badRequest('Tipo de equipo es obligatorio')
    if (!body.reportedIssue) return badRequest('Problema reportado es obligatorio')

    const settings = await db.workshopSetting.findFirst({ where: { id: 'default' } })
    const nextNumber = (settings?.counterWorkOrder || 0) + 1
    const year = new Date().getFullYear()
    const code = `OT-${year}-${String(nextNumber).padStart(3, '0')}`

    let scheduledVisitAt: Date | null = null
    if (body.visitDate && body.visitTime) {
      const [hours, minutes] = body.visitTime.split(':').map(Number)
      scheduledVisitAt = new Date(body.visitDate)
      scheduledVisitAt.setHours(hours, minutes, 0, 0)
    }

    const result = await db.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          documentId: body.documentId || null,
          phone: body.phone,
          email: body.email || null,
          address: body.address,
        },
      })

      const device = await tx.device.create({
        data: {
          customerId: customer.id,
          type: body.deviceType,
          brand: body.deviceBrand || null,
          model: body.deviceModel || null,
        },
      })

      await tx.workshopSetting.update({
        where: { id: 'default' },
        data: { counterWorkOrder: nextNumber },
      })

      const serviceTypeLabel: Record<string, string> = {
        mantenimiento: 'Mantenimiento Preventivo',
        revision: 'Revisión',
        instalacion: 'Instalación',
      }

      const workOrder = await tx.workOrder.create({
        data: {
          code,
          customerId: customer.id,
          deviceId: device.id,
          serviceType: body.serviceType || 'revision',
          scheduledVisitAt,
          priority: body.priority || 'normal',
          reportedIssue: body.reportedIssue,
          timeline: {
            create: {
              eventType: 'status_change',
              fromStatus: '',
              toStatus: 'received',
              title: `Registro rápido - ${serviceTypeLabel[body.serviceType || 'revision']}`,
              description: `Cliente: ${body.firstName} ${body.lastName} | Equipo: ${body.deviceType} | ${body.reportedIssue}`,
            },
          },
        },
        include: {
          customer: true,
          device: true,
          timeline: { orderBy: { createdAt: 'asc' } },
        },
      })

      return { customer, device, workOrder }
    })

    return created(result)
  } catch (e) {
    return serverError('Error al registrar', e)
  }
}