"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const errorParam = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")

      if (errorParam) {
        setError(`${errorParam}: ${errorDescription || "Authentication failed"}`)
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
        return
      }

      if (!code) {
        router.push("/auth/login")
        return
      }

      try {
        const response = await fetch("/api/auth/exchange-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || "Failed to complete authentication")
          setTimeout(() => {
            router.push("/auth/login")
          }, 3000)
          return
        }

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const type = searchParams.get("type")
          if (type === "signup") {
            try {
              console.log('[v0] Sending welcome email to:', user.email);
              
              const emailResponse = await fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: user.email,
                  userId: user.id,
                }),
              });

              console.log('[v0] Welcome email API response status:', emailResponse.status);
              
              if (!emailResponse.ok) {
                const errorData = await emailResponse.json().catch(() => ({}));
                console.error('[v0] Failed to send welcome email:', errorData);
              } else {
                console.log('[v0] Welcome email sent successfully');
              }
            } catch (emailError) {
              console.error('[v0] Error sending welcome email:', emailError);
            }
          }

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name, phone, institution, position, created_at')
              .eq('id', user.id)
              .single()

            const isProfileComplete = profile && 
              profile.first_name && 
              profile.last_name && 
              profile.phone && 
              profile.institution && 
              profile.position

            router.push("/dashboard")
          } catch (error) {
            router.push("/dashboard")
          }
        } else {
          router.push("/dashboard")
        }
      } catch (err) {
        setError("An error occurred during authentication")
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

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
