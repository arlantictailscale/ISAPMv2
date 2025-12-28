import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCached, AUTH_TTL, invalidateCache } from "@/lib/cache"

export interface AuthUser {
  id: string
  email: string
  role?: string
}

export interface AuthResult {
  user: AuthUser
  isAdmin: boolean
}

/**
 * Server-side auth check for protected pages
 * Use this in page components instead of middleware auth
 * This is more CPU efficient as it only runs on protected pages
 * Uses Redis caching to reduce database calls for profile lookups
 */
export async function requireAuth(redirectTo?: string): Promise<AuthResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    const loginUrl = redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login"
    redirect(loginUrl)
  }

  const profile = await getCached(
    `profile:${user.id}`,
    async () => {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      return data
    },
    AUTH_TTL,
  )

  return {
    user: {
      id: user.id,
      email: user.email || "",
      role: profile?.role || "user",
    },
    isAdmin: profile?.role === "admin",
  }
}

/**
 * Server-side admin check for admin pages
 * Redirects non-admin users to dashboard
 */
export async function requireAdmin(redirectTo?: string): Promise<AuthResult> {
  const auth = await requireAuth(redirectTo)

  if (!auth.isAdmin) {
    redirect("/dashboard")
  }

  return auth
}

/**
 * Optional auth check - returns user if logged in, null if not
 * Does not redirect - useful for pages that show different content based on auth
 */
export async function getOptionalAuth(): Promise<AuthResult | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const profile = await getCached(
    `profile:${user.id}`,
    async () => {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      return data
    },
    AUTH_TTL,
  )

  return {
    user: {
      id: user.id,
      email: user.email || "",
      role: profile?.role || "user",
    },
    isAdmin: profile?.role === "admin",
  }
}

/**
 * Invalidate user's cached profile - call after role changes
 */
export async function invalidateUserProfile(userId: string): Promise<void> {
  await invalidateCache(`profile:${userId}`)
}
