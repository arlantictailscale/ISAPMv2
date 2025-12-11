"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>("Processing your login...")

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[v0] Auth callback page mounted")
      console.log("[v0] Current URL:", window.location.href)
      console.log("[v0] Hash:", window.location.hash)

      try {
        const supabase = createClient()

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        if (accessToken) {
          console.log("[v0] Found access token in hash, setting session...")
          setStatus("Setting up your session...")

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          })

          if (sessionError) {
            console.error("[v0] Error setting session from hash:", sessionError)
            setError(sessionError.message)
            setTimeout(() => {
              router.push("/auth/login?error=" + encodeURIComponent(sessionError.message))
            }, 2000)
            return
          }

          if (data.session) {
            console.log("[v0] Session set successfully from hash")
            router.replace("/dashboard")
            return
          }
        }

        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")

        if (code) {
          console.log("[v0] Found code in URL, exchanging for session...")
          setStatus("Exchanging authorization code...")

          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error("[v0] Error exchanging code:", exchangeError)
            setError(exchangeError.message)
            setTimeout(() => {
              router.push("/auth/login?error=" + encodeURIComponent(exchangeError.message))
            }, 2000)
            return
          }

          if (data.session) {
            console.log("[v0] Session created from code exchange")
            router.replace("/dashboard")
            return
          }
        }

        console.log("[v0] Checking existing session...")
        setStatus("Verifying authentication...")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("[v0] Session error:", sessionError)
          setError(sessionError.message)
          setTimeout(() => {
            router.push("/auth/login?error=" + encodeURIComponent(sessionError.message))
          }, 2000)
          return
        }

        if (!session) {
          console.error("[v0] No session found in callback")
          setError("Authentication failed - no session")
          setTimeout(() => {
            router.push("/auth/login?error=no_session")
          }, 2000)
          return
        }

        const user = session.user
        console.log("[v0] User authenticated:", user.email)
        router.replace("/dashboard")
      } catch (err) {
        console.error("[v0] Callback error:", err)
        setError("An error occurred during authentication")
        setTimeout(() => {
          router.push("/auth/login?error=callback_failed")
        }, 2000)
      }
    }

    handleCallback()
  }, [router])

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
        <h2 className="text-lg font-semibold text-foreground">{status}</h2>
        <p className="text-sm text-foreground/60">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}
