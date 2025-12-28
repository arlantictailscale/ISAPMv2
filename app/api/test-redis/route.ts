import { NextResponse } from "next/server"
import { checkRedisHealth, getCached, invalidateCache, checkRateLimit, CACHE_TTL } from "@/lib/cache"

export async function GET() {
  const results: {
    health: Awaited<ReturnType<typeof checkRedisHealth>>
    cacheTest: boolean
    rateLimitTest: boolean
    details?: Record<string, unknown>
    error?: string
  } = {
    health: { connected: false },
    cacheTest: false,
    rateLimitTest: false,
  }

  try {
    results.health = await checkRedisHealth()

    if (!results.health.connected) {
      return NextResponse.json(
        {
          success: false,
          message: results.health.error || "Redis not connected",
          ...results,
        },
        { status: 500 },
      )
    }

    // Test cache operations
    const testKey = "v0-redis-test"
    const testValue = { timestamp: Date.now(), message: "Redis is working!" }

    // Test getCached
    const cached = await getCached(testKey, async () => testValue, CACHE_TTL.SHORT)
    results.cacheTest = cached.message === testValue.message

    // Test rate limiting
    const rateLimit = await checkRateLimit("test-endpoint", 100, 60)
    results.rateLimitTest = rateLimit.allowed

    results.details = {
      latency: `${results.health.latency}ms`,
      cachedValue: cached,
      rateLimit,
    }

    // Cleanup
    await invalidateCache(testKey)

    return NextResponse.json({
      success: true,
      message: "Redis is working correctly!",
      ...results,
    })
  } catch (error) {
    results.error = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        success: false,
        message: "Redis test failed",
        ...results,
      },
      { status: 500 },
    )
  }
}
