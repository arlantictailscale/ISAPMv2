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
import { ArrowLeft, UserPlus, Mail, ArrowRight, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { checkAuthProvider } from "@/app/actions/check-auth-provider"

type ErrorType = "user_not_found" | "invalid_credentials" | "oauth_only" | "general" | null

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<ErrorType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showGoogleSuggestion, setShowGoogleSuggestion] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
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
    setShowGoogleSuggestion(false)
    setDebugInfo("Starting login...")

    try {
      const supabase = createClient()

      setDebugInfo("Attempting signInWithPassword...")
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] signInError:", signInError)
      console.log("[v0] signInError?.message:", signInError?.message)
      console.log("[v0] signInError?.code:", signInError?.code)

      if (signInError) {
        const errorMessage = signInError.message.toLowerCase()
        setDebugInfo(`Error received: "${signInError.message}" (code: ${signInError.code})`)

        console.log("[v0] Error message lowercase:", errorMessage)

        // Supabase returns "Invalid login credentials" for both:
        // 1. Wrong password on email accounts
        // 2. Attempting email login on OAuth-only accounts
        const isCredentialError =
          errorMessage.includes("invalid login credentials") ||
          errorMessage.includes("invalid credentials") ||
          signInError.code === "invalid_credentials"

        console.log("[v0] isCredentialError:", isCredentialError)
        setDebugInfo((prev) => prev + ` | isCredentialError: ${isCredentialError}`)

        if (isCredentialError) {
          setDebugInfo((prev) => prev + " | Calling checkAuthProvider...")
          console.log("[v0] Calling checkAuthProvider for:", email)

          try {
            const providerResult = await checkAuthProvider(email)

            console.log("[v0] providerResult:", providerResult)
            setDebugInfo((prev) => prev + ` | Result: ${JSON.stringify(providerResult)}`)

            if (providerResult.exists) {
              if (providerResult.isOAuthOnly) {
                // OAuth-only account - show Google sign-in suggestion
                console.log("[v0] Setting oauth_only error type")
                setErrorType("oauth_only")
                setError(`This account uses Google Sign-In only.`)
                setShowGoogleSuggestion(true)
                setDebugInfo((prev) => prev + " | SET TO OAUTH_ONLY")
              } else {
                // Account exists with password, so wrong password
                console.log("[v0] Setting invalid_credentials error type")
                setErrorType("invalid_credentials")
                setError("Incorrect password. Please try again or reset your password.")
              }
            } else {
              // No account exists
              console.log("[v0] Setting user_not_found error type")
              setErrorType("user_not_found")
              setError("No account found with this email address")
            }
          } catch (providerError) {
            console.error("[v0] Provider check failed:", providerError)
            setDebugInfo((prev) => prev + ` | Provider check FAILED: ${providerError}`)

            // Fallback: if Gmail address, suggest Google login
            if (email.toLowerCase().endsWith("@gmail.com")) {
              setErrorType("oauth_only")
              setError("This might be a Google Sign-In account. Try signing in with Google.")
              setShowGoogleSuggestion(true)
            } else {
              setErrorType("invalid_credentials")
              setError("Invalid email or password. Please check your credentials.")
            }
          }
        } else {
          setDebugInfo((prev) => prev + " | NOT a credential error, setting general")
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
      console.error("[v0] Login error:", error)
      setDebugInfo(`Catch block error: ${error}`)
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

              {debugInfo && (
                <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-xs font-mono break-all">
                  <strong>DEBUG:</strong> {debugInfo}
                </div>
              )}

              {error && errorType === "oauth_only" && (
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-2 shrink-0">
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-blue-900">Account found with Google Sign-In</p>
                      <p className="text-sm text-blue-800">
                        Your account <span className="font-medium">{email}</span> was created using Google. Please sign
                        in with Google below.
                      </p>
                      <p className="text-xs text-blue-700 mt-2">
                        Tip: You can add a password to your account from your profile settings after logging in.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                variant={showGoogleSuggestion ? "default" : "outline"}
                className={`w-full ${showGoogleSuggestion ? "ring-2 ring-blue-400 ring-offset-2 animate-pulse bg-blue-600 hover:bg-blue-700" : "bg-transparent"}`}
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
                        fill={showGoogleSuggestion ? "#fff" : "#4285F4"}
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill={showGoogleSuggestion ? "#fff" : "#34A853"}
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill={showGoogleSuggestion ? "#fff" : "#FBBC05"}
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill={showGoogleSuggestion ? "#fff" : "#EA4335"}
                      />
                    </svg>
                    {showGoogleSuggestion ? "Sign in with Google (Recommended)" : "Sign in with Google"}
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
