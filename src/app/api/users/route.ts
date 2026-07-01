import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/api'

// GET /api/users - listar usuarios (técnicos disponibles)
export async function GET(_req: NextRequest) {
  try {
    const users = await db.user.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
      orderBy: { name: 'asc' },
    })
    return ok(users)
  } catch (e) {
    return serverError('Error al listar usuarios', e)
  }
}
