import { NextRequest } from 'next/server'
import { getRedisClient } from '@/lib/redis'

// Rate limiting simple sobre Redis (ioredis + Upstash) con ventana fija.
// Si REDIS_URL no está disponible, degrada sin bloquear (fail-open) y solo
// registra en consola — el piloto no debe caerse porque Redis se caiga.

const WINDOW_SECONDS = 60

export interface RateLimitResult {
  allowed: boolean
  remaining: number
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = WINDOW_SECONDS
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient()
    const redisKey = `ratelimit:${key}`
    const count = await redis.incr(redisKey)
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds)
    }
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) }
  } catch (e) {
    // Fail-open: sin Redis no bloqueamos la app
    console.warn('[rate-limit] Redis no disponible, permitiendo:', key)
    return { allowed: true, remaining: limit }
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
