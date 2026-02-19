import { Redis } from "@upstash/redis"

// Initialize Redis client (singleton pattern for connection reuse)
let redisInstance: Redis | null = null

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redisInstance = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
      automaticDeserialization: true,
    })
  }

  return redisInstance
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 30, // 30 seconds - for rapidly changing data
  DEFAULT: 60, // 1 minute - default
  MEDIUM: 300, // 5 minutes - for moderately changing data
  LONG: 900, // 15 minutes - for stable data
  VERY_LONG: 3600, // 1 hour - for rarely changing data
  DAY: 86400, // 24 hours - for static data
  SESSION: 604800, // 7 days - for session data
} as const

// Cache key prefixes for organization
export const CACHE_PREFIX = {
  PROFILE: "profile:",
  PROFILE_ROLE: "profile:role:",
  ROOM: "room:",
  STATS: "stats:",
  WEBINAR: "webinar:",
  WEBINAR_ACCESS: "webinar:access:",
  ORDER: "order:",
  CART: "cart:",
  USER_ORDERS: "user:orders:",
  SESSION: "session:",
  RATE_LIMIT: "ratelimit:",
} as const

export { getRedis }

/**
 * Get data from cache or fetch and cache it
 * Uses stale-while-revalidate pattern for better performance
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.DEFAULT,
): Promise<T> {
  const redis = getRedis()

  if (!redis) {
    return fetcher()
  }

  try {
    // Try to get from cache
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const data = await fetcher()

    // Store in cache (fire and forget for faster response)
    redis.set(key, data, { ex: ttl }).catch(() => {})

    return data
  } catch {
    // Fallback to direct fetch on cache error
    return fetcher()
  }
}

/**
 * Get multiple cached values at once (batch operation)
 * More efficient than multiple individual gets
 */
export async function getCachedMulti<T>(
  keys: string[],
  fetcher: (missingKeys: string[]) => Promise<Map<string, T>>,
  ttl: number = CACHE_TTL.DEFAULT,
): Promise<Map<string, T>> {
  const redis = getRedis()
  const result = new Map<string, T>()

  if (!redis || keys.length === 0) {
    return fetcher(keys)
  }

  try {
    // Batch get all keys using MGET
    const cached = await redis.mget<(T | null)[]>(...keys)
    const missingKeys: string[] = []

    keys.forEach((key, index) => {
      if (cached[index] !== null) {
        result.set(key, cached[index] as T)
      } else {
        missingKeys.push(key)
      }
    })

    // Fetch missing data
    if (missingKeys.length > 0) {
      const freshData = await fetcher(missingKeys)

      // Store fresh data in cache using pipeline
      const pipeline = redis.pipeline()
      freshData.forEach((value, key) => {
        result.set(key, value)
        pipeline.set(key, value, { ex: ttl })
      })
      pipeline.exec().catch(() => {})
    }

    return result
  } catch {
    return fetcher(keys)
  }
}

/**
 * Invalidate a single cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(key)
  } catch {
    // Silently fail - cache invalidation is best effort
  }
}

/**
 * Invalidate multiple cache keys at once
 * More efficient than multiple individual deletes
 */
export async function invalidateCacheMulti(keys: string[]): Promise<void> {
  const redis = getRedis()
  if (!redis || keys.length === 0) return

  try {
    await redis.del(...keys)
  } catch {
    // Silently fail
  }
}

/**
 * Invalidate cache by pattern using SCAN (memory efficient)
 * Note: Use sparingly in production as KEYS can be expensive
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    // Use SCAN for memory-efficient pattern matching
    let cursor = 0
    const keysToDelete: string[] = []

    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
      cursor = Number(nextCursor)
      keysToDelete.push(...keys)
    } while (cursor !== 0)

    if (keysToDelete.length > 0) {
      // Delete in batches to avoid blocking
      const batchSize = 100
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize)
        await redis.del(...batch)
      }
    }
  } catch {
    // Silently fail
  }
}

/**
 * Set cache with custom options
 */
