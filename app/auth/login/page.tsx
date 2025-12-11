"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowLeft, UserPlus, Mail, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

type ErrorType = "user_not_found" | "invalid_credentials" | "general" | null

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<ErrorType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get("error")
    if (urlError) {
      setError(decodeURIComponent(urlError))
      setErrorType("general")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setErrorType(null)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        const errorMessage = signInError.message.toLowerCase()

        // Check if user doesn't exist (Supabase returns "Invalid login credentials" for both cases)
        // We need to check if email exists in the system
        if (errorMessage.includes("invalid login credentials")) {
          // Check if the email exists by attempting to get user by email
          const { data: existingUser } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email.toLowerCase())
            .maybeSingle()

          if (!existingUser) {
            // User doesn't exist - show account creation prompt
            setErrorType("user_not_found")
            setError("No account found with this email address")
          } else {
            // User exists but password is wrong
            setErrorType("invalid_credentials")
            setError("Incorrect password. Please try again or reset your password.")
          }
        } else {
          setErrorType("general")
          setError(signInError.message)
        }
        return
      }

      if (!data.session) {
        setErrorType("general")
        setError("No session created. Please check your credentials.")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      console.error("Login error:", error)
      setErrorType("general")
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("An unexpected error occurred during login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAccount = () => {
    router.push(`/auth/sign-up?email=${encodeURIComponent(email)}`)
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError(null)
    setErrorType(null)

    try {
      const supabase = createClient()

      const redirectUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/api/auth/callback`

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (oauthError) {
        throw oauthError
      }
    } catch (error: unknown) {
      console.error("Google login error:", error)
      setErrorType("general")
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Failed to initiate Google login")
      }
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="w-full max-w-sm px-4 sm:px-0">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">Sign in to ISAPM 2026 Conference Portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
                <div className="text-right">
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && errorType === "user_not_found" && (
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">No account found</p>
                      <p className="text-sm text-muted-foreground">
                        We couldn&apos;t find an account with{" "}
                        <span className="font-medium text-foreground">{email}</span>. Would you like to create one?
                      </p>
                    </div>
                  </div>
                  <Button type="button" className="w-full gap-2" onClick={handleCreateAccount}>
                    <UserPlus className="h-4 w-4" />
                    Create Account
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Registration is quick and free</p>
                </div>
              )}

              {error && errorType === "invalid_credentials" && (
                <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-900">Incorrect password</AlertTitle>
                  <AlertDescription className="text-amber-800">
                    The password you entered is incorrect.{" "}
                    <Link href="/auth/forgot-password" className="font-medium underline hover:text-amber-900">
                      Reset your password
                    </Link>
                  </AlertDescription>
                </Alert>
              )}

              {error && errorType === "general" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  "Redirecting..."
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>

              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
