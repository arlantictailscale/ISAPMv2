"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { addPasswordToAccount } from "@/app/actions/add-password"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  Settings,
  User,
  Palette,
  Globe,
  Bell,
  Shield,
  Lock,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Check,
  Mail,
  Smartphone,
  Calendar,
  Info,
  Eye,
  Trash2,
  Download,
  Key,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type SettingsSection = "account" | "appearance" | "language" | "notifications" | "security" | "privacy"

interface UserPreferences {
  theme: "light" | "dark" | "system"
  language: string
  timezone: string
  dateFormat: string
  emailNotifications: {
    updates: boolean
    reminders: boolean
    newsletter: boolean
    marketing: boolean
  }
  pushNotifications: boolean
  profileVisibility: "public" | "registered" | "private"
}

const defaultPreferences: UserPreferences = {
  theme: "system",
  language: "en",
  timezone: "Asia/Jakarta",
  dateFormat: "DD/MM/YYYY",
  emailNotifications: {
    updates: true,
    reminders: true,
    newsletter: false,
    marketing: false,
  },
  pushNotifications: true,
  profileVisibility: "registered",
}

const languages = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { value: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
]

const timezones = [
  { value: "Asia/Jakarta", label: "Jakarta (WIB, UTC+7)" },
  { value: "Asia/Makassar", label: "Makassar (WITA, UTC+8)" },
  { value: "Asia/Jayapura", label: "Jayapura (WIT, UTC+9)" },
  { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST, UTC+8)" },
  { value: "America/New_York", label: "New York (EST, UTC-5)" },
  { value: "Europe/London", label: "London (GMT, UTC+0)" },
]

