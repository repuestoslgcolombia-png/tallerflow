import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError } from '@/lib/api'

// GET /api/settings - obtener configuración del taller
export async function GET(_req: NextRequest) {
  try {
    let settings = await db.workshopSetting.findUnique({ where: { id: 'default' } })
    if (!settings) {
      settings = await db.workshopSetting.create({ data: { id: 'default' } })
    }
    return ok(settings)
  } catch (e) {
    return serverError('Error al obtener configuración', e)
  }
}

// PUT /api/settings - actualizar configuración
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.taxRate !== undefined && (Number(body.taxRate) < 0 || Number(body.taxRate) > 100)) {
      return badRequest('La tasa de impuesto debe estar entre 0 y 100')
    }

    let settings = await db.workshopSetting.findUnique({ where: { id: 'default' } })
    if (!settings) {
      settings = await db.workshopSetting.create({ data: { id: 'default' } })
    }

    const updated = await db.workshopSetting.update({
      where: { id: 'default' },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        email: body.email !== undefined ? body.email : undefined,
        address: body.address !== undefined ? body.address : undefined,
        taxRate: body.taxRate !== undefined ? Number(body.taxRate) : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        currencySymbol: body.currencySymbol !== undefined ? body.currencySymbol : undefined,
        logoUrl: body.logoUrl !== undefined ? body.logoUrl : undefined,
        warrantyPolicy: body.warrantyPolicy !== undefined ? body.warrantyPolicy : undefined,
      },
    })

    return ok(updated)
  } catch (e) {
    return serverError('Error al actualizar configuración', e)
  }
}
