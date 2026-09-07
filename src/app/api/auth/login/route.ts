import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { ok, badRequest, serverError } from '@/lib/api'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// POST /api/auth/login — inicio de sesión con email/password (setea cookies de sesión)
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 intentos por IP por minuto (frena fuerza bruta)
    const ip = getClientIp(req)
    const rl = await checkRateLimit(`login:${ip}`, 10, 60)
    if (!rl.allowed) {
      return badRequest('Demasiados intentos. Espera un momento.')
    }

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return badRequest('Correo y contraseña son obligatorios')
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      return badRequest('Credenciales inválidas')
    }

    return ok({
      user: { id: data.user.id, email: data.user.email },
    })
  } catch (e) {
    return serverError('Error al iniciar sesión', e)
  }
}
