# Security Implementation Without Heavy Middleware

## Overview

This document describes the middleware-free security architecture that significantly reduces CPU usage while maintaining security.

## Previous Architecture (High CPU)

```
Request → Middleware (getUser() = DB call) → Page (getUser() = DB call) → Response
```

- **Problem**: Every request to protected pages made 2 database calls
- **CPU Impact**: Middleware ran on ALL requests, even static assets

## New Architecture (Low CPU)

```
Request → Middleware (getSession() = JWT only) → Page (getUser() if needed) → Response
```

- **Improvement**: Middleware only validates JWT locally (no DB call)
- **Auth Check**: Moved to individual pages that need it
- **Redis Caching**: Profile lookups are cached to reduce DB calls further

## Implementation

### 1. Middleware (Minimal)

The middleware now only:
- Refreshes session cookies
- Validates JWT tokens locally (no database call)
- Does NOT redirect unauthenticated users

```typescript
// Only refreshes session, no auth check
await supabase.auth.getSession()
```

### 2. Page-Level Auth with Redis Caching (Server Components)

Protected pages use the `requireAuth()` or `requireAdmin()` helpers which cache profile lookups:

```typescript
// app/dashboard/page.tsx
import { requireAuth } from "@/lib/auth/require-auth"

export default async function DashboardPage() {
  const { user, isAdmin } = await requireAuth("/dashboard")
  // User is guaranteed to be authenticated here
  // Profile is cached in Redis for 2 minutes
}
```

### 3. Admin Pages

```typescript
// app/admin/users/page.tsx
import { requireAdmin } from "@/lib/auth/require-auth"

export default async function AdminUsersPage() {
  const { user } = await requireAdmin("/admin/users")
  // User is guaranteed to be admin here
}
```

### 4. Optional Auth (Public Pages with User Features)

```typescript
// app/pricing/page.tsx
import { getOptionalAuth } from "@/lib/auth/require-auth"

export default async function PricingPage() {
  const auth = await getOptionalAuth()
  // auth is null if not logged in, or contains user data
}
```

### 5. Invalidating Cached Profiles

When admin changes a user's role, invalidate their cached profile:

```typescript
import { invalidateUserProfile } from "@/lib/auth/require-auth"

// After updating user role in database
await invalidateUserProfile(userId)
```

## Redis Caching Strategy

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `profile:{userId}` | 2 min | User role/profile data |

The cache automatically falls back to direct database queries if Redis is unavailable.

## Security Trade-offs

| Aspect | Middleware Auth | Page-Level Auth |
|--------|-----------------|-----------------|
| CPU Usage | High (every request) | Low (only protected pages) |
| Response Time | Slower | Faster |
| Security | Centralized | Distributed |
| Maintainability | Single point | Multiple points |

## CPU Savings

- **Middleware**: Reduced from `getUser()` (DB call) to `getSession()` (JWT validation only)
- **Public Pages**: Zero auth overhead
- **Protected Pages**: Single auth call (was double)
- **Profile Lookups**: Cached in Redis (2 min TTL)

## Estimated Impact

- Middleware CPU: ~60-70% reduction
- Function CPU: ~30-40% reduction (no double auth + caching)
- Overall: ~50-60% total CPU reduction

## Migration Checklist

Pages that already call `getUser()` don't need changes - they already handle auth.
Pages that relied on middleware for protection need to add `requireAuth()`.

### Protected Pages (need auth):
- [x] /dashboard
- [x] /profile
- [x] /cart
- [x] /checkout
- [x] /my-orders
- [x] /my-events
- [x] /my-registrations
- [x] /my-posters
- [x] /my-webinars
- [x] /my-hotel-bookings
- [x] /submit-poster
- [x] /admin/* (all admin pages)

### Public Pages (no auth needed):
- [x] /
- [x] /pricing
- [x] /venue
- [x] /events
- [x] /webinar
- [x] /privacy-policy
- [x] /terms-of-service
- [x] /call-for-papers
