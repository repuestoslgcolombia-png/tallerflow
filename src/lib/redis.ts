import Redis from "ioredis";

// Singleton Redis client
let redisClient: Redis;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL env var not set");
    }
    const parsed = new URL(redisUrl);
    redisClient = new Redis({
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls:
        parsed.protocol === "rediss:" || redisUrl.includes("upstash.io")
          ? {}
          : undefined,
      connectTimeout: 30000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 5000);
        if (times > 10) return null; // Stop retrying after 10 attempts
        return delay;
      },
    });
  }
  return redisClient;
}

// ============================================================================
// L0: PendingAction Store (Redis key-value with TTL)
// ============================================================================

export interface PendingActionData {
  pendingId: string;
  action: string;
  entity: string;
  resumen: string;
  timestamp: number;
  payload?: unknown;
}

const PENDING_KEY_PREFIX = "hermes:pending:";
const PENDING_TTL_SECONDS = 3600; // 1 hour

/**
 * Save a pending action to Redis with 1h TTL
 */
export async function savePendingAction(data: PendingActionData): Promise<void> {
  const client = getRedisClient();
  const key = `${PENDING_KEY_PREFIX}${data.pendingId}`;
  await client.setex(key, PENDING_TTL_SECONDS, JSON.stringify(data));
}

/**
 * Retrieve a pending action from Redis
 */
export async function getPendingAction(
  pendingId: string
): Promise<PendingActionData | null> {
  const client = getRedisClient();
  const key = `${PENDING_KEY_PREFIX}${pendingId}`;
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Delete a pending action from Redis
 */
export async function deletePendingAction(pendingId: string): Promise<void> {
  const client = getRedisClient();
  const key = `${PENDING_KEY_PREFIX}${pendingId}`;
  await client.del(key);
}

/**
 * List all pending actions (for recovery/debugging)
 */
export async function listPendingActions(): Promise<PendingActionData[]> {
  const client = getRedisClient();
  const keys = await client.keys(`${PENDING_KEY_PREFIX}*`);
  const actions: PendingActionData[] = [];
  for (const key of keys) {
    const data = await client.get(key);
    if (data) {
      actions.push(JSON.parse(data));
    }
  }
  return actions;
}

// ============================================================================
// L0: Stream Logging (Redis Stream NDJSON format)
// ============================================================================

export interface L0LogEntry {
  type: "text" | "pending" | "error" | "done" | "action";
  timestamp: number;
  sessionId: string;
  content?: unknown;
}

const STREAM_KEY = "hermes:l0:stream";
const STREAM_MAX_LEN = 1000000; // ~1M entries = ~1.5-2GB at ~2KB per entry

/**
 * Append a message to the L0 stream
 */
export async function logL0(entry: L0LogEntry): Promise<string> {
  const client = getRedisClient();
  const streamId = await client.xadd(
    STREAM_KEY,
    "MAXLEN",
    "~",
    STREAM_MAX_LEN.toString(),
    "*",
    "data",
    JSON.stringify(entry)
  );
  return streamId;
}

/**
 * Retrieve L0 entries from Redis stream (last 48h)
 * Returns paginated results
 */
export async function getL0History(
  opts: { after?: string; limit?: number } = {}
): Promise<{
  entries: Array<{ id: string; data: L0LogEntry }>;
  nextCursor?: string;
}> {
  const client = getRedisClient();
  const limit = opts.limit ?? 100;
  const after = opts.after ?? "-"; // Start from beginning

  const results = await client.xread(
    "COUNT",
    limit.toString(),
    "STREAMS",
    STREAM_KEY,
    after
  );

  if (!results || results.length === 0) {
    return { entries: [] };
  }

  const [, entries] = results[0] as [
    string,
    Array<[string, Array<string>]>,
  ];
  const parsed = entries.map(([id, data]) => {
    const obj = data.reduce(
      (acc, _, i, arr) => {
        if (i % 2 === 0) {
          acc[arr[i]] = arr[i + 1];
        }
        return acc;
      },
      {} as Record<string, string>
    );
    return {
      id,
      data: JSON.parse(obj.data) as L0LogEntry,
    };
  });

  return {
    entries: parsed,
    nextCursor: parsed.length > 0 ? parsed[parsed.length - 1]!.id : undefined,
  };
}

/**
 * Get conversation history by sessionId
 */
export async function getSessionHistory(
  sessionId: string,
  opts: { limit?: number } = {}
): Promise<Array<{ id: string; data: L0LogEntry }>> {
  const client = getRedisClient();
  const limit = opts.limit ?? 1000;

  const results = await client.xread(
    "COUNT",
    limit.toString(),
    "STREAMS",
    STREAM_KEY,
    "-"
  );

  if (!results || results.length === 0) {
    return [];
  }

  const [, entries] = results[0] as [
    string,
    Array<[string, Array<string>]>,
  ];

  return entries
    .map(([id, data]) => {
      const obj = data.reduce(
        (acc, _, i, arr) => {
          if (i % 2 === 0) {
            acc[arr[i]] = arr[i + 1];
          }
          return acc;
        },
        {} as Record<string, string>
      );
      const logEntry = JSON.parse(obj.data) as L0LogEntry;
      return {
        id,
        data: logEntry,
      };
    })
    .filter((entry) => entry.data.sessionId === sessionId);
}

/**
 * Clean old entries from stream (for maintenance)
 */
export async function pruneL0Stream(olderThanMs: number): Promise<number> {
  const client = getRedisClient();
  const now = Date.now();
  const threshold = now - olderThanMs;

  const results = await client.xread(
    "COUNT",
    "1000",
    "STREAMS",
    STREAM_KEY,
    "-"
  );

  if (!results || results.length === 0) {
    return 0;
  }

  const [, entries] = results[0] as [
    string,
    Array<[string, Array<string>]>,
  ];

  let deletedCount = 0;
  for (const [id] of entries) {
    const timestamp = parseInt(id.split("-")[0]!);
    if (timestamp < threshold) {
      await client.xdel(STREAM_KEY, id);
      deletedCount++;
    }
  }

  return deletedCount;
}

// ============================================================================
// Health checks
// ============================================================================

export async function isRedisHealthy(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
