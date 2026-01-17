# Vercel Fluid Active CPU Optimization Guide

## Current Status Analysis

Based on the Vercel dashboard (Dec 18 '25 - Jan 17 '26):
- **Functions**: 55.9% (1h 45m) of CPU usage
- **Middleware**: 44.1% (1h 23m) of CPU usage

## Implemented Optimizations

### 1. Middleware Optimization (44% of CPU)

**Problem**: Middleware runs on every request and calls `supabase.auth.getUser()` which makes a database call.

**Solutions Implemented**:
- Public path detection using `Set` for O(1) lookups
- Early return for public paths (no auth check needed)
- Extended public paths to include more static routes
- Changed from `getUser()` to `getSession()` for lightweight JWT validation
- Added static file regex for fast path detection

### 2. Static Page Generation

**Already Optimized**:
- `/privacy-policy` - Static with daily revalidation
- `/terms-of-service` - Static with daily revalidation
- `/venue` - ISR (revalidate: 3600)

### 3. Redis Caching Layer

**Implemented Cache Helpers**:
- `getCachedRoomAvailability()` - 5 min TTL
- `getCachedUserOrders()` - 5 min TTL
- `getCachedWebinarAccess()` - 5 min TTL
- `getCachedCart()` - 30 sec TTL
- `getCachedPublicStats()` - 15 min TTL

### 4. Cache Invalidation Strategy

| Cache Type | TTL | Invalidation Trigger |
|------------|-----|---------------------|
| Profile Role | 5 min | Role change |
| Room Availability | 5 min | Booking confirmed/cancelled |
| Public Stats | 15 min | None (natural expiry) |
| User Orders | 5 min | Payment verified |
| Cart | 30 sec | Cart modification |
| Webinar Access | 5 min | Payment verified |

## Expected Results

After implementing all optimizations:
- **Middleware**: Expect 40-50% reduction (skip auth for public paths, use getSession)
- **Functions**: Expect 20-30% reduction (caching reduces DB calls)
- **Overall**: Target 35-40% total CPU reduction

## Monitoring

Check CPU impact after deployment:
1. Wait 24-48 hours for data collection
2. Compare middleware % vs function %
3. Target: 30% reduction in total CPU time
