"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import Link from "next/link"
import { isBefore, parseISO, format } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function Register() {
  const earlyBirdDeadline = parseISO("2027-01-20T23:59:59")
  const isEarlyBirdPeriod = isBefore(new Date(), earlyBirdDeadline)

  const registrationOptions = [
    {
      id: "cpd",
      label: "CPD (Continuing Professional Development) Courses (2 days)",
      date: "Thursday - Friday, April 16 - 17, 2026",
      participantTypes: [
        { id: "span", label: "Anesthesiologist", earlyBirdPrice: 4000000, normalPrice: 4500000, currency: "IDR" },
      ],
    },
    {
      id: "ws1",
      label: "WS 1 (Regenerative Pain Therapy)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        { id: "span", label: "Anesthesiologist", earlyBirdPrice: 3000000, normalPrice: 3500000, currency: "IDR" },
      ],
    },
    {
      id: "ws2",
      label: "WS 2 (Basic Interventional Pain Management (Musculoskeletal))",
      date: "Friday, April 17, 2026",
      participantTypes: [
        { id: "span", label: "Anesthesiologist", earlyBirdPrice: 2500000, normalPrice: 3000000, currency: "IDR" },
      ],
    },
    {
      id: "ws3",
      label: "WS 3 (Pediatric Essential Pain Management (EPM Lite) + TOT)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        { id: "span", label: "Anesthesiologist", earlyBirdPrice: 2000000, normalPrice: 2500000, currency: "IDR" },
        { id: "resident", label: "Resident", earlyBirdPrice: 1500000, normalPrice: 1750000, currency: "IDR" },
        {
          id: "dokter_umum",
          label: "General Practitioner",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          currency: "IDR",
        },
        { id: "perawat", label: "Nurse", earlyBirdPrice: 500000, normalPrice: 750000, currency: "IDR" },
      ],
    },
    {
      id: "ws4",
      label: "WS 4 (Adjunct Therapy for Pain Management)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        { id: "resident", label: "Resident", earlyBirdPrice: 1500000, normalPrice: 1750000, currency: "IDR" },
        {
          id: "dokter_umum",
          label: "General Practitioner",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          currency: "IDR",
        },
        { id: "perawat", label: "Nurse", earlyBirdPrice: 500000, normalPrice: 750000, currency: "IDR" },
        {
          id: "penata_anestesi",
          label: "Nurse Anesthetist",
          earlyBirdPrice: 500000,
          normalPrice: 750000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "ws5",
      label: "WS 5 (Developing a Pain Clinic)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        {
          id: "span_team",
          label: "Anesthesiologist and team, max 3 people",
          earlyBirdPrice: 4500000,
          normalPrice: 5000000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "ws6",
      label: "WS 6 (Cancer Pain)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        { id: "span", label: "Anesthesiologist", earlyBirdPrice: 2500000, normalPrice: 3000000, currency: "IDR" },
      ],
    },
    {
      id: "ws7",
      label: "WS 7 (Advanced Intervention of Pain Management)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        { id: "span", label: "Anesthesiologist", earlyBirdPrice: 9000000, normalPrice: 10000000, currency: "IDR" },
      ],
    },
    {
      id: "symposium",
      label: "Symposium",
      date: "Saturday, April 18, 2026",
      participantTypes: [
        { id: "span", label: "Anesthesiologist", earlyBirdPrice: 2500000, normalPrice: 3000000, currency: "IDR" },
        { id: "resident", label: "Resident", earlyBirdPrice: 1500000, normalPrice: 1750000, currency: "IDR" },
        {
          id: "dokter_umum",
          label: "General Practitioner",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          currency: "IDR",
        },
      ],
    },
  ]

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    institution: "",
    position: "",
    selectedEventId: registrationOptions[0].id,
    selectedParticipantTypeId: registrationOptions[0].participantTypes[0].id,
    amount: 0,
    currency: "IDR",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAuthCheckLoading, setIsAuthCheckLoading] = useState(true)
  const [participantTypeError, setParticipantTypeError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const isParticipantTypeAllowed = (participantTypeLabel: string, profilePosition: string): boolean => {
    if (!profilePosition) return false

    const normalizedPosition = profilePosition.toLowerCase().trim()
    const normalizedParticipantType = participantTypeLabel.toLowerCase().trim()

    // Match exact positions
    // Handle both English and Indonesian spellings (Anesthesiologist / Anestesiologist)
    if (normalizedPosition === "anesthesiologist" || normalizedPosition === "anestesiologist") {
      return (
        normalizedParticipantType.includes("anesthesiologist") || normalizedParticipantType.includes("anestesiologist")
      )
    }
    // Handle General Practitioner / Dokter Umum
    if (normalizedPosition === "general practitioner" || normalizedPosition === "dokter umum") {
      return (
        normalizedParticipantType.includes("general practitioner") || normalizedParticipantType.includes("dokter umum")
      )
    }
    // Handle Resident / Residen
    if (normalizedPosition === "resident" || normalizedPosition === "residen") {
      return normalizedParticipantType.includes("resident") || normalizedParticipantType.includes("residen")
    }
    // Handle Nurse / Perawat
    if (normalizedPosition === "nurse" || normalizedPosition === "perawat") {
      return normalizedParticipantType === "nurse" || normalizedParticipantType === "perawat" // Only exact match, not nurse anesthetist
    }
    // Handle Nurse Anesthetist / Penata Anestesi
    if (normalizedPosition === "nurse anesthetist" || normalizedPosition === "penata anestesi") {
      return (
        normalizedParticipantType.includes("nurse anesthetist") ||
        normalizedParticipantType.includes("penata anestesi") ||
        normalizedParticipantType === "nurse" ||
        normalizedParticipantType === "perawat"
      )
    }

    return false
  }

  const selectedEvent = registrationOptions.find((event) => event.id === formData.selectedEventId)
  const selectedParticipantType = selectedEvent?.participantTypes.find(
    (pt) => pt.id === formData.selectedParticipantTypeId,
  )

  useEffect(() => {
    if (selectedParticipantType) {
      const price = isEarlyBirdPeriod ? selectedParticipantType.earlyBirdPrice : selectedParticipantType.normalPrice
      setFormData((prev) => ({
        ...prev,
        amount: price,
        currency: selectedParticipantType.currency,
      }))
    }
  }, [formData.selectedEventId, formData.selectedParticipantTypeId, isEarlyBirdPeriod])

  useEffect(() => {
    if (!formData.position || !selectedParticipantType) {
      setParticipantTypeError(null)
      return
    }

    const isAllowed = isParticipantTypeAllowed(selectedParticipantType.label, formData.position)

    if (!isAllowed) {
      setParticipantTypeError(
        `Your profile position is "${formData.position}". You can only register as a ${formData.position} participant. Please select a matching participant type or update your profile.`,
      )
    } else {
      setParticipantTypeError(null)
    }
  }, [formData.position, selectedParticipantType])

  useEffect(() => {
    const checkUser = async () => {
      setIsAuthCheckLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        toast.error("You need to be logged in to register.")
        setIsAuthCheckLoading(false)
        return
      }

      setUser(user)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("[v0] Error loading profile:", profileError)
      }

      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        fullName: profile?.full_name || "",
        phone: profile?.phone || "",
        institution: profile?.institution || "",
        position: profile?.position || "",
      }))

      setIsAuthCheckLoading(false)
    }

    checkUser()
  }, [supabase, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newState = { ...prev, [name]: value }

      if (name === "selectedEventId") {
        const newSelectedEvent = registrationOptions.find((event) => event.id === value)
        if (newSelectedEvent && newSelectedEvent.participantTypes.length > 0) {
          newState.selectedParticipantTypeId = newSelectedEvent.participantTypes[0].id
        }
      }
      return newState
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (participantTypeError) {
      toast.error("Please select a participant type that matches your profile position.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const registrationTypeString = `${selectedEvent?.label} - ${selectedParticipantType?.label}`

      const nameParts = formData.fullName.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      const { data: registrationData, error: insertError } = await supabase
        .from("registrations")
        .insert([
          {
            user_id: user?.id || null,
            first_name: firstName,
            last_name: lastName,
            email: formData.email,
            phone: formData.phone,
            institution: formData.institution,
            position: formData.position,
            registration_type: registrationTypeString,
            status: "pending",
            amount: formData.amount,
            currency: formData.currency,
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Error inserting registration:", insertError)
        setError("Failed to save registration. Please try again.")
        toast.error("Failed to save registration: " + insertError.message)
        return
      }

      console.log("[v0] Registration saved, sending confirmation email...")

      try {
        console.log("[v0] Calling send-registration-email API with:", {
          email: formData.email,
          firstName: firstName,
          registrationType: registrationTypeString,
        })

        const emailResponse = await fetch("/api/send-registration-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            firstName: firstName,
            lastName: lastName,
            registrationType: registrationTypeString,
            amount: formData.amount,
            currency: formData.currency,
            registrationId: registrationData.id,
          }),
        })

        console.log("[v0] Email API response status:", emailResponse.status)

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({}))
          console.error("[v0] Failed to send registration email:", errorData)
        } else {
          console.log("[v0] Registration email sent successfully")
        }
      } catch (emailError) {
        console.error("[v0] Error sending registration email:", emailError)
        // Don't fail the registration if email fails
      }

      setSuccess(true)
      toast.success("Registration submitted successfully!")

      setTimeout(() => {
        router.push("/my-registrations")
      }, 1500)
    } catch (err) {
      console.error("[v0] Error in handleSubmit:", err)
      setError("An unexpected error occurred. Please try again.")
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isAuthCheckLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Register Now</h1>
            <p className="text-lg text-muted-foreground">Secure your spot at ISAPM National Meeting 2026</p>
            <p className="text-sm text-muted-foreground mt-4">
              Your registration will use information from your profile.{" "}
              <Link href="/profile" className="text-primary hover:underline font-semibold">
                Update profile
              </Link>{" "}
              if needed before registering.
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div>
              <h2 className="font-display text-2xl font-bold mb-6">Select Your Registration</h2>
              {isEarlyBirdPeriod && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                  <p className="font-semibold mb-2">Early Bird Discount Available!</p>
                  <p className="text-sm">
                    Register before {format(earlyBirdDeadline, "MMMM dd, yyyy")} to get special rates.
                  </p>
                </div>
              )}

              {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900">{error}</div>}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-900">
                  Registration submitted successfully! Redirecting to my-registrations page...
                </div>
              )}

              {participantTypeError && (
                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg text-amber-900">
                  <p className="font-semibold mb-2">⚠️ Participant Type Mismatch</p>
                  <p className="text-sm">{participantTypeError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="selectedEventId" className="block text-sm font-semibold mb-2">
                      Event / Workshop / Symposium *
                    </label>
                    <select
                      id="selectedEventId"
                      name="selectedEventId"
                      value={formData.selectedEventId}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-primary/20 rounded-lg bg-card text-foreground font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      {registrationOptions.map((event) => (
                        <option key={event.id} value={event.id} className="py-2 bg-card text-foreground">
                          {event.label} ({event.date})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEvent && selectedEvent.participantTypes.length > 1 && (
                    <div>
                      <label htmlFor="selectedParticipantTypeId" className="block text-sm font-semibold mb-2">
                        Participant Type *
                      </label>
                      <select
                        id="selectedParticipantTypeId"
                        name="selectedParticipantTypeId"
                        value={formData.selectedParticipantTypeId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border-2 border-primary/20 rounded-lg bg-card text-foreground font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary/40 transition-colors cursor-pointer"
                      >
                        {selectedEvent.participantTypes.map((pt) => (
                          <option key={pt.id} value={pt.id} className="py-2 bg-card text-foreground">
                            {pt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedParticipantType && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="font-semibold text-sm mb-1">Selected Price:</p>
                      <p className="text-lg font-bold text-primary">
                        {isEarlyBirdPeriod
                          ? formatPrice(selectedParticipantType.earlyBirdPrice, selectedParticipantType.currency) +
                            " (Early Bird)"
                          : formatPrice(selectedParticipantType.normalPrice, selectedParticipantType.currency) +
                            " (Normal)"}
                      </p>
                    </div>
                  )}

                  <div className="p-6 bg-card border border-border rounded-lg">
                    <h3 className="font-semibold text-lg mb-4">Registration Information (from your profile)</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-semibold">Name:</span> {formData.fullName}
                      </p>
                      <p>
                        <span className="font-semibold">Email:</span> {formData.email}
                      </p>
                      <p>
                        <span className="font-semibold">Phone:</span> {formData.phone || "Not provided"}
                      </p>
                      <p>
                        <span className="font-semibold">Institution:</span> {formData.institution || "Not provided"}
                      </p>
                      <p>
                        <span className="font-semibold">Position:</span> {formData.position || "Not provided"}
                      </p>
                    </div>
                    {(!formData.phone || !formData.institution || !formData.position) && (
                      <p className="text-sm text-amber-600 mt-4">
                        ⚠️ Please complete your profile information before registering.{" "}
                        <Link href="/profile" className="underline font-semibold">
                          Go to Profile
                        </Link>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !formData.phone ||
                    !formData.institution ||
                    !formData.position ||
                    !!participantTypeError
                  }
                  className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? "Saving Registration..." : "Complete Registration"}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  By registering, you agree to our terms and conditions. You will receive a confirmation email with
                  payment details.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
