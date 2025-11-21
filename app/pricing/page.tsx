"use client"

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { isBefore, parseISO, format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChevronRight } from "lucide-react"

export default function PricingPage() {
  const earlyBirdDeadline = parseISO("2027-01-20T23:59:59") // January 20, 2027, end of day
  const isEarlyBirdPeriod = isBefore(new Date(), earlyBirdDeadline)

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
          label: "Anesthesiologist and team, max 3 people",
          earlyBirdPrice: 4500000,
          normalPrice: 5000000,
          onSitePrice: 5500000,
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

  return (
    <>
      <Navigation />
      <main className="pt-24 overflow-x-hidden">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Registration Fees</h1>
            <p className="text-lg text-muted-foreground">
              Find the right registration option for you at ISAPM National Meeting 2026.
            </p>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-900">
                <strong>Note:</strong> On-site registration is available at a higher rate. We recommend registering
                online to secure the best price.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            {isEarlyBirdPeriod && (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                <h2 className="font-display text-2xl font-bold mb-3">Early Bird Discount Available!</h2>
                <p className="text-lg">
                  Register before <span className="font-semibold">{format(earlyBirdDeadline, "MMMM dd, yyyy")}</span> to
                  secure special reduced rates. Don't miss out!
                </p>
                <Link href="/register" className="mt-4 inline-block">
                  <Button>Register Now</Button>
                </Link>
              </div>
            )}

            <div className="space-y-4">
              {registrationOptions.map((event) => (
                <Dialog key={event.id}>
                  <DialogTrigger asChild>
                    <button className="w-full bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors text-left flex items-center justify-between group">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg font-bold text-primary mb-1 truncate">{event.label}</h3>
                        <p className="text-sm text-muted-foreground">{event.date}</p>
                      </div>
                      <ChevronRight className="ml-4 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto overflow-x-hidden w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle className="text-xl pr-8 break-words">{event.label}</DialogTitle>
                      <DialogDescription className="break-words">{event.date}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {event.participantTypes.map((pt) => (
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
                        </div>
                      ))}
                      <Link href="/register" className="block">
                        <Button className="w-full" size="lg">
                          Register for this Event
                        </Button>
                      </Link>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
