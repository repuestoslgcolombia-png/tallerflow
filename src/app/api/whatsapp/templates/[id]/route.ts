import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const body = await req.json()

    const existing = await tdb.whatsAppTemplate.findUnique({ where: { id } })
    if (!existing) return notFound('Plantilla no encontrada')

    // Las plantillas del sistema solo pueden activarse/desactivarse
    if (existing.isSystem && body.body !== undefined && body.body !== existing.body) {
      return badRequest('Las plantillas del sistema no pueden editarse (solo activar/desactivar)')
    }

    const template = await tdb.whatsAppTemplate.update({
      where: { id },
      data: {
        name: body.name || undefined,
        category: body.category || undefined,
        subject: body.subject !== undefined ? body.subject : undefined,
        body: !existing.isSystem && body.body !== undefined ? body.body : undefined,
        active: body.active !== undefined ? body.active : undefined,
      },
    })

    return ok(template)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al actualizar plantilla', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { id } = await params
    const existing = await tdb.whatsAppTemplate.findUnique({ where: { id } })
    if (!existing) return notFound('Plantilla no encontrada')

    if (existing.isSystem) {
      return badRequest('Las plantillas del sistema no pueden eliminarse')
    }

    // Soft delete: desactivar en lugar de borrar
    const template = await tdb.whatsAppTemplate.update({
      where: { id },
      data: { active: false },
    })
    return ok(template)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al eliminar plantilla', e)
  }
}
