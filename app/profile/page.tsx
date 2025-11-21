"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: "",
    titleDegree: "",
    satuSehatName: "",
    satuSehatEmail: "",
    nik: "",
    phone: "",
    institution: "",
    position: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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
          titleDegree: profile.title_degree || "",
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: formData.fullName,
        title_degree: formData.titleDegree,
        satu_sehat_name: formData.satuSehatName,
        satu_sehat_email: formData.satuSehatEmail,
        nik: formData.nik,
        phone: formData.phone,
        institution: formData.institution,
        position: formData.position,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error("[v0] Error saving profile:", error)
        toast.error("Failed to save profile: " + error.message)
      } else {
        toast.success("Profile saved successfully!")
      }
    } catch (err) {
      console.error("[v0] Error in handleSubmit:", err)
      toast.error("An unexpected error occurred")
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
                <label className="block text-sm font-semibold mb-2">Titles/Degrees (Optional)</label>
                <input
                  type="text"
                  name="titleDegree"
                  value={formData.titleDegree}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Dr., Sp.An, M.Kes, Ph.D"
                />
                <p className="text-xs text-muted-foreground mt-1">Separate multiple titles with commas</p>
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

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
