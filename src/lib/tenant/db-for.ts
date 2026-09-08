import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

// ============== Extensión Prisma withTenant ==============
// Inyecta tenantId en cada consulta de modelos scoped, para que NINGUNA
// query API pueda leer/escribir fuera del taller de la sesión.
// - Operaciones de filtro (findMany/count/updateMany/...): where AND tenantId.
// - findUnique: se reescribe a findFirst con el predicado único + tenantId
//   (semántica equivalente, siempre scoped).
// - update/delete/upsert (where único): se VERIFICA pertenencia al tenant
//   antes de ejecutar. tenantId nunca cambia en filas existentes (se fija
//   al crear), así que el patrón verify-then-act es seguro aquí.
// - Modelos transitivos (eventos, items, payments) se alcanzan solo vía su
//   padre scoped; pasan sin tocar.

type TenantScopedModel =
  | 'customer'
  | 'device'
  | 'workOrder'
  | 'quote'
  | 'part'
  | 'repairGuide'
  | 'invoice'
  | 'monthlyAccounting'
  | 'reminder'
  | 'dailyTask'
  | 'whatsappTemplate'
  | 'automationRule'
  | 'workshopSetting'

const TENANT_SCOPED_MODELS = new Set<string>([
  'User',
  'Customer',
  'Device',
  'WorkOrder',
  'Quote',
  'Part',
  'RepairGuide',
  'Invoice',
  'MonthlyAccounting',
  'Reminder',
  'DailyTask',
  'WhatsAppTemplate',
  'WhatsAppConnection',
  'AutomationRule',
  'WorkshopSetting',
])

const FILTER_OPS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
])

const UNIQUE_OPS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'delete',
  'upsert',
])

function notFound(model: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    `Registro de ${model} no encontrado en este taller`,
    { code: 'P2025', clientVersion: '6.19.2', meta: { model } }
  )
}

/**
 * Cliente Prisma limitado a un tenant.
 * Casos deliberadamente globales (lookup por token público, onboarding,
 * resolución de membresía) usan `db` directo.
 */
export function dbFor(tenantId: string) {
  const base = db as any

  return db.$extends({
    name: 'withTenant',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (!model || !TENANT_SCOPED_MODELS.has(model)) {
            return query(args) // User, Tenant, TenantUser, eventos, items: no scoped
          }

          const a: any = args ?? {}

          if (FILTER_OPS.has(operation)) {
            a.where = { AND: [{ tenantId }, a.where ?? {}] }
            return query(a)
          }

          if (operation === 'create') {
            a.data = { ...a.data, tenantId }
            return query(a)
          }

          if (operation === 'createMany') {
            if (Array.isArray(a.data)) {
              a.data = a.data.map((d: any) => ({ ...d, tenantId }))
            } else if (a.data && typeof a.data === 'object') {
              a.data = { ...a.data, tenantId }
            }
            return query(a)
          }

          if (UNIQUE_OPS.has(operation)) {
            // a.where: WhereUniqueInput (p. ej. {id} o {tenantId_code:{...}})
            // 1) Verificar que el registro pertenece al tenant
            const exists = await base[model].findFirst({
              where: { AND: [{ tenantId }, a.where] },
              select: { id: true },
            })

            if (operation === 'upsert') {
              if (exists) {
                // rama update: registro verificado dentro del tenant
                return query(a)
              }
              // rama create: equivalente a upsert-create, con tenantId inyectado
              const { data: createData, ...rest } = a
              void rest
              return base[model].create({ ...a, data: { ...a.create, tenantId } })
            }

            if (!exists) throw notFound(model)

            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
              // Reescribir a findFirst scoped (equivalente, sin WhereUniqueInput)
              const op = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow'
              return base[model][op]({ ...a, where: { AND: [{ tenantId }, a.where] } })
            }

            return query(a) // update/delete: where único ya verificado en el tenant
          }

          return query(args)
        },
      },
    },
  })
}

// Utilidad para endpoints públicos (portal por token): tenant desde Customer
export async function tenantIdForCustomer(customerId: string): Promise<string | null> {
  const c = await db.customer.findUnique({ where: { id: customerId }, select: { tenantId: true } })
  return c?.tenantId ?? null
}