const dateFormats = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-12-31)" },
]

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SettingsSection>("account")
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Security states
  const [providers, setProviders] = useState<string[]>([])
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isAddingPassword, setIsAddingPassword] = useState(false)
  const [hasExistingPassword, setHasExistingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      // Load saved preferences from user_metadata
      if (user.user_metadata?.preferences) {
        setPreferences({
          ...defaultPreferences,
          ...user.user_metadata.preferences,
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

    loadUser()
  }, [router])

  // Password validation
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match")
    } else {
      setPasswordError("")
    }
  }, [password, confirmPassword])

  // Apply theme effect
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement
      if (preferences.theme === "dark") {
        root.classList.add("dark")
      } else if (preferences.theme === "light") {
        root.classList.remove("dark")
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        if (prefersDark) {
          root.classList.add("dark")
        } else {
          root.classList.remove("dark")
        }
      }
    }

    applyTheme()

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (preferences.theme === "system") {
        applyTheme()
      }
    }
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [preferences.theme])

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }))
    setHasChanges(true)
  }

  const updateEmailNotification = (key: keyof UserPreferences["emailNotifications"], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value,
      },
    }))
    setHasChanges(true)
  }

  const savePreferences = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences,
        },
      })

      if (error) {
        toast.error("Failed to save preferences")
      } else {
        toast.success("Preferences saved successfully")
        setHasChanges(false)
      }
    } catch {
      toast.error("An error occurred while saving")
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

  const sidebarItems = [
    { id: "account" as const, label: "Account", icon: User },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "language" as const, label: "Language & Region", icon: Globe },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "privacy" as const, label: "Privacy & Data", icon: Lock },
  ]

  const hasPasswordAuth = hasExistingPassword || passwordSuccess || providers.includes("email")
  const hasGoogleAuth = providers.includes("google")
  const canSubmitPassword = password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 min-h-screen bg-background">
        {/* Header */}
        <section className="border-b border-border bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="font-display text-3xl sm:text-4xl font-bold">Settings</h1>
            </div>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <aside className="lg:w-64 flex-shrink-0">
              <nav className="space-y-1 lg:sticky lg:top-28">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                ))}
              </nav>

              {hasChanges && (
                <div className="lg:hidden mt-6">
                  <Button onClick={savePreferences} disabled={isSaving} className="w-full">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </aside>

            {/* Settings Content */}
            <div className="flex-1 min-w-0">
              {/* Account Section */}
              {activeSection === "account" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Your personal information associated with this account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                          {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-lg">{user?.user_metadata?.full_name || "User"}</p>
                          <p className="text-muted-foreground text-sm">{user?.email}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email Address</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                          </div>
                          <Button variant="outline" size="sm" disabled>
                            Change
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Full Name</p>
                            <p className="text-sm text-muted-foreground">
                              {user?.user_metadata?.full_name || "Not set"}
                            </p>
                          </div>
                          <Link href="/profile">
                            <Button variant="outline" size="sm">
                              Edit Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Account Status</CardTitle>
                      <CardDescription>Information about your account and registration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Account Created</p>
                            <p className="text-xs text-muted-foreground">
                              {user?.created_at
                                ? new Date(user.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Info className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Account ID</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {user?.id?.slice(0, 8)}...{user?.id?.slice(-4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === "appearance" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Theme</CardTitle>
                      <CardDescription>Choose how the website looks for you</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { value: "light", label: "Light", icon: Sun },
                          { value: "dark", label: "Dark", icon: Moon },
                          { value: "system", label: "System", icon: Monitor },
                        ].map((theme) => (
                          <button
                            key={theme.value}
                            onClick={() => updatePreference("theme", theme.value as "light" | "dark" | "system")}
                            className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                              preferences.theme === theme.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                preferences.theme === theme.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <theme.icon className="w-6 h-6" />
                            </div>
                            <span className={`font-medium ${preferences.theme === theme.value ? "text-primary" : ""}`}>
                              {theme.label}
                            </span>
                            {preferences.theme === theme.value && <Check className="w-5 h-5 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Language & Region Section */}
              {activeSection === "language" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Language</CardTitle>
                      <CardDescription>Select your preferred language for the interface</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => updatePreference("language", value)}
                      >
                        <SelectTrigger className="w-full sm:w-80">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              <span className="flex items-center gap-2">
                                <span>{lang.flag}</span>
                                <span>{lang.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Timezone</CardTitle>
                      <CardDescription>Set your timezone for accurate event times and schedules</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => updatePreference("timezone", value)}
                      >
                        <SelectTrigger className="w-full sm:w-80">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Date Format</CardTitle>
                      <CardDescription>Choose how dates are displayed throughout the site</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={preferences.dateFormat}
                        onValueChange={(value) => updatePreference("dateFormat", value)}
                      >
                        <SelectTrigger className="w-full sm:w-80">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          {dateFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Email Notifications
                      </CardTitle>
                      <CardDescription>Choose which emails you want to receive</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        {
                          key: "updates" as const,
                          label: "Conference Updates",
                          description: "Important updates about the conference, schedule changes, and announcements",
                        },
                        {
                          key: "reminders" as const,
                          label: "Event Reminders",
                          description: "Reminders about sessions you've registered for and upcoming deadlines",
                        },
                        {
                          key: "newsletter" as const,
                          label: "Newsletter",
                          description: "Monthly newsletter with news, articles, and resources about pain management",
                        },
                        {
                          key: "marketing" as const,
                          label: "Marketing & Promotions",
                          description: "Special offers, early bird discounts, and partner promotions",
                        },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <Label htmlFor={item.key} className="font-medium cursor-pointer">
                              {item.label}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                          <Switch
                            id={item.key}
                            checked={preferences.emailNotifications[item.key]}
                            onCheckedChange={(checked) => updateEmailNotification(item.key, checked)}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Push Notifications
                      </CardTitle>
                      <CardDescription>Receive push notifications on your device</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <Label htmlFor="push" className="font-medium cursor-pointer">
                            Enable Push Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Get notified about important updates even when you&apos;re not on the website
                          </p>
                        </div>
                        <Switch
                          id="push"
                          checked={preferences.pushNotifications}
                          onCheckedChange={(checked) => updatePreference("pushNotifications", checked)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Security Section - Integrated from /profile/security */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  {/* Active Login Methods */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Active Login Methods
                      </CardTitle>
                      <CardDescription>You can use any of these methods to sign in</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Email */}
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

                      {/* Google Sign-In */}
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

                      {/* Email & Password */}
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

                  {/* Password Form */}
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
                            disabled={!canSubmitPassword || isAddingPassword}
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

                  {/* Two-Factor Authentication */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>Add an extra layer of security to your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security (Coming Soon)
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Enable
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security Recommendations */}
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
                          <strong>Strong passwords</strong> - Use at least 8 characters with a mix of letters, numbers,
                          and symbols
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

              {/* Privacy & Data Section */}
              {activeSection === "privacy" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Profile Visibility
                      </CardTitle>
                      <CardDescription>Control who can see your profile information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Select
                        value={preferences.profileVisibility}
                        onValueChange={(value: "public" | "registered" | "private") =>
                          updatePreference("profileVisibility", value)
                        }
                      >
                        <SelectTrigger className="w-full sm:w-80">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <span className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Public - Anyone can view
                            </span>
                          </SelectItem>
                          <SelectItem value="registered">
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Registered - Only attendees
                            </span>
                          </SelectItem>
                          <SelectItem value="private">
                            <span className="flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Private - Only you
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Your Data
                      </CardTitle>
                      <CardDescription>Download or delete your account data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">Download Your Data</p>
                          <p className="text-sm text-muted-foreground">Get a copy of all your account data</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                        <div>
                          <p className="font-medium text-destructive">Delete Account</p>
                          <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                        </div>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Save Button - Desktop */}
              {hasChanges && (
                <div className="hidden lg:flex justify-end mt-8 pt-6 border-t border-border">
                  <Button onClick={savePreferences} disabled={isSaving} size="lg">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
