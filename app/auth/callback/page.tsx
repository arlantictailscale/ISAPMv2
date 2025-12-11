"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[v0] Auth callback page mounted")

      try {
        const supabase = createClient()

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")
        const type = hashParams.get("type")

        console.log("[v0] Hash params:", { hasAccessToken: !!accessToken, type })

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          console.log("[v0] Setting session from hash tokens")
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (setSessionError) {
            console.error("[v0] Error setting session:", setSessionError)
            setError(setSessionError.message)
            setTimeout(() => {
              router.push("/auth/login?error=" + encodeURIComponent(setSessionError.message))
            }, 2000)
            return
          }

          console.log("[v0] Session set successfully")
        }

        // Now check for the session
        console.log("[v0] Checking session...")
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

        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id, created_at, role")
          .eq("id", user.id)
          .single()

        if (!existingProfile && !profileError) {
          console.log("[v0] Creating profile for new user")
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            email: user.email,
            role: "user",
          })

          if (insertError) {
            console.error("[v0] Error creating profile:", insertError)
          }
        }

        const isNewUser =
          !existingProfile || new Date().getTime() - new Date(existingProfile.created_at).getTime() < 60000

        if (isNewUser) {
          console.log("[v0] New user detected, sending welcome email to:", user.email)

          // Send welcome email asynchronously
          fetch("/api/send-welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              userId: user.id,
              userName: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
            }),
          }).catch((error) => {
            console.error("[v0] Error sending welcome email:", error)
          })
        }

        if (type === "signup") {
          console.log("[v0] Email confirmed, redirecting to email-confirmed page")
          router.replace("/auth/email-confirmed")
        } else {
          console.log("[v0] Redirecting to dashboard")
          router.replace("/dashboard")
        }
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
        <h2 className="text-lg font-semibold text-foreground">Processing your login...</h2>
        <p className="text-sm text-foreground/60">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}
