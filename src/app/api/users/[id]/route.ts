import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

const VALID_ROLES = ['admin', 'technician', 'receptionist']

// PATCH /api/users/[id] - actualizar usuario (editar / activar / desactivar)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const existing = await tdb.user.findUnique({ where: { id } })
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

    const user = await tdb.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    })
    return ok(user)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al actualizar usuario', e)
  }
}
