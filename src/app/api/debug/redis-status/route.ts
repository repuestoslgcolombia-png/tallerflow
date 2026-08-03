'use server'

import { getRedisClient } from '@/lib/redis'

export async function GET() {
  try {
    const redis = getRedisClient()

    // Test connection
    const pingResult = await redis.ping()

    // Get all pending action keys
    const pendingKeys = await redis.keys('hermes:pending:*')
    const pendingActions = await Promise.all(
      pendingKeys.map(async (key) => {
        const data = await redis.get(key)
        const ttl = await redis.ttl(key)
        return { key, data: data ? JSON.parse(data) : null, ttl }
      })
    )

    // Get L0 stream recent entries (last 10)
    const streamEntries = await redis.xrevrange('hermes:l0:stream', '+', '-', 'COUNT', 10)
    const l0Recent = streamEntries.map(([id, fields]) => ({
      id,
      data: Object.fromEntries(fields.flat().reduce((acc: any[], val, i) => (i % 2 === 0 ? [...acc, [val]] : [...acc.slice(0, -1), [...acc[acc.length - 1], val]]), [])),
    }))

    // Count total stream entries
    const streamInfo = await redis.xlen('hermes:l0:stream')

    return Response.json({
      status: 'ok',
      ping: pingResult,
      pendingActions: {
        count: pendingKeys.length,
        items: pendingActions,
      },
      l0Stream: {
        totalEntries: streamInfo,
        recentEntries: l0Recent,
      },
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
