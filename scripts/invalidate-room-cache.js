import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

async function invalidateRoomCache() {
  try {
    // Delete the room availability cache key
    const result = await redis.del("room-availability")
    console.log("Cache invalidation result:", result)
    
    // Also try to find and delete any related keys
    const keys = await redis.keys("room*")
    console.log("Found room-related cache keys:", keys)
    
    if (keys && keys.length > 0) {
      for (const key of keys) {
        const delResult = await redis.del(key)
        console.log(`Deleted key ${key}:`, delResult)
      }
    }
    
    console.log("Room availability cache invalidated successfully!")
  } catch (error) {
    console.error("Error invalidating cache:", error)
  }
}

invalidateRoomCache()
