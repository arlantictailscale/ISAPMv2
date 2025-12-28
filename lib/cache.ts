import { Redis } from "@upstash/redis"

// Initialize Redis client (only if configured)
const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null

// Cache TTL in seconds
export const DEFAULT_TTL = 60 // 1 minute
export const SHORT_TTL = 30 // 30 seconds
export const LONG_TTL = 300 // 5 minutes
export const AUTH_TTL = 120 // 2 minutes for auth data

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttl: number = DEFAULT_TTL): Promise<T> {
  if (!redis) {
    // No Redis configured, just fetch directly
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

    // Store in cache (don't await to not block response)
    redis.set(key, data, { ex: ttl }).catch(() => {})

    return data
  } catch {
    // Fallback to direct fetch on cache error
    return fetcher()
  }
}

export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return

  try {
    await redis.del(key)
  } catch {
    // Silently fail on cache errors - not critical
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!redis) return

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Silently fail on cache errors - not critical
  }
}
