import { Redis } from "@upstash/redis"

async function invalidateRoomCache() {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })

  const key = "room:availability"
  
  console.log("Invalidating room availability cache...")
  const result = await redis.del(key)
  console.log("Cache invalidation result:", result)
  
  // Also check if there are any other room-related keys
  const keys = await redis.keys("room:*")
  console.log("Found room-related keys:", keys)
  
  if (keys.length > 0) {
    for (const k of keys) {
      await redis.del(k)
      console.log("Deleted key:", k)
    }
  }
  
  console.log("Done!")
}

invalidateRoomCache().catch(console.error)
