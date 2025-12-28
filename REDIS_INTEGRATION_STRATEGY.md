# Redis Integration Strategy for ISAPM 2026

## Overview

This document outlines the comprehensive Redis integration strategy implemented to enhance application performance, reduce database load, and improve user experience.

## Current Implementation

### 1. Caching Layer (`lib/cache.ts`)

#### Core Functions
- `getCached<T>()` - Generic cache-aside pattern with TTL
- `getCachedMulti<T>()` - Batch operations using MGET
- `setCache<T>()` - Direct cache writes
- `invalidateCache()` - Single key invalidation
- `invalidateCacheMulti()` - Batch invalidation
- `invalidateCachePattern()` - Pattern-based invalidation using SCAN

#### TTL Constants
| TTL | Duration | Use Case |
|-----|----------|----------|
| SHORT | 30s | Rapidly changing data (cart) |
| DEFAULT | 60s | General caching |
| MEDIUM | 5min | Moderately changing data (webinar access) |
| LONG | 15min | Stable data (public stats) |
| VERY_LONG | 1hr | Rarely changing data |
| DAY | 24hr | Static data |
| SESSION | 7 days | Session data |

### 2. Domain-Specific Caching

#### User Profile Cache
- **Key Pattern**: `profile:role:{userId}`
- **TTL**: 5 minutes
- **Invalidation**: On role change via `invalidateUserProfileCache()`

#### Webinar Access Cache
- **Key Pattern**: `webinar:access:{userId}:{webinarId}`
- **TTL**: 5 minutes
- **Invalidation**: On payment verification

#### Cart Cache
- **Key Pattern**: `cart:{userId}`
- **TTL**: 30 seconds (short due to frequent changes)
- **Invalidation**: On cart modification

#### Room Availability Cache
- **Key Pattern**: `room:availability`
- **TTL**: 5 minutes
- **Invalidation**: On booking confirmation/cancellation

### 3. Rate Limiting

```typescript
const { allowed, remaining, resetIn } = await checkRateLimit(
  'api:user123',
  limit: 100,      // Max requests
  windowSeconds: 60 // Time window
)
```

### 4. Distributed Locking

```typescript
const { acquired, lockId } = await acquireLock('checkout:order123', 30)
if (acquired) {
  try {
    // Critical section
  } finally {
    await releaseLock('checkout:order123', lockId)
  }
}
```

### 5. Real-Time Analytics

- `incrementCounter()` - Page views, actions
- `trackActiveUser()` - Active user tracking with sorted sets
- `getActiveUserCount()` - Count users active in last N minutes

## Cache Invalidation Strategy

### Event-Driven Invalidation

| Event | Caches Invalidated |
|-------|-------------------|
| Payment Verified | webinar:access:*, user:orders:*, room:availability |
| Role Changed | profile:*, profile:role:* |
| Cart Modified | cart:* |
| Hotel Booking | room:availability |

### Pattern-Based Invalidation
Use `invalidateCachePattern()` sparingly for bulk invalidation:
```typescript
// Invalidate all webinar access for a user
await invalidateCachePattern(`webinar:access:${userId}:*`)
```

## Performance Benefits

### Expected Improvements
1. **Database Load**: ~40-60% reduction in read queries
2. **Response Time**: ~50-70% faster for cached endpoints
3. **Scalability**: Better handling of traffic spikes

### Key Optimizations
- Singleton Redis client (connection reuse)
- Pipeline operations for batch writes
- Fire-and-forget cache writes (non-blocking)
- SCAN instead of KEYS for pattern matching

## Best Practices

### DO
- Use appropriate TTLs based on data volatility
- Always handle cache misses gracefully
- Invalidate related caches together
- Use batch operations when possible
- Log cache errors for monitoring

### DON'T
- Cache user-specific sensitive data without encryption
- Use KEYS command in production (use SCAN)
- Set TTLs longer than necessary
- Forget to invalidate on data mutations
- Block on cache operations

## Monitoring

### Health Check Endpoint
```
GET /api/test-redis
```

Returns:
- Connection status
- Latency measurement
- Read/write test results

### Key Metrics to Monitor
- Cache hit/miss ratio
- Redis memory usage
- Connection count
- Command latency

## Future Enhancements

1. **Session Storage**: Move session data to Redis for stateless servers
2. **Pub/Sub**: Real-time notifications for admin events
3. **Leaderboards**: Redis sorted sets for ranking/competition features
4. **Queue System**: Background job processing with Redis lists
5. **Full-Page Caching**: Cache rendered pages for public routes
