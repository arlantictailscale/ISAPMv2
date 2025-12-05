import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact ISAPM 8th National Meeting 2026 organizing committee. Get help with registration, accommodation, abstract submission, and general inquiries.",
  keywords: ["ISAPM contact", "conference support", "registration help", "ISAPM 2026 inquiry"],
  openGraph: {
    title: "Contact Us | ISAPM 8th National Meeting 2026",
    description: "Contact the ISAPM 2026 organizing committee for registration support and inquiries.",
    url: "https://www.isapm2026.org/contact",
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
