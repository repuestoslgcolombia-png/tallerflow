import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { dbFor } from '@/lib/tenant'
import { ok, notFound, serverError } from '@/lib/api'

// GET /api/portal/[token] - datos públicos del cliente (sin autenticación)
// El formateo (moneda, fechas, labels, colores) se hace en el cliente con @/lib/constants
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    const portal = await db.portalToken.findUnique({
      where: { token },
      include: { customer: true },
    })

    if (!portal || !portal.active) {
      return notFound('Link de portal inválido o expirado')
    }

    // Actualizar último acceso (sin bloquear la respuesta)
    db.portalToken
      .update({ where: { id: portal.id }, data: { lastAccessAt: new Date() } })
      .catch(() => {})

    const customer = portal.customer

    // Aislamiento: todas las consultas del portal se hacen dentro del taller
    // del cliente (el token es global/único, los datos NO cruzan tenants)
    const tdb = dbFor(customer.tenantId)

    const [devices, workOrders, invoices, settings] = await Promise.all([
      tdb.device.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      }),
      tdb.workOrder.findMany({
        where: { customerId: customer.id },
        include: { device: true, technician: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      tdb.invoice.findMany({
        where: { customerId: customer.id },
        orderBy: { issuedAt: 'desc' },
        take: 20,
      }),
      tdb.workshopSetting.findFirst(),
    ])

    const symbol = settings?.currencySymbol || '$'
    const tallerName = settings?.name || 'TallerFlow'
    const tallerPhone = settings?.phone || ''

    const activeOrders = workOrders.filter(
      (wo) => !['delivered', 'cancelled'].includes(wo.status)
    ).length
    const totalSpent = workOrders.reduce((sum, wo) => sum + wo.totalPaid, 0)
    const pendingBalance = invoices
      .filter((inv) => inv.status === 'pending' || inv.status === 'partial')
      .reduce((sum, inv) => sum + (inv.total - inv.paid), 0)

    return ok({
      customer: {
        name: `${customer.firstName} ${customer.lastName}`.trim(),
        phone: customer.phone,
        email: customer.email,
      },
      workshop: {
        name: tallerName,
        phone: tallerPhone,
        currencySymbol: symbol,
      },
      stats: {
        totalOrders: workOrders.length,
        activeOrders,
        totalSpent,
        pendingBalance,
        totalDevices: devices.length,
      },
      devices: devices.map((d) => ({
        id: d.id,
        type: d.type,
        brand: d.brand || '',
        model: d.model || '',
        serial: d.serial || '',
        notes: d.notes || '',
      })),
      workOrders: workOrders.map((wo) => ({
        id: wo.id,
        code: wo.code,
        status: wo.status,
        serviceType: wo.serviceType,
        priority: wo.priority,
        device: wo.device ? `${wo.device.brand || ''} ${wo.device.model || ''}`.trim() : '',
        deviceType: wo.device?.type || '',
        reportedIssue: wo.reportedIssue,
        diagnosisText: wo.diagnosisText,
        technician: wo.technician?.name || null,
        receivedAt: wo.receivedAt,
        estimatedDoneAt: wo.estimatedDoneAt,
        deliveredAt: wo.deliveredAt,
        totalAmount: wo.totalAmount,
        totalPaid: wo.totalPaid,
      })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        code: inv.code,
        status: inv.status,
        total: inv.total,
        paid: inv.paid,
        balance: inv.total - inv.paid,
        issuedAt: inv.issuedAt,
        paymentMethod: inv.paymentMethod,
      })),
    })
  } catch (e) {
    return serverError('Error al cargar portal', e)
  }
}
