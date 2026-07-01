import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, created } from '@/lib/api'

// GET /api/whatsapp/templates - listar plantillas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') === 'true'

    const templates = await db.whatsAppTemplate.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(activeOnly ? { active: true } : {}),
      },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    })

    return ok(templates)
  } catch (e) {
    return serverError('Error al listar plantillas', e)
  }
}

// POST /api/whatsapp/templates - crear plantilla
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.code) return badRequest('Código es obligatorio')
    if (!body.name) return badRequest('Nombre es obligatorio')
    if (!body.body) return badRequest('Cuerpo del mensaje es obligatorio')

    const existing = await db.whatsAppTemplate.findUnique({ where: { code: body.code } })
    if (existing) return badRequest('Ya existe una plantilla con ese código')

    const template = await db.whatsAppTemplate.create({
      data: {
        code: body.code,
        name: body.name,
        category: body.category || 'general',
        subject: body.subject || null,
        body: body.body,
        active: body.active !== false,
        isSystem: false,
      },
    })

    return created(template)
  } catch (e) {
    return serverError('Error al crear plantilla', e)
  }
}
