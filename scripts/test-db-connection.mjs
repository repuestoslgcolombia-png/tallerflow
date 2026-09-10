// Probar conexión directa a Neon con el DATABASE_URL actual
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const url = process.env.DATABASE_URL || ''

try {
  await db.$queryRaw`SELECT 1 as ok`
  console.log('LOCAL OK: conexión Neon funciona con el DATABASE_URL actual')
  const count = await db.tenantUser.count()
  console.log(`tenantUser count: ${count}`)
} catch (e) {
  console.log('LOCAL FALLO:', e?.message?.slice(0, 200))
} finally {
  await db.$disconnect()
}
