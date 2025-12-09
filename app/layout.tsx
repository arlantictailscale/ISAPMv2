import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"
import { Toaster } from "sonner"
import { CartProvider } from "@/lib/cart/cart-context"
import { ScrollProgressBar } from "@/components/scroll-progress-bar"

import { Inter, Playfair_Display, Geist, Geist_Mono, Source_Serif_4 } from "next/font/google"

// Initialize fonts
const _geist = Geist({ subsets: ["latin"], weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] })
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})
const _sourceSerif_4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

const inter = Inter({ subsets: ["latin"] })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

export const metadata: Metadata = {
  title: {
    default: "ISAPM 8th National Meeting 2026 | Pain Management Conference Indonesia",
    template: "%s | ISAPM 8th National Meeting 2026",
  },
  description:
    "Join the 8th Indonesian Society of Anesthesiology for Pain Management (ISAPM) National Meeting 2026. April 16-18 at The Singhasari Resort, Batu Malang. Bridging The Gaps: Equity, Access, and Excellence in Pain Management.",
  keywords: [
    "ISAPM",
    "ISAPM 2026",
    "8th National Meeting",
    "anesthesiology",
    "pain management",
    "conference",
    "Indonesia",
    "2026",
    "Malang",
    "Batu",
    "PERDATIN",
    "medical conference",
    "healthcare symposium",
    "pain clinic",
    "CPD course",
  ],
  authors: [{ name: "Indonesian Society of Anesthesiology for Pain Management" }],
  creator: "ISAPM",
  publisher: "ISAPM",
  generator: "v0.app",
  metadataBase: new URL("https://www.isapm2026.org"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/images/isapm-logo.png",
    apple: "/images/isapm-logo.png",
  },
  openGraph: {
    title: "ISAPM 8th National Meeting 2026 | Pain Management Conference Indonesia",
    description:
      "Join Indonesia's premier pain management conference. ISAPM 8th National Meeting, April 16-18, 2026 at The Singhasari Resort, Batu Malang. Register now!",
    url: "https://www.isapm2026.org",
    siteName: "ISAPM 8th National Meeting 2026",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ISAPM 8th National Meeting 2026 - Pain Management Conference Indonesia",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISAPM 8th National Meeting 2026 | Pain Management Conference",
    description:
      "Join the 8th ISAPM National Meeting. April 16-18, 2026, Batu Malang. Bridging The Gaps in Pain Management.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "ISAPM 8th National Meeting 2026",
  description:
    "The 8th Indonesian Society of Anesthesiology for Pain Management National Meeting. Bridging The Gaps: Equity, Access, and Excellence in Pain Management.",
  startDate: "2026-04-16T08:00:00+07:00",
  endDate: "2026-04-18T17:00:00+07:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "The Singhasari Resort & Convention",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Ir. Soekarno No.120",
      addressLocality: "Batu",
      addressRegion: "East Java",
      postalCode: "65314",
      addressCountry: "ID",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "Indonesian Society of Anesthesiology for Pain Management (ISAPM)",
    url: "https://www.isapm2026.org",
  },
  performer: {
    "@type": "Organization",
    name: "ISAPM",
  },
  offers: {
    "@type": "AggregateOffer",
    url: "https://www.isapm2026.org/pricing",
    priceCurrency: "IDR",
    lowPrice: "500000",
    highPrice: "5000000",
    availability: "https://schema.org/InStock",
    validFrom: "2024-12-01",
  },
  image: "https://www.isapm2026.org/images/og-image.jpg",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${_geist.className} ${_geistMono.className} antialiased overflow-x-hidden`}>
        <ScrollProgressBar />
        <CartProvider>{children}</CartProvider>
        <Analytics />
        <SpeedInsights />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: "bg-card border-border shadow-lg",
              title: "text-foreground font-medium",
              description: "text-muted-foreground",
              success:
                "!bg-emerald-50 !border-emerald-200 !text-emerald-800 dark:!bg-emerald-950 dark:!border-emerald-800 dark:!text-emerald-200",
              error:
                "!bg-red-50 !border-red-200 !text-red-800 dark:!bg-red-950 dark:!border-red-800 dark:!text-red-200",
              info: "!bg-blue-50 !border-blue-200 !text-blue-800 dark:!bg-blue-950 dark:!border-blue-800 dark:!text-blue-200",
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  )
}
