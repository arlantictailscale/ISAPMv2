"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
  ExternalLink,
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

      setIsLoading(false)
    }

    loadUser()
  }, [router])

  // Apply theme effect
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement
      if (preferences.theme === "dark") {
        root.classList.add("dark")
      } else if (preferences.theme === "light") {
        root.classList.remove("dark")
      } else {
        // System preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        if (prefersDark) {
          root.classList.add("dark")
        } else {
          root.classList.remove("dark")
        }
      }
    }

    applyTheme()

    // Listen for system theme changes
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

  const sidebarItems = [
    { id: "account" as const, label: "Account", icon: User },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
    { id: "language" as const, label: "Language & Region", icon: Globe },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "privacy" as const, label: "Privacy & Data", icon: Lock },
  ]

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

              {/* Save Button - Mobile */}
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
                            Get notified about important updates even when you're not on the website
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

              {/* Security Section */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>Manage your account security and login methods</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Link
                        href="/profile/security"
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Password & Authentication</p>
                            <p className="text-sm text-muted-foreground">Manage your password and login methods</p>
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      </Link>

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

                  <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">Security Tip</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            We recommend enabling multiple login methods (Google + Password) for account recovery and
                            added security.
                          </p>
                        </div>
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
