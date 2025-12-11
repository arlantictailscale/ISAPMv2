"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[v0] Auth callback page mounted")
      console.log("[v0] Full URL:", window.location.href)
      console.log("[v0] Hash:", window.location.hash)
      console.log("[v0] Search:", window.location.search)

      try {
        const supabase = createClient()

        // Check for error in URL params
        const errorParam = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        if (errorParam) {
          console.error("[v0] Error in URL params:", errorParam, errorDescription)
          setStatus("error")
          setMessage(errorDescription || errorParam)
          setTimeout(() => {
            router.push(`/auth/login?error=${encodeURIComponent(errorDescription || errorParam)}`)
          }, 2000)
          return
        }

        // Check for OAuth code parameter (PKCE flow)
        const code = searchParams.get("code")

        if (code) {
          console.log("[v0] Found OAuth code, exchanging for session")
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error("[v0] Code exchange error:", exchangeError)
            setStatus("error")
            setMessage(exchangeError.message)
            setTimeout(() => {
              router.push(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
            }, 2000)
            return
          }

          if (data.session) {
            console.log("[v0] OAuth session established")
            setStatus("success")
            router.push("/dashboard")
            return
          }
        }

        // Check for hash fragment (Supabase email confirmation with access_token)
        const hash = window.location.hash
        if (hash && hash.includes("access_token")) {
          console.log("[v0] Found access_token in hash, letting Supabase handle it")

          // Wait for Supabase to process the hash
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()

          if (sessionError) {
            console.error("[v0] Session error after hash processing:", sessionError)
            setStatus("error")
            setMessage(sessionError.message)
            setTimeout(() => {
              router.push(`/auth/login?error=${encodeURIComponent(sessionError.message)}`)
            }, 2000)
            return
          }

          if (session) {
            console.log("[v0] Session established from hash")
            setStatus("success")

            // Check if this is a signup confirmation
            if (hash.includes("type=signup")) {
              router.push("/auth/email-confirmed")
            } else {
              router.push("/dashboard")
            }
            return
          }
        }

        // No code or hash, check if we already have a session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          console.log("[v0] Existing session found")
          setStatus("success")
          router.push("/dashboard")
          return
        }

        // No authentication data found
        console.error("[v0] No authentication data found")
        setStatus("error")
        setMessage("No authentication data found")
        setTimeout(() => {
          router.push("/auth/login?error=no_auth_data")
        }, 2000)
      } catch (err) {
        console.error("[v0] Callback error:", err)
        setStatus("error")
        setMessage(err instanceof Error ? err.message : "Authentication failed")
        setTimeout(() => {
          router.push("/auth/login?error=callback_failed")
        }, 2000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">Authentication Error</h2>
          <p className="text-sm text-foreground/80">{message}</p>
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
        <h2 className="text-lg font-semibold text-foreground">
          {status === "success" ? "Success!" : "Completing authentication..."}
        </h2>
        <p className="text-sm text-foreground/60">Please wait a moment.</p>
      </div>
    </div>
  )
}
