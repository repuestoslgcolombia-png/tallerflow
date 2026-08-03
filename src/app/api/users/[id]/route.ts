import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

const VALID_ROLES = ['admin', 'technician', 'receptionist']

// PATCH /api/users/[id] - actualizar usuario (editar / activar / desactivar)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) return notFound('Usuario no encontrado')

    const body = await req.json()
    const data: any = {}

    if (body.name !== undefined) data.name = String(body.name).trim()
    if (body.phone !== undefined) data.phone = String(body.phone).trim()
    if (body.role !== undefined) {
      if (!VALID_ROLES.includes(body.role)) return badRequest('Rol no válido')
      data.role = body.role
    }
    if (body.active !== undefined) data.active = Boolean(body.active)

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    })
    return ok(user)
  } catch (e) {
    return serverError('Error al actualizar usuario', e)
  }
}
