"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { addPasswordToAccount } from "@/app/actions/add-password"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, Save, Shield, User, Key, Mail, Lock, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "profile", label: "Profile Details", icon: User },
  { id: "security", label: "Security", icon: Shield },
]

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile")

  // Profile state
  const [formData, setFormData] = useState({
    fullName: "",
    satuSehatName: "",
    satuSehatEmail: "",
    nik: "",
    phone: "",
    institution: "",
    position: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Security state
  const [providers, setProviders] = useState<string[]>([])
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isAddingPassword, setIsAddingPassword] = useState(false)
  const [hasExistingPassword, setHasExistingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const supabase = createClient()

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    router.push(`/profile?tab=${tabId}`, { scroll: false })
  }

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        toast.error("You need to be logged in to access your profile.")
        return
      }

      setUser(user)

      // Load profile data
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

      if (error) {
        console.error("Error loading profile:", error)
        toast.error("Failed to load profile data")
      } else if (profile) {
        setFormData({
          fullName: profile.full_name || "",
          satuSehatName: profile.satu_sehat_name || "",
          satuSehatEmail: profile.satu_sehat_email || "",
          nik: profile.nik || "",
          phone: profile.phone || "",
          institution: profile.institution || "",
          position: profile.position || "",
        })
      }

      // Load security info
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

    loadProfile()
  }, [supabase, router])

  // Password match validation
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match")
    } else {
      setPasswordError("")
    }
  }, [password, confirmPassword])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (saveSuccess) setSaveSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSaving) {
      console.log("[v0] Already saving, ignoring submission")
      return
    }

    if (!formData.fullName.trim()) {
      toast.error("Full name is required")
      return
    }
    if (!formData.satuSehatName.trim()) {
      toast.error("Name on Satu Sehat Account is required")
      return
    }
    if (!formData.satuSehatEmail.trim()) {
      toast.error("Email registered on Satu Sehat Account is required")
      return
    }
    // Validate email format for satuSehatEmail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.satuSehatEmail)) {
      toast.error("Please enter a valid Satu Sehat email address")
      return
    }
    if (!formData.nik.trim() || formData.nik.length !== 16) {
      toast.error("NIK must be exactly 16 digits")
      return
    }
    if (!formData.phone.trim()) {
      toast.error("Phone number is required")
      return
    }
    if (!formData.institution.trim()) {
      toast.error("Institution is required")
      return
    }
    if (!formData.position) {
      toast.error("Please select your profession")
      return
    }

    setIsSaving(true)
    setSaveSuccess(false)

    const saveWithTimeout = new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Request timed out. Please check your connection and try again."))
      }, 15000)

      try {
        const { error, data } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            full_name: formData.fullName,
            satu_sehat_name: formData.satuSehatName,
            satu_sehat_email: formData.satuSehatEmail,
            nik: formData.nik,
            phone: formData.phone,
            institution: formData.institution,
            position: formData.position,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )

        clearTimeout(timeoutId)

        if (error) {
          reject(error)
        } else {
          resolve(data)
        }
      } catch (err) {
        clearTimeout(timeoutId)
        reject(err)
      }
    })

    try {
      await saveWithTimeout

      setSaveSuccess(true)
      toast.success("Profile saved successfully!", {
        description: "Your information has been updated.",
      })
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      if (err.message?.includes("timeout")) {
        toast.error("Request timed out", {
          description: "Please check your internet connection and try again.",
        })
      } else if (err.code === "PGRST301" || err.message?.includes("permission")) {
        toast.error("Permission denied", {
          description: "You don't have permission to update this profile. Please contact support.",
        })
      } else if (err.message?.includes("network") || err.message?.includes("fetch")) {
        toast.error("Network error", {
          description: "Unable to connect to the server. Please check your connection.",
        })
      } else {
        toast.error("Failed to save profile", {
          description: err.message || "Please try again later.",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSubmit = async () => {
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

    setIsAddingPassword(true)
    setPasswordError("")

    try {
      const result = await addPasswordToAccount(user.email, password)

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
        setPasswordSuccess(true)

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
      console.error("Password update error:", err)
      toast.error("An unexpected error occurred")
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
            <p className="text-muted-foreground">Loading profile...</p>
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
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-b border-border">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-8 h-8 text-primary" />
              <h1 className="font-display text-3xl sm:text-4xl font-bold">My Profile</h1>
            </div>
            <p className="text-muted-foreground">Manage your personal information and security settings</p>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="lg:w-64 flex-shrink-0">
                <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-card hover:bg-muted border border-border",
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </aside>

              <div className="flex-1 min-w-0">
                {/* Profile Details Tab */}
                {activeTab === "profile" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Details</CardTitle>
                      <CardDescription>
                        Save your information once and it will be automatically used for registrations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} noValidate className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Full Name + Titles/Degrees <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g., Dr. John Doe, Sp.An, M.Kes"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Include your full name with all professional titles and degrees
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Name on Satu Sehat Account <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="satuSehatName"
                            value={formData.satuSehatName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Name as registered on SATUSEHAT SDMK"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter your name exactly as it appears on your Satu Sehat SDMK account
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Email Registered on Satu Sehat Account <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="satuSehatEmail"
                            value={formData.satuSehatEmail}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="your.email@example.com"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Email address used for your Satu Sehat SDMK account
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            National ID Number (NIK) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="nik"
                            value={formData.nik}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="16 digit NIK"
                            maxLength={16}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Your Nomor Induk Kependudukan (16 digits)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">Login Email</label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            readOnly
                            className="w-full px-4 py-2 border border-input rounded-lg bg-muted cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Email used to login to this system (cannot be changed)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Mobile Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="+62 812 3456 7890"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Include country code (e.g., +62 for Indonesia)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Institution / Organization <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="institution"
                            value={formData.institution}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Your hospital or institution"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">
                            Profession <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select your profession</option>
                            <option value="Anestesiologist">Anestesiologist</option>
                            <option value="General Practitioner">General Practitioner</option>
                            <option value="Resident">Resident</option>
                            <option value="Nurse">Nurse</option>
                            <option value="Nurse Anesthetist">Nurse Anesthetist</option>
                            <option value="Medical Student">Medical Student</option>
                          </select>
                        </div>

                        <div className="relative">
                          {isSaving && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10">
                              <div className="flex items-center gap-2 text-primary">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">Saving your profile...</span>
                              </div>
                            </div>
                          )}

                          <Button
                            type="submit"
                            disabled={isSaving}
                            className={cn(
                              "w-full h-12 text-base font-semibold transition-all duration-300",
                              saveSuccess && "bg-emerald-600 hover:bg-emerald-700 text-white",
                            )}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : saveSuccess ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Profile Saved!
                              </>
                            ) : (
                              <>
                                <Save className="w-5 h-5 mr-2" />
                                Save Profile
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="space-y-6">
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
                                className={cn(
                                  "w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary",
                                  passwordError ? "border-red-500" : "border-input",
                                )}
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
                            <strong>Multiple login methods</strong> - Having both Google and password login provides
                            backup access to your account
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p>
                            <strong>Strong passwords</strong> - Use at least 8 characters with a mix of letters,
                            numbers, and symbols
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p>
                            <strong>Keep email secure</strong> - Your email is used for account recovery, so keep it
                            protected
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
