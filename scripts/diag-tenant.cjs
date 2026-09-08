// Diagnóstico rápido de la tabla Tenant (temporal)
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const tenants = await db.tenant.findMany()
  console.log('Tenants:', JSON.stringify(tenants, null, 2))

  const raw = await db.$queryRaw`SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'Tenant' ORDER BY ordinal_position`
  console.log('Columnas Tenant:', JSON.stringify(raw, null, 2))

  const users = await db.$queryRaw`SELECT count(*)::int AS n FROM "User"`
  console.log('Users:', JSON.stringify(users))

  const userCols = await db.$queryRaw`SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'tenantId'`
  console.log('User.tenantId col:', JSON.stringify(userCols))

  const waCols = await db.$queryRaw`SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'WhatsAppConnection' AND column_name = 'tenantId'`
  console.log('WhatsAppConnection.tenantId col:', JSON.stringify(waCols))
}

main()
  .catch((e) => { console.error('FALLO:', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
