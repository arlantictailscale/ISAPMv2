"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  user: { id: string; email: string } | null
  isAdmin?: boolean
}

/**
 * Client-side auth hook for dynamic pages
 * Use this sparingly - prefer server-side requireAuth for most cases
 */
export function useRequireAuth(redirectTo?: string): AuthState {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  })

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        const loginUrl = redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login"
        router.push(loginUrl)
        return
      }

      setState({
        isLoading: false,
        isAuthenticated: true,
        user: { id: user.id, email: user.email || "" },
      })
    }

    checkAuth()
  }, [router, redirectTo])

  return state
}

/**
 * Client-side admin auth hook
 * Redirects non-admin users to dashboard
 */
export function useRequireAdmin(redirectTo?: string): AuthState {
  const router = useRouter()
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    isAdmin: false,
  })

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        const loginUrl = redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/auth/login"
        router.push(loginUrl)
        return
      }

      // Check admin role
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!profile || profile.role !== "admin") {
        router.push("/dashboard")
        return
      }

      setState({
        isLoading: false,
        isAuthenticated: true,
        user: { id: user.id, email: user.email || "" },
        isAdmin: true,
      })
    }

    checkAuth()
  }, [router, redirectTo])

  return state
}

/**
 * Optional auth check - returns user if logged in, null if not
 * Does not redirect - useful for pages that show different content based on auth
 */
export function useOptionalAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  })

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        setState({
          isLoading: false,
          isAuthenticated: true,
          user: { id: user.id, email: user.email || "" },
          isAdmin: profile?.role === "admin",
        })
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
        })
      }
    }

    checkAuth()
  }, [])

  return state
}
