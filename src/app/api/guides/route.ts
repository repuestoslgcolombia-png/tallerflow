import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError, created } from '@/lib/api'

// GET /api/guides - listar guías de la base de conocimiento
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const applianceType = searchParams.get('applianceType')
    const brand = searchParams.get('brand')
    const status = searchParams.get('status')

    const guides = await tdb.repairGuide.findMany({
      where: {
        ...(applianceType ? { applianceType } : {}),
        ...(brand ? { brand } : {}),
        ...(status && status !== 'all' ? { status } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
                { symptoms: { contains: search, mode: 'insensitive' } },
                { steps: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        sourceWorkOrder: { select: { id: true, code: true } },
      },
      orderBy: [{ updatedAt: 'desc' }],
    })

    return ok(guides)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al listar guías', e)
  }
}

// POST /api/guides - crear guía de reparación
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()

    if (!body.title) return badRequest('El título es obligatorio')
    if (!body.applianceType) return badRequest('El tipo de equipo es obligatorio')
    if (!body.steps) return badRequest('El procedimiento es obligatorio')

    // Sin autenticación: asignar el primer usuario activo como autor por defecto
    let authorId = body.authorId || null
    if (!authorId) {
      const firstUser = await tdb.user.findFirst({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true },
      })
      authorId = firstUser?.id || null
    }
    if (!authorId) return badRequest('No hay usuarios activos para asignar como autor')

    const guide = await tdb.repairGuide.create({
      data: {
        title: body.title,
        summary: body.summary || null,
        applianceType: body.applianceType,
        brand: body.brand || null,
        model: body.model || null,
        symptoms: Array.isArray(body.symptoms)
          ? JSON.stringify(body.symptoms)
          : body.symptoms || null,
        steps: body.steps,
        difficulty: body.difficulty || 'media',
        estimatedHours: Number(body.estimatedHours) || 0,
        partsUsed: Array.isArray(body.partsUsed)
          ? JSON.stringify(body.partsUsed)
          : body.partsUsed || null,
        status: body.status || 'draft',
        authorId,
        sourceWorkOrderId: body.sourceWorkOrderId || null,
      } as any,
      include: {
        author: { select: { id: true, name: true } },
        sourceWorkOrder: { select: { id: true, code: true } },
      },
    })

    return created(guide)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al crear guía', e)
  }
}
