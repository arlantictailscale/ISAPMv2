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
      console.log("[v0] URL:", window.location.href)
      console.log("[v0] Hash:", window.location.hash)
      console.log("[v0] Search params:", Object.fromEntries(searchParams.entries()))

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

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href)

        if (exchangeError) {
          console.error("[v0] Auth exchange error:", exchangeError)
          setError(exchangeError.message)
          setTimeout(() => {
            router.push(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
          }, 2000)
          return
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setError("No session created")
          setTimeout(() => {
            router.push("/auth/login?error=no_session")
          }, 2000)
          return
        }

        const user = session.user

        const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", user.id).maybeSingle()

        if (!profile) {
          await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            email: user.email,
            role: "user",
          })
        }

        router.push("/dashboard")
      } catch (err) {
        console.error("[v0] Callback error:", err)
        setError("Authentication failed")
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
