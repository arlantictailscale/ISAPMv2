import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hotel Booking - The Singhasari Hotel",
  description:
    "Book your accommodation at The Singhasari Hotel for ISAPM 8th National Meeting 2026. Special conference rates for Deluxe and Premier rooms.",
  keywords: [
    "hotel booking",
    "Singhasari Hotel reservation",
    "ISAPM accommodation",
    "Batu Malang hotel",
    "conference hotel",
  ],
  openGraph: {
    title: "Hotel Booking | ISAPM 8th National Meeting 2026",
    description: "Book your room at The Singhasari Hotel. Special rates for ISAPM 2026 attendees.",
    url: "https://www.isapm2026.org/hotel-booking",
  },
}

export default function HotelBookingLayout({ children }: { children: React.ReactNode }) {
  return children
}