export async function setCache<T>(key: string, value: T, options?: { ex?: number; nx?: boolean }): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false

  try {
    const result = await redis.set(key, value, options)
    return result === "OK"
  } catch {
    return false
  }
}

/**
 * Get cache value directly
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return null

  try {
    return await redis.get<T>(key)
  } catch {
    return null
  }
}

/**
 * Increment a counter in cache (useful for rate limiting, stats)
 */
export async function incrementCache(key: string, ttl?: number): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0

  try {
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    if (ttl) {
      pipeline.expire(key, ttl)
    }
    const results = await pipeline.exec()
    return (results[0] as number) || 0
  } catch {
    return 0
  }
}

/**
 * Simple rate limiter using Redis
 * Returns true if action is allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redis = getRedis()
  const key = `${CACHE_PREFIX.RATE_LIMIT}${identifier}`

  if (!redis) {
    return { allowed: true, remaining: limit, resetIn: 0 }
  }

  try {
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.ttl(key)
    const results = await pipeline.exec()

    const count = (results[0] as number) || 1
    let ttl = (results[1] as number) || -1

    // Set expiry on first request
    if (ttl === -1) {
      await redis.expire(key, windowSeconds)
      ttl = windowSeconds
    }

    const allowed = count <= limit
    const remaining = Math.max(0, limit - count)

    return { allowed, remaining, resetIn: ttl }
  } catch {
    return { allowed: true, remaining: limit, resetIn: 0 }
  }
}

/**
 * Health check for Redis connection
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  const redis = getRedis()

  if (!redis) {
    return { connected: false, error: "Redis not configured" }
  }

  try {
    const start = Date.now()
    const result = await redis.ping()
    const latency = Date.now() - start

    return {
      connected: result === "PONG",
      latency,
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// =============================================================================
// =============================================================================

/**
 * Get user profile role with caching
 * Frequently accessed for auth checks - cache for 5 minutes
 */
export async function getCachedUserRole(userId: string, fetcher: () => Promise<string | null>): Promise<string | null> {
  const key = `${CACHE_PREFIX.PROFILE_ROLE}${userId}`
  return getCached(key, fetcher, CACHE_TTL.MEDIUM)
}

/**
 * Invalidate user profile cache (call when role changes)
 */
export async function invalidateUserProfileCache(userId: string): Promise<void> {
  await invalidateCacheMulti([`${CACHE_PREFIX.PROFILE}${userId}`, `${CACHE_PREFIX.PROFILE_ROLE}${userId}`])
}

/**
 * Get webinar access with caching
 * Cache for 5 minutes - invalidated on payment verification
 */
export async function getCachedWebinarAccess<T>(
  userId: string,
  webinarId: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const key = `${CACHE_PREFIX.WEBINAR_ACCESS}${userId}:${webinarId}`
  return getCached(key, fetcher, CACHE_TTL.MEDIUM)
}

/**
 * Invalidate webinar access cache for a user
 */
export async function invalidateWebinarAccessCache(userId: string, webinarId?: string): Promise<void> {
  if (webinarId) {
    await invalidateCache(`${CACHE_PREFIX.WEBINAR_ACCESS}${userId}:${webinarId}`)
  } else {
    // Invalidate all webinar access for user
    await invalidateCachePattern(`${CACHE_PREFIX.WEBINAR_ACCESS}${userId}:*`)
  }
}

/**
 * Get cart with caching
 * Short TTL since cart changes frequently
 */
export async function getCachedCart<T>(userId: string, fetcher: () => Promise<T>): Promise<T> {
  const key = `${CACHE_PREFIX.CART}${userId}`
  return getCached(key, fetcher, CACHE_TTL.SHORT)
}

/**
 * Invalidate cart cache
 */
export async function invalidateCartCache(userId: string): Promise<void> {
  await invalidateCache(`${CACHE_PREFIX.CART}${userId}`)
}

