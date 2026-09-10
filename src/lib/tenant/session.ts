import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from '@/lib/db'
import { createClient } from '@/utils/supabase/server'

// ============== Sesión + Tenant ==============
// Resuelve el usuario autenticado (Supabase) y SU tenant activo.
// Middleware ya rechazó sin sesión; aquí se resuelve la membresía para
// inyectar tenantId en TODAS las consultas vía dbFor(tenantId).

export interface TenantSession {
  userId: string
  email: string | null
  tenantId: string
  tenantName: string
  role: string
}

// Cache por-request (React cache): múltiples handlers comparten resolución
export const getTenantSession = cache(async (): Promise<TenantSession | null> => {
  let cookieStore
  try {
    cookieStore = await cookies()
  } catch {
    return null
  }
  try {
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const membership = await db.tenantUser.findFirst({
      where: { userId: user.id, status: 'active' },
      include: { tenant: true },
    })
    if (!membership) return null

    return {
      userId: user.id,
      email: user.email ?? null,
      tenantId: membership.tenantId,
      tenantName: membership.tenant.name,
      role: membership.role,
    }
  } catch (e) {
    // Un fallo de infra (p.ej. credenciales de BD mal rotadas) NO debe
    // reportarse como "no autenticado": loguearlo claramente para que el
    // diagnóstico sea obvio (401 sistematico con login OK = problema de BD).
    console.error('[getTenantSession] error resolviendo sesión:', e?.message ?? e)
    return null
  }
})

/**
 * Handler API: garantiza sesión con tenant.
 * 401 si no hay sesión, 403 si el usuario no pertenece a ningún taller
 * (debe completar onboarding) — la API nunca debe adivinar el tenant.
 */
export async function requireTenantSession(): Promise<TenantSession> {
  const session = await getTenantSession()
  if (!session) {
    throw new TenantSessionError('No autenticado', 401)
  }
  return session
}

export class TenantSessionError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}
