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
    const supabase = createClient()
    let isProcessed = false
    let isMounted = true

    // Check for error in URL first
    const errorParam = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    if (errorParam) {
      setStatus("error")
      setMessage(errorDescription || errorParam)
      return
    }

    // Fast redirect helper
    const redirect = (path: string) => {
      if (isProcessed || !isMounted) return
      isProcessed = true
      // Use window.location for faster, more reliable redirect
      window.location.href = path
    }

    // Listen for auth state changes (handles hash fragments automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isProcessed) return

      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        setStatus("success")
        setMessage("Authentication successful!")
        redirect("/dashboard")
      } else if (event === "TOKEN_REFRESHED" && session) {
        redirect("/dashboard")
      }
    })

    // Also check for existing session (covers OAuth returns)
    const checkSession = async () => {
      // Small delay to let Supabase process URL fragments
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (isProcessed) return

      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setStatus("success")
        redirect("/dashboard")
      } else {
        // Give auth state change time to fire
        setTimeout(() => {
          if (!isProcessed && isMounted) {
            setStatus("error")
            setMessage("Could not establish session. The link may have expired.")
          }
        }, 3000)
      }
    }

    checkSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, searchParams])

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground text-center">Authentication Error</h2>
          <p className="text-sm text-muted-foreground text-center">{message}</p>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href="/auth/login"
              className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-center text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </a>
            <a
              href="/auth/sign-up"
              className="w-full py-2.5 px-4 bg-muted text-foreground rounded-lg text-center text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Email Confirmed!</h2>
          <p className="text-sm text-foreground/60">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Signing you in...</h2>
        <p className="text-sm text-muted-foreground">Please wait a moment.</p>
      </div>
    </div>
  )
}
