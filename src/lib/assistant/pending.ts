'use server'

import {
  savePendingAction as redisSave,
  getPendingAction as redisGet,
  deletePendingAction as redisDelete,
  PendingActionData,
} from '../redis'

export interface PendingAction {
  id: string
  action: string
  entity: string
  resumen: string
  args: Record<string, unknown>
  createdAt: number
}

const TTL_MS = 60 * 60 * 1000 // 1 hora

let seq = 0

function bumpSeq(): number {
  return seq++
}

export async function createPendingAction(
  input: Omit<PendingAction, 'id' | 'createdAt'>
): Promise<PendingAction> {
  const id = `pa_${Date.now().toString(36)}_${bumpSeq().toString(36)}`
  const pa: PendingAction = { ...input, id, createdAt: Date.now() }

  // Save to Redis with TTL
  const redisData: PendingActionData = {
    pendingId: pa.id,
    action: pa.action,
    entity: pa.entity,
    resumen: pa.resumen,
    timestamp: pa.createdAt,
    payload: pa.args,
  }

  try {
    await redisDelete(pa.id)
  } catch {
    // Ignore if key doesn't exist
  }

  try {
    await redisUpdate(redisData)
  } catch (error) {
    console.error('[Hermes] Failed to save pending action to Redis:', error)
    // Optionally fall back to in-memory or throw
  }

  return pa
}

export async function getPendingAction(id: string): Promise<PendingAction | undefined> {
  try {
    const redisData = await redisGet(id)
    if (!redisData) return undefined

    // Check if expired
    if (Date.now() - redisData.timestamp > TTL_MS) {
      await redisDelete(id)
      return undefined
    }

    return {
      id: redisData.pendingId,
      action: redisData.action,
      entity: redisData.entity,
      resumen: redisData.resumen,
      args: (redisData.payload as Record<string, unknown>) || {},
      createdAt: redisData.timestamp,
    }
  } catch (error) {
    console.error('[Hermes] Failed to retrieve pending action from Redis:', error)
    return undefined
  }
}

export async function consumePendingAction(id: string): Promise<PendingAction | undefined> {
  const pa = await getPendingAction(id)
  if (pa) {
    try {
      await redisDelete(id)
    } catch (error) {
      console.error('[Hermes] Failed to delete pending action from Redis:', error)
    }
  }
  return pa
}

/**
 * Internal helper to save/update a pending action in Redis
 */
async function redisUpdate(data: PendingActionData): Promise<void> {
  await redisSave(data)
}
