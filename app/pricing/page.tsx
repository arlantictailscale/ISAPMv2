"use client"

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { isBefore, parseISO, format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChevronRight, AlertCircle, Gift, Zap } from "lucide-react"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { User } from "lucide-react"
import { EARLY_BIRD_DEADLINE } from "@/lib/data/event-pricing"
import { getAllEventQuotasWithStatus, type QuotaStatus } from "@/app/actions/get-event-quotas"

export default function PricingPage() {
  const earlyBirdDeadline = parseISO(EARLY_BIRD_DEADLINE)
  const isEarlyBirdPeriod = isBefore(new Date(), earlyBirdDeadline)

  const [user, setUser] = useState<any>(null)
  const [userProfession, setUserProfession] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)
  const [quotaStatuses, setQuotaStatuses] = useState<Record<string, QuotaStatus>>({})
  const [quotasLoading, setQuotasLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  // Load quotas on mount
  useEffect(() => {
    const loadQuotas = async () => {
      try {
        const quotas = await getAllEventQuotasWithStatus()
        const quotaMap: Record<string, QuotaStatus> = {}
        quotas.forEach((quota) => {
          quotaMap[quota.event_id] = quota
        })
        setQuotaStatuses(quotaMap)
      } catch (err) {
        console.error("[v0] Error loading quotas:", err)
      } finally {
        setQuotasLoading(false)
      }
    }

    loadQuotas()

    // Refresh quotas every 10 seconds for real-time updates
    const interval = setInterval(loadQuotas, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      setUser(user)

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("position")
        .eq("id", user.id)
        .maybeSingle()

      if (error) {
        console.error("[v0] Error loading profile:", error)
        toast.error("Failed to load your profile information")
      } else if (profile) {
        setUserProfession(profile.position)
      }

      setIsLoading(false)
    }

    loadUserProfile()
  }, [supabase])

  const professionToParticipantMap: Record<string, string[]> = {
    Anestesiologist: ["span", "span_team"],
    "General Practitioner": ["dokter_umum"],
    Resident: ["resident"],
    Nurse: ["perawat"],
    "Nurse Anesthetist": ["penata_anestesi"],
    "Medical Student": ["medical_student"],
  }

  const getEventColorScheme = (eventId: string) => {
    if (eventId === "cpd") {
      return {
        bgGradient: "from-purple-50 to-violet-50",
        borderColor: "border-purple-200",
        hoverBorder: "hover:border-purple-400",
        textColor: "text-purple-900",
        badgeBg: "bg-purple-100",
        badgeText: "text-purple-700",
        categoryLabel: "CPD",
      }
    } else if (eventId.startsWith("ws")) {
      return {
        bgGradient: "from-orange-50 to-amber-50",
        borderColor: "border-orange-200",
        hoverBorder: "hover:border-orange-400",
        textColor: "text-orange-900",
        badgeBg: "bg-orange-100",
        badgeText: "text-orange-700",
        categoryLabel: "Workshop",
      }
    } else if (eventId === "symposium") {
      return {
        bgGradient: "from-teal-50 to-emerald-50",
        borderColor: "border-teal-200",
        hoverBorder: "hover:border-teal-400",
        textColor: "text-teal-900",
        badgeBg: "bg-teal-100",
        badgeText: "text-teal-700",
        categoryLabel: "Symposium",
      }
    }
    return {
      bgGradient: "from-gray-50 to-slate-50",
      borderColor: "border-gray-200",
      hoverBorder: "hover:border-primary",
      textColor: "text-gray-900",
      badgeBg: "bg-gray-100",
      badgeText: "text-gray-700",
      categoryLabel: "Event",
    }
  }

  const registrationOptions = [
    {
      id: "cpd",
      label: "CPD (Continuing Professional Development) Courses (2 days)",
      date: "Thursday - Friday, April 16 - 17, 2026",
      participantTypes: [
        {
          id: "span",
          label: "Anesthesiologist",
          earlyBirdPrice: 4000000,
          normalPrice: 4500000,
          onSitePrice: 5000000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "ws1",
      label: "WS 1 (Regenerative Pain Therapy)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        {
          id: "span",
          label: "Anesthesiologist",
          earlyBirdPrice: 3000000,
          normalPrice: 3500000,
          onSitePrice: 4000000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "ws2",
      label: "WS 2 (Basic Interventional Pain Management (Musculoskeletal))",
      date: "Friday, April 17, 2026",
      participantTypes: [
        {
          id: "span",
          label: "Anesthesiologist",
          earlyBirdPrice: 2500000,
          normalPrice: 3000000,
          onSitePrice: 3500000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "ws3",
      label: "WS 3 (Pediatric Essential Pain Management (EPM Lite) + TOT)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        {
          id: "span",
          label: "Anesthesiologist",
          earlyBirdPrice: 2000000,
          normalPrice: 2500000,
          onSitePrice: 3000000,
          currency: "IDR",
        },
        {
          id: "resident",
          label: "Resident",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          onSitePrice: 2000000,
          currency: "IDR",
        },
        {
          id: "dokter_umum",
          label: "General Practitioner",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          onSitePrice: 2000000,
          currency: "IDR",
        },
        {
          id: "perawat",
          label: "Nurse",
          earlyBirdPrice: 500000,
          normalPrice: 750000,
          onSitePrice: 1000000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "ws4",
      label: "WS 4 (Adjunct Therapy for Pain Management)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        {
          id: "span",
          label: "Anesthesiologist",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          onSitePrice: 2000000,
          currency: "IDR",
        },
        {
          id: "resident",
          label: "Resident",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          onSitePrice: 2000000,
          currency: "IDR",
        },
        {
          id: "dokter_umum",
          label: "General Practitioner",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          onSitePrice: 2000000,
          currency: "IDR",
        },
        {
          id: "perawat",
          label: "Nurse",
          earlyBirdPrice: 500000,
          normalPrice: 750000,
          onSitePrice: 1000000,
          currency: "IDR",
        },
        {
          id: "penata_anestesi",
          label: "Nurse Anesthetist",
          earlyBirdPrice: 500000,
          normalPrice: 750000,
          onSitePrice: 1000000,
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
          label: "Anesthesiologist and team (team of 4 participants)",
          earlyBirdPrice: 6000000,
          normalPrice: 6500000,
          onSitePrice: 7000000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "ws6",
      label: "WS 6 (Cancer Pain)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        {
          id: "span",
          label: "Anesthesiologist",
          earlyBirdPrice: 2500000,
          normalPrice: 3000000,
          onSitePrice: 3500000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "ws7",
      label: "WS 7 (Advanced Intervention of Pain Management)",
      date: "Friday, April 17, 2026",
      participantTypes: [
        {
          id: "span",
          label: "Anesthesiologist",
          earlyBirdPrice: 9000000,
          normalPrice: 10000000,
          onSitePrice: 11000000,
          currency: "IDR",
        },
      ],
    },
    {
      id: "symposium",
      label: "Symposium",
      date: "Saturday, April 18, 2026",
      description: "Includes complimentary access to 4 pre-conference webinars",
      participantTypes: [
        {
          id: "span",
          label: "Anesthesiologist",
          earlyBirdPrice: 2500000,
          normalPrice: 3000000,
          onSitePrice: 3500000,
          currency: "IDR",
        },
        {
          id: "resident",
          label: "Resident",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          onSitePrice: 2000000,
          currency: "IDR",
        },
        {
          id: "dokter_umum",
          label: "General Practitioner",
          earlyBirdPrice: 1500000,
          normalPrice: 1750000,
          onSitePrice: 2000000,
          currency: "IDR",
        },
        {
          id: "perawat",
          label: "Nurse",
          earlyBirdPrice: 500000,
          normalPrice: 700000,
          onSitePrice: 1000000,
          currency: "IDR",
        },
        {
          id: "medical_student",
          label: "Medical Student",
          earlyBirdPrice: 500000,
          normalPrice: 700000,
          onSitePrice: 1000000,
          currency: "IDR",
        },
      ],
    },
  ]

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getFilteredParticipantTypes = (participantTypes: any[]) => {
    if (!user || !userProfession) {
      return participantTypes
    }

    const allowedIds = professionToParticipantMap[userProfession] || []
    return participantTypes.filter((pt) => allowedIds.includes(pt.id))
  }

  const getFilteredEvents = () => {
    return registrationOptions
      .map((event) => ({
        ...event,
        participantTypes: getFilteredParticipantTypes(event.participantTypes),
      }))
      .filter((event) => event.participantTypes.length > 0)
  }

  const filteredEvents = getFilteredEvents()

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading registration options...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 overflow-x-hidden">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5 pt-20 pb-[30px]">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Register for ISAPM 2026</h1>
            <p className="text-lg text-muted-foreground">
              Choose your registration package and secure your spot at ISAPM 8th National Meeting 2026. Select from CPD
              courses, workshops, and symposium options.
            </p>

            {isEarlyBirdPeriod && (
              <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <h2 className="font-display text-2xl font-bold mb-3">Early Bird Discount Available!</h2>
                <p className="text-lg">
                  Register before <span className="font-semibold">{format(earlyBirdDeadline, "MMMM dd, yyyy")}</span> to
                  secure special reduced rates. Don't miss out!
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>Important:</strong> On-site registration is available at a higher rate. Register online now to
                secure the best price and guarantee your participation.
              </p>
            </div>

            {user && userProfession && (
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
                <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary mb-1">Showing options for: {userProfession}</p>
                  <p className="text-xs text-muted-foreground">
                    Registration options are tailored to your profession. If you need to access options for a different
                    profession, please update your profile.
                  </p>
                </div>
              </div>
            )}

            {user && !userProfession && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-900 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900 mb-1">Complete Your Profile</p>
                  <p className="text-xs text-yellow-800 mb-2">
                    Please complete your profile with your profession to see personalized registration options.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white hover:bg-yellow-50"
                    onClick={() => router.push("/profile")}
                  >
                    Complete Profile
                  </Button>
                </div>
              </div>
            )}

            {!user && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-900 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Login Required</p>
                  <p className="text-xs text-blue-800 mb-2">
                    Please login to see profession-specific pricing and registration options tailored for you.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white hover:bg-blue-50"
                    onClick={() => router.push("/auth/login")}
                  >
                    Login
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 pt-[30px]">
          <div className="max-w-6xl mx-auto space-y-12">
            {filteredEvents.length === 0 && user && userProfession && (
              <div className="p-8 bg-muted rounded-lg text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold mb-2">No Registration Options Available</h3>
                <p className="text-muted-foreground">
                  There are currently no registration options available for your profession ({userProfession}). Please
                  contact us if you believe this is an error.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const colorScheme = getEventColorScheme(event.id)

                return (
                  <Dialog
                    key={event.id}
                    open={openDialogId === event.id}
                    onOpenChange={(open) => (open ? setOpenDialogId(event.id) : setOpenDialogId(null))}
                  >
                    <DialogTrigger asChild>
                      <button
                        className={`w-full bg-gradient-to-br ${colorScheme.bgGradient} border-2 ${colorScheme.borderColor} ${colorScheme.hoverBorder} rounded-xl p-4 transition-all duration-200 text-left flex items-center justify-between group shadow-sm hover:shadow-md relative overflow-hidden ${
                          quotaStatuses[event.id]?.is_sold_out ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                        disabled={quotaStatuses[event.id]?.is_sold_out}
                      >
                        {/* Sold Out Overlay */}
                        {quotaStatuses[event.id]?.is_sold_out && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                            <div className="text-white font-bold text-lg text-center">SOLD OUT</div>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${colorScheme.badgeBg} ${colorScheme.badgeText}`}
                            >
                              {colorScheme.categoryLabel}
                            </span>
                            {quotaStatuses[event.id]?.is_sold_out && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                                Sold Out
                              </span>
                            )}
                          </div>
                          <h3 className={`font-display text-lg font-bold ${colorScheme.textColor} mb-1 truncate`}>
                            {event.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">{event.date}</p>
                          {event.id === "symposium" && (
                            <div className="flex items-center gap-1 mt-1">
                              <Gift className="w-3 h-3 text-teal-600" />
                              <span className="text-xs text-teal-600 font-medium">+4 Bonus Webinars</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight
                          className={`ml-4 h-5 w-5 text-muted-foreground group-hover:${colorScheme.textColor} transition-colors flex-shrink-0`}
                        />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto overflow-x-hidden w-[95vw] sm:w-full">
                      <DialogHeader>
                        <div className="mb-2">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${colorScheme.badgeBg} ${colorScheme.badgeText}`}
                          >
                            {colorScheme.categoryLabel}
                          </span>
                        </div>
                        <DialogTitle className="text-xl pr-8 break-words">{event.label}</DialogTitle>
                        <DialogDescription className="break-words">{event.date}</DialogDescription>
                        
                        {/* Quota Status Warning */}
                        {quotaStatuses[event.id] && (
                          <div
                            className={`mt-3 p-3 rounded-lg border flex items-start gap-2 ${
                              quotaStatuses[event.id].is_sold_out
                                ? "bg-red-50 border-red-200"
                                : quotaStatuses[event.id].is_low_stock
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-green-50 border-green-200"
                            }`}
                          >
                            <Zap
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                quotaStatuses[event.id].is_sold_out
                                  ? "text-red-600"
                                  : quotaStatuses[event.id].is_low_stock
                                    ? "text-amber-600"
                                    : "text-green-600"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                quotaStatuses[event.id].is_sold_out
                                  ? "text-red-700"
                                  : quotaStatuses[event.id].is_low_stock
                                    ? "text-amber-700"
                                    : "text-green-700"
                              }`}
                            >
                              {quotaStatuses[event.id].is_sold_out
                                ? "This session is currently sold out"
                                : quotaStatuses[event.id].is_low_stock
                                  ? `Only ${quotaStatuses[event.id].available_seats} seats remaining!`
                                  : `${quotaStatuses[event.id].available_seats} out of ${quotaStatuses[event.id].max_capacity} seats available`}
                            </span>
                          </div>
                        )}

                        {event.id === "symposium" && (
                          <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                            <Gift className="w-4 h-4 text-teal-600 flex-shrink-0" />
                            <span className="text-sm text-teal-700 font-medium">
                              Includes 4 bonus pre-conference webinars
                            </span>
                          </div>
                        )}
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {event.participantTypes.map((pt) => {
                          const currentPrice = isEarlyBirdPeriod ? pt.earlyBirdPrice : pt.normalPrice

                          return (
                            <div key={pt.id} className="border border-border rounded-lg p-4 space-y-3">
                              <h4 className="font-semibold text-foreground break-words">{pt.label}</h4>
                              <div className="space-y-2">
                                {isEarlyBirdPeriod && (
                                  <div className="flex justify-between items-center gap-3">
                                    <span className="text-sm text-muted-foreground min-w-0">Early Bird Price</span>
                                    <span className="font-bold text-primary text-base sm:text-lg whitespace-nowrap">
                                      {formatPrice(pt.earlyBirdPrice, pt.currency)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center gap-3">
                                  <span className="text-sm text-muted-foreground min-w-0">Regular Price</span>
                                  <span
                                    className={`whitespace-nowrap ${isEarlyBirdPeriod ? "text-muted-foreground line-through" : "font-bold text-primary text-base sm:text-lg"}`}
                                  >
                                    {formatPrice(pt.normalPrice, pt.currency)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-3">
                                  <span className="text-sm text-muted-foreground min-w-0">On-site Price</span>
                                  <span className="font-semibold text-foreground whitespace-nowrap">
                                    {formatPrice(pt.onSitePrice, pt.currency)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <AddToCartButton
                                  item={{
                                    item_type: "event",
                                    event_id: event.id,
                                    event_label: event.label,
                                    participant_type_id: pt.id,
                                    participant_type_label: pt.label,
                                    unit_price: currentPrice,
                                    currency: pt.currency,
                                  }}
                                  variant="default"
                                  size="default"
                                  className="w-full"
                                  onSuccess={() => setOpenDialogId(null)}
                                  isSoldOut={quotaStatuses[event.id]?.is_sold_out || false}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-gradient-to-br from-cyan-500/10 to-teal-500/10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block p-3 bg-cyan-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-balance">Need Accommodation?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Book your hotel room now and enjoy convenient access to all conference events. Special rates available for
              ISAPM 2026 attendees.
            </p>
            <Link href="/hotel-booking">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                Book a Hotel Room
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
