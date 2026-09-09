import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const part = await tdb.part.findUnique({
      where: { id },
      include: {
        movements: {
          include: { workOrder: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: { select: { quoteItems: true } },
      },
    })
    if (!part) return notFound('Repuesto no encontrado')
    return ok(part)
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Repuesto no encontrado')
    }
    return serverError('Error al obtener repuesto', e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const body = await req.json()

    const existing = await tdb.part.findUnique({ where: { id } })
    if (!existing) return notFound('Repuesto no encontrado')

    if (body.action === 'revert_movement') {
      // Revertir una salida de inventario vinculada a una orden:
      // devuelve el stock y elimina el movimiento (solo salidas 'out' de la orden indicada)
      const movementId = body.movementId
      if (!movementId) return badRequest('movementId es obligatorio')

      const movement = await db.inventoryMovement.findUnique({ where: { id: movementId } })
      if (!movement) return notFound('Movimiento no encontrado')
      if (movement.partId !== id) return badRequest('El movimiento no pertenece a este repuesto')
      if (movement.movementType !== 'out') return badRequest('Solo se pueden revertir salidas (out)')
      if (body.workOrderId && movement.workOrderId !== body.workOrderId) {
        return badRequest('El movimiento no pertenece a esta orden')
      }

      const result = await tdb.$transaction(async (tx) => {
        const updated = await tx.part.update({
          where: { id },
          data: { stock: { increment: movement.quantity } },
        })
        await tx.inventoryMovement.delete({ where: { id: movementId } })
        return updated
      })
      return ok(result)
    }

    if (body.action === 'adjust_stock') {
      // Ajuste de inventario
      const adjustment = Number(body.quantity)
      const newStock = existing.stock + adjustment
      if (newStock < 0) {
        return badRequest('Stock resultante no puede ser negativo')
      }

      const result = await tdb.$transaction(async (tx) => {
        const updated = await tx.part.update({
          where: { id },
          data: { stock: newStock },
        })
        await tx.inventoryMovement.create({
          data: {
            partId: id,
            movementType: body.movementType || 'adjustment',
            quantity: Math.abs(adjustment),
            reason: body.reason || 'Ajuste manual',
            unitCost: existing.unitCost,
            workOrderId: body.workOrderId || null,
            createdBy: body.createdBy || 'Sistema',
          },
        })
        return updated
      })
      return ok(result)
    }

    // Actualización normal
    const part = await tdb.part.update({
      where: { id },
      data: {
        name: body.name || undefined,
        description: body.description !== undefined ? body.description : undefined,
        category: body.category !== undefined ? body.category : undefined,
        applianceType: body.applianceType !== undefined ? body.applianceType : undefined,
        brand: body.brand !== undefined ? body.brand : undefined,
        compatibleBrands: body.compatibleBrands !== undefined
          ? (Array.isArray(body.compatibleBrands) ? JSON.stringify(body.compatibleBrands) : body.compatibleBrands)
          : undefined,
        model: body.model !== undefined ? body.model : undefined,
        voltage: body.voltage !== undefined ? body.voltage : undefined,
        powerWatts: body.powerWatts !== undefined ? body.powerWatts : undefined,
        gasType: body.gasType !== undefined ? body.gasType : undefined,
        dimensions: body.dimensions !== undefined ? body.dimensions : undefined,
        warranty: body.warranty !== undefined ? Number(body.warranty) : undefined,
        unit: body.unit || undefined,
        minStock: body.minStock !== undefined ? Number(body.minStock) : undefined,
        unitCost: body.unitCost !== undefined ? Number(body.unitCost) : undefined,
        unitPrice: body.unitPrice !== undefined ? Number(body.unitPrice) : undefined,
        location: body.location !== undefined ? body.location : undefined,
        active: body.active !== undefined ? body.active : undefined,
      },
    })
    return ok(part)
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Repuesto no encontrado')
    }
    return serverError('Error al actualizar repuesto', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const existing = await tdb.part.findUnique({ where: { id } })
    if (!existing) return notFound('Repuesto no encontrado')

    // Soft delete: marcar como inactivo en lugar de borrar
    const part = await tdb.part.update({
      where: { id },
      data: { active: false },
    })
    return ok(part)
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2025') {
      return notFound('Repuesto no encontrado')
    }
    return serverError('Error al desactivar repuesto', e)
  }
}