/**
 * Get user orders with caching
 */
export async function getCachedUserOrders<T>(userId: string, fetcher: () => Promise<T>): Promise<T> {
  const key = `${CACHE_PREFIX.USER_ORDERS}${userId}`
  return getCached(key, fetcher, CACHE_TTL.MEDIUM)
}

/**
 * Invalidate user orders cache
 */
export async function invalidateUserOrdersCache(userId: string): Promise<void> {
  await invalidateCache(`${CACHE_PREFIX.USER_ORDERS}${userId}`)
}

/**
 * Get room availability with caching
 */
export async function getCachedRoomAvailability<T>(fetcher: () => Promise<T>): Promise<T> {
  const key = `${CACHE_PREFIX.ROOM}availability`
  return getCached(key, fetcher, CACHE_TTL.MEDIUM)
}

/**
 * Invalidate room availability cache
 */
export async function invalidateRoomAvailabilityCache(): Promise<void> {
  await invalidateCache(`${CACHE_PREFIX.ROOM}availability`)
}

/**
 * Get public stats with caching (longer TTL)
 */
export async function getCachedPublicStats<T>(statKey: string, fetcher: () => Promise<T>): Promise<T> {
  const key = `${CACHE_PREFIX.STATS}${statKey}`
  return getCached(key, fetcher, CACHE_TTL.LONG)
}

// =============================================================================
// =============================================================================

/**
 * Acquire a distributed lock using Redis SETNX
 * Useful for preventing race conditions in critical operations
 */
export async function acquireLock(lockName: string, ttlSeconds = 30): Promise<{ acquired: boolean; lockId: string }> {
  const redis = getRedis()
  const lockId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const key = `lock:${lockName}`

  if (!redis) {
    return { acquired: true, lockId } // No Redis = no locking needed
  }

  try {
    const result = await redis.set(key, lockId, { nx: true, ex: ttlSeconds })
    return { acquired: result === "OK", lockId }
  } catch {
    return { acquired: false, lockId }
  }
}

/**
 * Release a distributed lock
 * Only releases if the lockId matches (to prevent releasing someone else's lock)
 */
export async function releaseLock(lockName: string, lockId: string): Promise<boolean> {
  const redis = getRedis()
  const key = `lock:${lockName}`

  if (!redis) return true

  try {
    const currentLockId = await redis.get<string>(key)
    if (currentLockId === lockId) {
      await redis.del(key)
      return true
    }
    return false
  } catch {
    return false
  }
}

// =============================================================================
// =============================================================================

/**
 * Increment a real-time counter (e.g., page views, active users)
 */
export async function incrementCounter(counterName: string, amount = 1): Promise<number> {
  const redis = getRedis()
  const key = `counter:${counterName}`

  if (!redis) return 0

  try {
    return await redis.incrby(key, amount)
  } catch {
    return 0
  }
}

/**
 * Get counter value
 */
export async function getCounter(counterName: string): Promise<number> {
  const redis = getRedis()
  const key = `counter:${counterName}`

  if (!redis) return 0

  try {
    const value = await redis.get<number>(key)
    return value || 0
  } catch {
    return 0
  }
}

/**
 * Track active users using Redis sorted sets
 * Score = timestamp, Member = userId
 */
export async function trackActiveUser(userId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const now = Date.now()
    const key = "active_users"

    // Add/update user with current timestamp
    await redis.zadd(key, { score: now, member: userId })

    // Remove users inactive for more than 5 minutes
    const cutoff = now - 5 * 60 * 1000
    await redis.zremrangebyscore(key, 0, cutoff)
  } catch {
    // Silently fail
  }
}

/**
 * Get count of active users in the last N minutes
 */
export async function getActiveUserCount(minutesAgo = 5): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0

  try {
    const cutoff = Date.now() - minutesAgo * 60 * 1000
    return await redis.zcount("active_users", cutoff, "+inf")
  } catch {
    return 0
  }
}
