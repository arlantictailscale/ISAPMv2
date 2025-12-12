"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Key, Mail, CheckCircle2, Shield, Lock } from "lucide-react"
import { toast } from "sonner"

export default function SecurityPage() {
  const [user, setUser] = useState<any>(null)
  const [providers, setProviders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isAddingPassword, setIsAddingPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadSecurityInfo = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      // Fetch user's authentication providers
      try {
        const response = await fetch("/api/auth/check-providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        })

        if (response.ok) {
          const { providers: userProviders } = await response.json()
          setProviders(userProviders)
        }
      } catch (error) {
        console.error("[v0] Error fetching providers:", error)
      }

      setIsLoading(false)
    }

    loadSecurityInfo()
  }, [supabase, router])

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    setIsAddingPassword(true)

    try {
      // Update user to add password authentication
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast.success("Password added successfully!", {
        description: "You can now login with your email and password.",
      })

      // Refresh providers list
      setProviders([...providers, "email"])
      setShowPasswordForm(false)
      setPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("[v0] Error adding password:", error)
      toast.error("Failed to add password", {
        description: error.message || "Please try again later.",
      })
    } finally {
      setIsAddingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading security settings...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const hasPasswordAuth = providers.includes("email")
  const hasGoogleAuth = providers.includes("google")

  return (
    <>
      <Navigation />
      <main className="pt-24 min-h-screen">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-10 h-10 text-primary" />
              <h1 className="font-display text-4xl sm:text-5xl font-bold">Account Security</h1>
            </div>
            <p className="text-lg text-muted-foreground">Manage your login methods and account security</p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Current Login Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Active Login Methods
                </CardTitle>
                <CardDescription>You can use any of these methods to sign in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Address */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{user?.email}</p>
                      <p className="text-xs text-muted-foreground">Your account email</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>

                {/* Google OAuth */}
                {hasGoogleAuth && (
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium">Google Sign-In</p>
                        <p className="text-xs text-muted-foreground">Sign in with your Google account</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                )}

                {/* Password Authentication */}
                {hasPasswordAuth ? (
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email & Password</p>
                        <p className="text-xs text-muted-foreground">Sign in with your password</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border border-dashed border-muted-foreground/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-muted-foreground">Email & Password</p>
                        <p className="text-xs text-muted-foreground">Not yet configured</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="text-primary"
                    >
                      {showPasswordForm ? "Cancel" : "Add Password"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Password Form */}
            {showPasswordForm && !hasPasswordAuth && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle>Add Password Authentication</CardTitle>
                  <CardDescription>
                    Set a password to enable email and password login in addition to Google sign-in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Re-enter your password"
                        required
                        minLength={8}
                      />
                    </div>
                    <Button type="submit" disabled={isAddingPassword} className="w-full">
                      {isAddingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding Password...
                        </>
                      ) : (
                        "Add Password"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Security Recommendations */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">Security Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Multiple login methods</strong> - Having both Google and password login provides backup
                    access to your account
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Strong passwords</strong> - Use at least 8 characters with a mix of letters, numbers, and
                    symbols
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Keep email secure</strong> - Your email is used for account recovery, so keep it protected
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
