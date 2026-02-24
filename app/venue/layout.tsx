import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Venue - The Singhasari Hotel",
  description:
    "ISAPM 8th National Meeting 2026 venue: The Singhasari Hotel & Convention, Batu, Malang. Luxury accommodation, conference facilities, and stunning mountain views.",
  keywords: ["Singhasari Hotel", "Batu Malang hotel", "conference venue", "ISAPM venue", "medical conference hotel"],
  openGraph: {
    title: "Venue - The Singhasari Hotel | ISAPM 8th National Meeting 2026",
    description:
      "Conference venue: The Singhasari Hotel & Convention, Batu, Malang. Book your accommodation for ISAPM 2026.",
    url: "https://www.isapm2026.org/venue",
  },
}

export default function VenueLayout({ children }: { children: React.ReactNode }) {
  return children
}
