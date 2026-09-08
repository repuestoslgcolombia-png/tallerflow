import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, created, badRequest, serverError } from '@/lib/api'

const VALID_ROLES = ['admin', 'technician', 'receptionist']

// GET /api/users - listar usuarios (técnicos disponibles)
// ?all=1 incluye inactivos (para la gestión del equipo en Configuración)
export async function GET(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const showAll = req.nextUrl.searchParams.get('all') === '1'
    const users = await tdb.user.findMany({
      where: showAll ? { tenantId: session.tenantId } : { active: true, tenantId: session.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        active: true,
      },
      orderBy: { name: 'asc' },
    })
    return ok(users)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al listar usuarios', e)
  }
}

// POST /api/users - crear un usuario (técnico)
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()
    const name = String(body.name || '').trim()
    const phone = String(body.phone || '').trim()
    const role = body.role || 'technician'

    if (!name) return badRequest('El nombre es obligatorio')
    if (!phone) return badRequest('El número de WhatsApp es obligatorio')
    if (!VALID_ROLES.includes(role)) return badRequest('Rol no válido')

    const existing = await tdb.user.findFirst({ where: { phone, tenantId: session.tenantId } })
    if (existing) return badRequest('Ya existe un usuario con ese número de WhatsApp')

    // El modelo exige email único por taller; se autogenera placeholder desde el whatsapp
    const safePhone = phone.replace(/[^0-9]/g, '').slice(-12)
    const email = `tecnico-${safePhone || Math.random().toString(36).slice(2, 8)}@tallerflow.local`

    const user = await tdb.user.create({
      // tenantId lo inyecta dbFor() en runtime
      data: { name, phone, role, email },
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    } as any)
    return created(user)
  } catch (e: any) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    if (e?.code === 'P2002') {
      return badRequest('Ya existe un usuario con ese número de WhatsApp')
    }
    return serverError('Error al crear usuario', e)
  }
}
