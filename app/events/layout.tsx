import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Events & Programs",
  description:
    "Explore ISAPM 8th National Meeting 2026 events: CPD courses, workshops, symposium, and city tour. Pain management training for healthcare professionals in Batu, Malang.",
  keywords: [
    "ISAPM events",
    "pain management workshop",
    "CPD course",
    "medical symposium",
    "anesthesiology training",
    "Malang conference",
  ],
  openGraph: {
    title: "Events & Programs | ISAPM 8th National Meeting 2026",
    description:
      "Explore CPD courses, workshops, symposium, and city tour at ISAPM 2026. Register now for pain management training.",
    url: "https://www.isapm2026.org/events",
  },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
