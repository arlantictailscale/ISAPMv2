"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  role: string
  phone: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session cache with TTL
const SESSION_CACHE_KEY = "isapm_auth_session_cache"
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface CachedSession {
  user: User | null
  profile: UserProfile | null
  timestamp: number
}

function getCachedSession(): CachedSession | null {
  if (typeof window === "undefined") return null
  try {
    const cached = sessionStorage.getItem(SESSION_CACHE_KEY)
    if (!cached) return null
    const parsed: CachedSession = JSON.parse(cached)
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(SESSION_CACHE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function setCachedSession(user: User | null, profile: UserProfile | null) {
  if (typeof window === "undefined") return
  try {
    const cache: CachedSession = { user, profile, timestamp: Date.now() }
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage errors
  }
}

function clearCachedSession() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(SESSION_CACHE_KEY)
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isMounted = useRef(true)
  const isInitialized = useRef(false)
  const lastUserId = useRef<string | null>(null)
  const supabaseRef = useRef(createClient())

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabaseRef.current
        .from("profiles")
        .select("id, full_name, first_name, last_name, role, phone")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        console.error("[AuthContext] Error fetching profile:", error.message)
        return null
      }
      return data as UserProfile | null
    } catch (err) {
      console.error("[AuthContext] Failed to fetch profile:", err)
      return null
    }
  }, []) // No dependencies - uses ref

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    clearCachedSession()
    lastUserId.current = null
  }, [])

  const refreshAuth = useCallback(async () => {
    if (!isMounted.current) return

    setIsLoading(true)
    clearCachedSession()
    lastUserId.current = null

    try {
      const {
        data: { session: currentSession },
      } = await supabaseRef.current.auth.getSession()

      if (!isMounted.current) return

      if (currentSession?.user) {
        setUser(currentSession.user)
        setSession(currentSession)
        const userProfile = await fetchProfile(currentSession.user.id)
        if (isMounted.current) {
          setProfile(userProfile)
          setCachedSession(currentSession.user, userProfile)
          lastUserId.current = currentSession.user.id
        }
      } else {
        setUser(null)
        setSession(null)
        setProfile(null)
      }
    } catch (err) {
      console.error("[AuthContext] Refresh error:", err)
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [fetchProfile])

  useEffect(() => {
    isMounted.current = true
    const supabase = supabaseRef.current

    const initializeAuth = async () => {
      // Already initialized, skip
      if (isInitialized.current) return

      // Check cache first for instant UI
      const cached = getCachedSession()
      if (cached?.user) {
        setUser(cached.user)
        setProfile(cached.profile)
        lastUserId.current = cached.user.id
        setIsLoading(false)
      }

      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!isMounted.current) return

        if (sessionError) {
          console.error("[AuthContext] Session error:", sessionError.message)
          setUser(null)
          setSession(null)
          setProfile(null)
          clearCachedSession()
          setIsLoading(false)
          isInitialized.current = true
          return
        }

        if (currentSession?.user) {
          setUser(currentSession.user)
          setSession(currentSession)

          // Only fetch profile if user changed or no cached profile
          if (currentSession.user.id !== lastUserId.current) {
            const userProfile = await fetchProfile(currentSession.user.id)
            if (isMounted.current) {
              setProfile(userProfile)
              setCachedSession(currentSession.user, userProfile)
              lastUserId.current = currentSession.user.id
            }
          }
        } else {
          setUser(null)
          setSession(null)
          setProfile(null)
          clearCachedSession()
          lastUserId.current = null
        }

        if (isMounted.current) {
          setIsLoading(false)
          isInitialized.current = true
        }
      } catch (err) {
        console.error("[AuthContext] Auth initialization error:", err)
        if (isMounted.current) {
          setIsLoading(false)
          isInitialized.current = true
        }
      }
    }

    initializeAuth()

    // Single auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted.current) return

      if (event === "SIGNED_OUT") {
        setUser(null)
        setSession(null)
        setProfile(null)
        clearCachedSession()
        lastUserId.current = null
        setIsLoading(false)
        return
      }

      if (newSession?.user) {
        setUser(newSession.user)
        setSession(newSession)

        // Only fetch profile if user changed
        if (newSession.user.id !== lastUserId.current) {
          const userProfile = await fetchProfile(newSession.user.id)
          if (isMounted.current) {
            setProfile(userProfile)
            setCachedSession(newSession.user, userProfile)
            lastUserId.current = newSession.user.id
          }
        }
        setIsLoading(false)
      }
    })

    return () => {
      isMounted.current = false
      subscription?.unsubscribe()
    }
  }, [fetchProfile]) // Only depends on stable fetchProfile

  const isAdmin = profile?.role === "admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,
        refreshAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
