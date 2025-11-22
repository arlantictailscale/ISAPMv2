"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("[v0] Session error:", sessionError)
          setError(sessionError.message)
          setTimeout(() => {
            router.push("/auth/login")
          }, 3000)
          return
        }

        if (!session) {
          console.error("[v0] No session found")
          setError("Authentication failed - no session")
          setTimeout(() => {
            router.push("/auth/login")
          }, 3000)
          return
        }

        const user = session.user

        // Check if this is a new user by checking if profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, created_at")
          .eq("id", user.id)
          .single()

        const isNewUser =
          !existingProfile || new Date().getTime() - new Date(existingProfile.created_at).getTime() < 60000 // Less than 1 minute old

        if (isNewUser) {
          console.log("[v0] New user detected, sending welcome email to:", user.email)

          // Send welcome email asynchronously (don't wait for it)
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

        // Redirect to dashboard
        router.push("/dashboard")
      } catch (err) {
        console.error("[v0] Callback error:", err)
        setError("An error occurred during authentication")
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
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
          <p className="text-xs text-foreground/60">Redirecting to login in a few seconds...</p>
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
