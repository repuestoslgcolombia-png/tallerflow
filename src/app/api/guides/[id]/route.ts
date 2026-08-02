import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, notFound } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const guide = await db.repairGuide.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        sourceWorkOrder: { select: { id: true, code: true } },
      },
    })
    if (!guide) return notFound('Guía no encontrada')
    return ok(guide)
  } catch (e) {
    return serverError('Error al obtener guía', e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.repairGuide.findUnique({ where: { id } })
    if (!existing) return notFound('Guía no encontrada')

    // Acción: incrementar uso (sugerencia consultada desde una orden)
    if (body.action === 'increment_usage') {
      const updated = await db.repairGuide.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      })
      return ok(updated)
    }

    // Acción: publicar (draft -> active). Si ya estaba activa y el contenido cambia,
    // se incrementa la versión. Activa una guía archivada.
    if (body.action === 'publish') {
      const data: any = { status: 'active' }
      if (existing.status === 'active') {
        data.version = { increment: 1 }
      }
      const updated = await db.repairGuide.update({ where: { id }, data })
      return ok(updated)
    }

    // Acción: archivar (soft delete)
    if (body.action === 'archive') {
      const updated = await db.repairGuide.update({
        where: { id },
        data: { status: 'retired' },
      })
      return ok(updated)
    }

    // Actualización normal de campos
    const updating = body as Record<string, unknown>
    const hasContentChange =
      updating.title !== undefined ||
      updating.summary !== undefined ||
      updating.applianceType !== undefined ||
      updating.brand !== undefined ||
      updating.model !== undefined ||
      updating.symptoms !== undefined ||
      updating.steps !== undefined ||
      updating.difficulty !== undefined ||
      updating.estimatedHours !== undefined ||
      updating.partsUsed !== undefined

    // Versionado: si la guía está activa y el contenido cambia, nueva versión
    let version = existing.version
    if (hasContentChange && existing.status === 'active') {
      version = existing.version + 1
    }

    const guide = await db.repairGuide.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        summary: body.summary !== undefined ? body.summary : undefined,
        applianceType: body.applianceType !== undefined ? body.applianceType : undefined,
        brand: body.brand !== undefined ? body.brand : undefined,
        model: body.model !== undefined ? body.model : undefined,
        symptoms: body.symptoms !== undefined
          ? (Array.isArray(body.symptoms) ? JSON.stringify(body.symptoms) : body.symptoms)
          : undefined,
        steps: body.steps !== undefined ? body.steps : undefined,
        difficulty: body.difficulty !== undefined ? body.difficulty : undefined,
        estimatedHours: body.estimatedHours !== undefined ? Number(body.estimatedHours) : undefined,
        partsUsed: body.partsUsed !== undefined
          ? (Array.isArray(body.partsUsed) ? JSON.stringify(body.partsUsed) : body.partsUsed)
          : undefined,
        status: body.status !== undefined ? body.status : undefined,
        ...(hasContentChange && existing.status === 'active' ? { version } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        sourceWorkOrder: { select: { id: true, code: true } },
      },
    })
    return ok(guide)
  } catch (e) {
    return serverError('Error al actualizar guía', e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await db.repairGuide.findUnique({ where: { id } })
    if (!existing) return notFound('Guía no encontrada')

    // Soft delete: archivar en lugar de borrar
    const guide = await db.repairGuide.update({
      where: { id },
      data: { status: 'retired' },
    })
    return ok(guide)
  } catch (e) {
    return serverError('Error al archivar guía', e)
  }
}
