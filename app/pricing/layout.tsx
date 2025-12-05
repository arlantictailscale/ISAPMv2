import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Registration & Pricing",
  description:
    "ISAPM 8th National Meeting 2026 registration fees and pricing. Early bird discounts available. Symposium, workshops, and CPD course packages for specialists, GPs, and nurses.",
  keywords: [
    "ISAPM registration",
    "conference pricing",
    "early bird discount",
    "medical conference fees",
    "workshop registration",
  ],
  openGraph: {
    title: "Registration & Pricing | ISAPM 8th National Meeting 2026",
    description: "Register for ISAPM 2026. Early bird discounts available for symposium, workshops, and CPD courses.",
    url: "https://www.isapm2026.org/pricing",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
