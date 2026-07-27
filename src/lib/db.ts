import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_Zt3qk0ulpYfR@ep-broad-flower-ay0fe5d0.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
process.env.DIRECT_URL = 'postgresql://neondb_owner:npg_Zt3qk0ulpYfR@ep-broad-flower-ay0fe5d0.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaCacheKey?: string
}

// Cache key based on the most recently-generated Prisma Client. When the schema
// is updated and `prisma db push` regenerates the client, this file's mtime
// changes, so we detect a stale cache and rebuild the client.
import { statSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let clientKey = 'unknown'
try {
  const st = statSync(require.resolve('@prisma/client'))
  clientKey = `${st.mtimeMs}:${st.size}`
} catch {
  // ignore
}

// Silent: cache invalidation is handled below without logging

if (
  globalForPrisma.prisma &&
  (globalForPrisma.__prismaCacheKey !== clientKey ||
    typeof (globalForPrisma.prisma as any).reminder === 'undefined')
) {
  // Stale cache (schema changed). Drop the old client so a fresh one is built.
  console.log('[db.ts] busting stale cache')
  try {
    void globalForPrisma.prisma.$disconnect()
  } catch {
    // ignore
  }
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.__prismaCacheKey = clientKey
}