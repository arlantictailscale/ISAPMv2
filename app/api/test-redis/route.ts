import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"

export async function GET() {
  const results: {
    envVarsSet: boolean
    connectionTest: boolean
    readWriteTest: boolean
    error?: string
    details?: Record<string, unknown>
  } = {
    envVarsSet: false,
    connectionTest: false,
    readWriteTest: false,
  }

  // Check env vars
  results.envVarsSet = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

  if (!results.envVarsSet) {
    results.error = "Redis environment variables not set"
    return NextResponse.json(results, { status: 500 })
  }

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })

    // Test connection with ping
    const pingResult = await redis.ping()
    results.connectionTest = pingResult === "PONG"

    // Test read/write
    const testKey = "v0-redis-test"
    const testValue = { timestamp: Date.now(), message: "Redis is working!" }

    await redis.set(testKey, testValue, { ex: 60 })
    const readBack = await redis.get<typeof testValue>(testKey)

    results.readWriteTest = readBack?.message === testValue.message
    results.details = {
      pingResult,
      writtenValue: testValue,
      readValue: readBack,
    }

    // Cleanup
    await redis.del(testKey)

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
        message: "Redis connection failed",
        ...results,
      },
      { status: 500 },
    )
  }
}
