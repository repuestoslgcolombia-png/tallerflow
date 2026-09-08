import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/api'
import { createClient } from '@/utils/supabase/server'

// GET /api/auth/session — usuario actual + taller (tenant) activo
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ok({ user: null, tenant: null })
    }

    // Resuelve el tenant del usuario (multi-tenant: TenantUser)
    const membership = await db.tenantUser.findFirst({
      where: { userId: user.id, status: 'active' },
      include: { tenant: true },
    })

    return ok({
      user: { id: user.id, email: user.email, name: user.user_metadata?.name ?? null },
      tenant: membership ? { id: membership.tenant.id, name: membership.tenant.name, role: membership.role } : null,
    })
  } catch (e) {
    return serverError('Error al consultar la sesión', e)
  }
}

// POST /api/auth/session — sign out (limpia la sesión de Supabase)
export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    await supabase.auth.signOut()
    return ok({ signedOut: true })
  } catch (e) {
    return serverError('Error al cerrar sesión', e)
  }
}
