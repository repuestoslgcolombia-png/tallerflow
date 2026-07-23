import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, created } from '@/lib/api'

// GET /api/parts - listar repuestos
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const applianceType = searchParams.get('applianceType')
    const lowStock = searchParams.get('lowStock') === 'true'

    const parts = await db.part.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(brand ? { brand } : {}),
        ...(applianceType ? { applianceType } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { sku: { contains: search } },
                { description: { contains: search } },
                { brand: { contains: search } },
                { model: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { movements: true } },
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })

    // Filtrar por stock bajo si se solicita
    const result = lowStock ? parts.filter((p) => p.stock <= p.minStock) : parts

    return ok(result)
  } catch (e) {
    return serverError('Error al listar repuestos', e)
  }
}

// POST /api/parts - crear repuesto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.name) return badRequest('Nombre es obligatorio')
    if (!body.sku) return badRequest('SKU es obligatorio')

    const existing = await db.part.findUnique({ where: { sku: body.sku } })
    if (existing) return badRequest('Ya existe un repuesto con ese SKU')

    const part = await db.$transaction(async (tx) => {
      const p = await tx.part.create({
        data: {
          sku: body.sku,
          name: body.name,
          description: body.description || null,
          category: body.category || null,
          applianceType: body.applianceType || null,
          brand: body.brand || null,
          compatibleBrands: Array.isArray(body.compatibleBrands) ? JSON.stringify(body.compatibleBrands) : (body.compatibleBrands || null),
          model: body.model || null,
          voltage: body.voltage || null,
          powerWatts: body.powerWatts || null,
          gasType: body.gasType || null,
          dimensions: body.dimensions || null,
          warranty: body.warranty !== undefined ? Number(body.warranty) : null,
          unit: body.unit || 'unidad',
          stock: Number(body.stock) || 0,
          minStock: Number(body.minStock) || 0,
          unitCost: Number(body.unitCost) || 0,
          unitPrice: Number(body.unitPrice) || 0,
          location: body.location || null,
        },
      })

      // Si hay stock inicial, crear movimiento de entrada
      if (p.stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            partId: p.id,
            movementType: 'in',
            quantity: p.stock,
            reason: 'Stock inicial',
            unitCost: p.unitCost,
          },
        })
      }

      return p
    })

    return created(part)
  } catch (e) {
    return serverError('Error al crear repuesto', e)
  }
}
