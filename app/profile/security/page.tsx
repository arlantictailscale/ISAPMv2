"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { addPasswordToAccount } from "@/app/actions/add-password"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Key, Mail, CheckCircle2, Shield, Lock, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function SecurityPage() {
  const [user, setUser] = useState<any>(null)
  const [providers, setProviders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isAddingPassword, setIsAddingPassword] = useState(false)
  const [hasExistingPassword, setHasExistingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false) // Declared passwordSuccess variable
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

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

      if (user.identities && user.identities.length > 0) {
        const userProviders = user.identities.map((identity: any) => identity.provider)
        setProviders(userProviders)

        const hasPasswordFlag = user.user_metadata?.has_password === true
        const hasEmailIdentity = userProviders.includes("email")
        const appMetaProviders = user.app_metadata?.providers || []
        const hasEmailInAppMeta = appMetaProviders.includes("email")
        const primaryProvider = user.app_metadata?.provider
        const primaryIsEmail = primaryProvider === "email"

        const hasPassword = hasPasswordFlag || hasEmailIdentity || hasEmailInAppMeta || primaryIsEmail

        setHasExistingPassword(hasPassword)
      }

      setIsLoading(false)
    }

    loadSecurityInfo()
  }, [router])

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match")
    } else {
      setPasswordError("")
    }
  }, [password, confirmPassword])

  const handlePasswordSubmit = async () => {
    // Validation
    if (!password || !confirmPassword) {
      toast.error("Please fill in both password fields")
      return
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match")
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long")
      return
    }

    if (!user?.email) {
      toast.error("Unable to get user email")
      return
    }

    console.log("[v0] handlePasswordSubmit called")
    console.log("[v0] password length:", password.length)
    console.log("[v0] confirmPassword length:", confirmPassword.length)
    console.log("[v0] user email:", user?.email)

    console.log("[v0] Validation passed, calling server action...")
    setIsAddingPassword(true)
    setPasswordError("")

    try {
      // Call server action that uses admin.updateUserById
      console.log("[v0] Calling addPasswordToAccount...")
      const result = await addPasswordToAccount(user.email, password)
      console.log("[v0] Server action result:", result)

      if (!result.success) {
        if (result.error?.includes("different from the old password")) {
          toast.error("New password must be different from your current password")
          setHasExistingPassword(true)
        } else {
          toast.error(result.error || "Failed to update password")
        }
      } else {
        toast.success(hasExistingPassword ? "Password changed successfully!" : "Password added successfully!")

        setHasExistingPassword(true)
        setShowPasswordForm(false)
        setPassword("")
        setConfirmPassword("")
        setPasswordSuccess(true) // Set passwordSuccess to true on successful password update

        if (!providers.includes("email")) {
          setProviders([...providers, "email"])
        }

        setUser((prev: any) => ({
          ...prev,
          user_metadata: {
            ...prev?.user_metadata,
            has_password: true,
          },
        }))
      }
    } catch (err) {
      console.error("[v0] Password update error:", err)
      toast.error("An unexpected error occurred")
    } finally {
      console.log("[v0] Setting isAddingPassword to false")
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

  const hasPasswordAuth = hasExistingPassword || passwordSuccess || providers.includes("email")
  const hasGoogleAuth = providers.includes("google")

  const canSubmit = password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Active Login Methods
                </CardTitle>
                <CardDescription>You can use any of these methods to sign in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {hasPasswordAuth ? (
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Email & Password</p>
                        <p className="text-xs text-muted-foreground">Sign in with your password</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="text-primary text-xs"
                      >
                        {showPasswordForm ? "Cancel" : "Change"}
                      </Button>
                    </div>
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

            {showPasswordForm && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle>{hasPasswordAuth ? "Change Password" : "Add Password Authentication"}</CardTitle>
                  <CardDescription>
                    {hasPasswordAuth
                      ? "Enter a new password to update your current password"
                      : "Set a password to enable email and password login in addition to Google sign-in"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="At least 8 characters"
                        minLength={8}
                      />
                      {password && password.length < 8 && (
                        <p className="text-xs text-amber-600 mt-1">Password must be at least 8 characters</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                          passwordError ? "border-red-500" : "border-input"
                        }`}
                        placeholder="Re-enter your password"
                        minLength={8}
                      />
                      {passwordError && (
                        <div className="flex items-center gap-1 mt-1 text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          <p className="text-xs">{passwordError}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handlePasswordSubmit}
                      disabled={!canSubmit || isAddingPassword}
                      className="w-full"
                    >
                      {isAddingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {hasPasswordAuth ? "Changing Password..." : "Adding Password..."}
                        </>
                      ) : hasPasswordAuth ? (
                        "Change Password"
                      ) : (
                        "Add Password"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
