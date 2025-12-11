"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[v0] Auth callback page mounted")
      console.log("[v0] Full URL:", window.location.href)
      console.log("[v0] Hash:", window.location.hash)
      console.log("[v0] Search:", window.location.search)

      try {
        const supabase = createClient()

        const errorParam = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (errorParam) {
          console.error("[v0] Error in URL params:", errorParam, errorDescription)
          setError(errorDescription || errorParam)
          setTimeout(() => {
            router.push(`/auth/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
          }, 2000)
          return
        }

        // This works for both email confirmation (#access_token=...) and OAuth code exchange
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        console.log("[v0] Session check result:", { session: !!session, error: sessionError })

        if (sessionError) {
          console.error("[v0] Session error:", sessionError)
          setError(sessionError.message)
          setTimeout(() => {
            router.push(`/auth/login?error=${encodeURIComponent(sessionError.message)}`)
          }, 2000)
          return
        }

        if (!session) {
          const code = searchParams.get("code")

          if (code) {
            console.log("[v0] Found OAuth code, attempting exchange")
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
              console.error("[v0] Code exchange error:", exchangeError)
              setError(exchangeError.message)
              setTimeout(() => {
                router.push(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
              }, 2000)
              return
            }

            if (!data.session) {
              setError("No session created from code exchange")
              setTimeout(() => {
                router.push("/auth/login?error=no_session")
              }, 2000)
              return
            }
          } else {
            console.error("[v0] No session, code, or hash found")
            setError("No authentication data found")
            setTimeout(() => {
              router.push("/auth/login?error=no_auth_data")
            }, 2000)
            return
          }
        }

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (!currentSession) {
          setError("Failed to establish session")
          setTimeout(() => {
            router.push("/auth/login?error=session_failed")
          }, 2000)
          return
        }

        const user = currentSession.user
        console.log("[v0] User authenticated:", user.id, user.email)

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle()

        if (profileError) {
          console.error("[v0] Profile check error:", profileError)
        }

        if (!profile && !profileError) {
          console.log("[v0] Creating new profile for user")
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            email: user.email,
            role: "user",
          })

          if (insertError) {
            console.error("[v0] Profile creation error:", insertError)
          }
        }

        const type = searchParams.get("type")
        if (type === "signup" || window.location.hash.includes("type=signup")) {
          console.log("[v0] Signup confirmation detected, redirecting to success page")
          router.push("/auth/email-confirmed")
        } else {
          console.log("[v0] Redirecting to dashboard")
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("[v0] Callback error:", err)
        setError(err instanceof Error ? err.message : "Authentication failed")
        setTimeout(() => {
          router.push("/auth/login?error=callback_failed")
        }, 2000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">Authentication Error</h2>
          <p className="text-sm text-foreground/80">{error}</p>
          <p className="text-xs text-foreground/60">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Completing authentication...</h2>
        <p className="text-sm text-foreground/60">Please wait a moment.</p>
      </div>
    </div>
  )
}
