import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { ok, badRequest, serverError } from '@/lib/api'
import { createClient } from '@/utils/supabase/server'
import { seedTenantDefaults } from '@/lib/tenant/seed'

// POST /api/onboarding — crea un taller nuevo (tenant) para el usuario autenticado,
// o "reclama" el tenant piloto #1 (datos migrados) si es el taller del dueño.
//
// Body: { name: string, claimPilot?: boolean }
// - claimPilot=true: enlaza la cuenta al tenant_pilot_1 existente (dueño del taller actual).
// - si no: crea tenant nuevo con slug único + settings + plantillas + automatizaciones base.

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return badRequest('No autenticado')
    }

    const body = await req.json().catch(() => null)
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const claimPilot = body?.claimPilot === true

    if (!name || name.length < 3) {
      return badRequest('El nombre del taller debe tener al menos 3 caracteres')
    }

    // ¿Ya pertenece a un taller?
    const existing = await db.tenantUser.findFirst({
      where: { userId: user.id, status: 'active' },
    })
    if (existing) {
      return badRequest('Ya perteneces a un taller. Usa Configuración para gestionar miembros.')
    }

    if (claimPilot) {
      // Reclamar el tenant piloto (datos existentes del taller actual)
      const pilot = await db.tenant.findUnique({ where: { id: 'tenant_pilot_1' } })
      if (!pilot) {
        return badRequest('El taller piloto no existe')
      }
      const claimed = await db.tenantUser.findFirst({
        where: { tenantId: pilot.id, status: 'active' },
      })
      if (claimed) {
        return badRequest('El taller piloto ya tiene dueño')
      }

      await db.tenant.update({
        where: { id: pilot.id },
        data: { name },
      })
      await db.tenantUser.create({
        data: {
          userId: user.id,
          tenantId: pilot.id,
          role: 'owner',
          status: 'active',
          email: user.email,
        },
      })

      return ok({ tenant: { id: pilot.id, name, role: 'owner', claimed: true } })
    }

    // Taller nuevo: slug único desde el nombre
    const slugBase = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40)
    let slug = slugBase
    let n = 1
    while (await db.tenant.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${++n}`
    }

    // Creación transaccional: tenant + membresía owner + settings + semillas
    const tenant = await db.tenant.create({ data: { name, slug } })
    await db.tenantUser.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'owner',
        status: 'active',
        email: user.email,
      },
    })
    await seedTenantDefaults(tenant.id)

    return ok({ tenant: { id: tenant.id, name, slug, role: 'owner', claimed: false } })
  } catch (e) {
    return serverError('Error en el onboarding', e)
  }
}
