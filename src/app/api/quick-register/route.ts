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

    body.phone = body.phone.replace(/[\s\-\(\)]/g, '')
    if (body.phone.length < 7) return badRequest('Teléfono inválido: debe tener al menos 7 dígitos')

    const year = new Date().getFullYear()

    let scheduledVisitAt: Date | null = null
    if (body.visitDate && body.visitTime) {
      const [hours, minutes] = body.visitTime.split(':').map(Number)
      scheduledVisitAt = new Date(body.visitDate)
      scheduledVisitAt.setHours(hours, minutes, 0, 0)
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.workshopSetting.update({
        where: { id: 'default' },
        data: { counterWorkOrder: { increment: 1 } },
      })
      const nextNumber = updated.counterWorkOrder
      const code = `OT-${year}-${String(nextNumber).padStart(3, '0')}`

      let customer = await tx.customer.findFirst({ where: { phone: body.phone } })
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            firstName: body.firstName,
            lastName: body.lastName,
            documentId: body.documentId || null,
            phone: body.phone,
            email: body.email || null,
            address: body.address,
          },
        })
      }

      const device = await tx.device.create({
        data: {
          customerId: customer.id,
          type: body.deviceType,
          brand: body.deviceBrand || null,
          model: body.deviceModel || null,
        },
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

      await tx.auditLog.create({
        data: {
          action: 'create',
          entity: 'WorkOrder',
          entityId: workOrder.id,
          description: `Registro rápido - ${code} - ${body.firstName} ${body.lastName}`,
        },
      })

      const followUpDate = new Date()
      followUpDate.setDate(followUpDate.getDate() + 7)
      await tx.reminder.create({
        data: {
          customerId: customer.id,
          workOrderId: workOrder.id,
          type: 'follow_up',
          title: `Seguimiento - ${code}`,
          message: `Hola ${body.firstName}, ¿cómo va el equipo ${body.deviceBrand || ''} ${body.deviceModel || ''} que recibimos? Si tiene alguna duda, estamos para ayudarte.`,
          dueDate: followUpDate,
          channel: 'whatsapp',
          status: 'pending',
          priority: 'normal',
          daysAfter: 7,
        },
      })

      return { customer, device, workOrder }
    })

    return created(result)
  } catch (e) {
    return serverError('Error al registrar', e)
  }
}