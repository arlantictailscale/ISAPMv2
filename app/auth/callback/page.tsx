"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading")
  const [message, setMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    const debug: string[] = []
    let isProcessed = false // Prevent duplicate processing/redirects
    let isMounted = true

    // Mobile detection for adjusted timing
    const userAgent = navigator.userAgent
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isMobileChrome =
      (isMobile && /Chrome/i.test(userAgent)) || /CriOS/i.test(userAgent) // CriOS = Chrome on iOS

    debug.push(`Full URL: ${window.location.href}`)
    debug.push(`Hash present: ${window.location.hash ? "Yes" : "No"}`)
    debug.push(`Search params: ${window.location.search || "(none)"}`)
    debug.push(`Mobile: ${isMobile ? "Yes" : "No"}`)
    debug.push(`Mobile Chrome: ${isMobileChrome ? "Yes" : "No"}`)
    debug.push(`Cookies enabled: ${navigator.cookieEnabled ? "Yes" : "No"}`)

    // Adjusted timeouts for mobile browsers (slower JS execution, network delays)
    const processingDelay = isMobileChrome ? 2000 : 1000
    const errorTimeout = isMobileChrome ? 8000 : 5000

    // Check for error in URL first
    const errorParam = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    if (errorParam) {
      debug.push(`URL Error: ${errorParam}`)
      setDebugInfo(debug)
      setStatus("error")
      setMessage(errorDescription || errorParam)
      return
    }

    // Helper to safely redirect only once
    const safeRedirect = (path: string) => {
      if (isProcessed || !isMounted) return
      isProcessed = true
      debug.push(`Redirecting to: ${path}`)
      setDebugInfo(debug)
      // Longer delay for mobile to ensure cookies are persisted
      setTimeout(
        () => {
          if (isMounted) router.push(path)
        },
        isMobileChrome ? 1000 : 500
      )
    }

    // Set up auth state listener FIRST - this handles hash fragments automatically
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isProcessed) return // Skip if already processed

      debug.push(`Auth event: ${event}`)
      console.log("[v0] Auth state change:", event, session?.user?.email)

      if (event === "SIGNED_IN" && session) {
        debug.push(`Signed in as: ${session.user.email}`)
        setStatus("success")
        setMessage("Email confirmed successfully!")
        safeRedirect("/auth/email-confirmed")
      } else if (event === "TOKEN_REFRESHED" && session) {
        debug.push("Token refreshed")
        safeRedirect("/dashboard")
      } else if (event === "USER_UPDATED" && session) {
        debug.push("User updated - email confirmed")
        setStatus("success")
        safeRedirect("/auth/email-confirmed")
      }
    })

    // Session check with retry logic for mobile reliability
    const checkSessionWithRetry = async (retries = 3): Promise<boolean> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        if (isProcessed) return true // Already handled

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          debug.push(`getSession attempt ${attempt} error: ${error.message}`)
          console.error("[v0] getSession error:", error)
        }

        if (session) {
          debug.push(`Session found for: ${session.user.email} (attempt ${attempt})`)
          debug.push(`Email confirmed: ${session.user.email_confirmed_at ? "Yes" : "No"}`)
          console.log("[v0] Session found:", session.user.email)
          setStatus("success")
          safeRedirect("/auth/email-confirmed")
          return true
        }

        // Wait before retry (increasing delay)
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
        }
      }
      return false
    }

    // Also try to get existing session after a delay
    const checkSession = async () => {
      // Wait for Supabase to process hash fragment (longer on mobile)
      await new Promise((resolve) => setTimeout(resolve, processingDelay))

      const sessionFound = await checkSessionWithRetry(isMobileChrome ? 4 : 3)

      if (!sessionFound && !isProcessed) {
        // If still no session after waiting, show error with debug info
        debug.push("No session established after retries")
        setDebugInfo(debug)

        // Wait longer before showing error to allow auth state change to fire
        setTimeout(() => {
          if (!isProcessed && isMounted && status === "loading") {
            setStatus("error")
            setMessage(
              isMobileChrome
                ? "Could not establish session. Please try closing and reopening your browser, or use a different browser."
                : "Could not establish session. The confirmation link may have expired."
            )
          }
        }, errorTimeout)
      }
    }

    checkSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router, searchParams, status])

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-lg w-full space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="text-lg font-semibold text-destructive text-center">Authentication Error</h2>
          <p className="text-sm text-foreground/80 text-center">{message}</p>

          <div className="mt-4 p-3 bg-muted rounded text-xs font-mono space-y-1">
            <p className="font-semibold text-foreground mb-2">Debug Info:</p>
            {debugInfo.map((line, i) => (
              <p key={i} className="text-foreground/70 break-all">
                {line}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <a
              href="/auth/login"
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-center text-sm font-medium"
            >
              Go to Login
            </a>
            <a
              href="/auth/sign-up"
              className="w-full py-2 px-4 bg-muted text-foreground rounded-md text-center text-sm font-medium"
            >
              Try Sign Up Again
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
      <div className="space-y-4 text-center max-w-lg w-full">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Confirming your email...</h2>
        <p className="text-sm text-foreground/60">Please wait a moment.</p>

        {debugInfo.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded text-xs font-mono space-y-1 text-left">
            <p className="font-semibold text-foreground mb-2">Processing:</p>
            {debugInfo.map((line, i) => (
              <p key={i} className="text-foreground/70 break-all">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
