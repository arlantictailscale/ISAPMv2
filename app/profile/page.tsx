"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, Save } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
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
  const router = useRouter()
  const supabase = createClient()

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

      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

      if (error) {
        console.error("[v0] Error loading profile:", error)
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

      setIsLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (saveSuccess) setSaveSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim()) {
      toast.error("Full name is required")
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
      }, 15000) // 15 second timeout

      try {
        console.log("[v0] Starting profile save for user:", user?.id)

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
          console.error("[v0] Supabase error:", error)
          reject(error)
        } else {
          console.log("[v0] Profile saved successfully:", data)
          resolve(data)
        }
      } catch (err) {
        clearTimeout(timeoutId)
        console.error("[v0] Unexpected error in save:", err)
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
      console.error("[v0] Error in handleSubmit:", err)

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

  return (
    <>
      <Navigation />
      <main className="pt-24 min-h-screen">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">My Profile</h1>
            <p className="text-lg text-muted-foreground">
              Save your information once and it will be automatically used for registrations
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <p className="text-xs text-muted-foreground mt-1">Your Nomor Induk Kependudukan (16 digits)</p>
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
                <p className="text-xs text-muted-foreground mt-1">Include country code (e.g., +62 for Indonesia)</p>
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
                  className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                    saveSuccess ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  }`}
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
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
