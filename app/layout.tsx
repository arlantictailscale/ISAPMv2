import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"
import { Toaster } from "sonner"
import { CartProvider } from "@/lib/cart/cart-context"

import { Inter, Playfair_Display, Geist, Geist_Mono, Geist as V0_Font_Geist, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'

// Initialize fonts
const _geist = V0_Font_Geist({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

const inter = Inter({ subsets: ["latin"] })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ISAPM National Meeting 2026 - Bridging The Gaps in Pain Management",
  description:
    "Indonesian Society of Anesthesiology for Pain Management National Meeting 2026. Equity, Access, and Excellence in Pain Management. April 16-18, 2026 at The Singhasari Resort & Convention Batu.",
  keywords: "anesthesiology, pain management, conference, Indonesia, ISAPM",
  generator: "v0.app",
  icons: {
    icon: "/images/isapm-logo.png",
    apple: "/images/isapm-logo.png",
  },
  openGraph: {
    title: "ISAPM National Meeting 2026 - 8th National Meeting",
    description:
      "Indonesian Society of Anesthesiology for Pain Management National Meeting 2026. April 2026, Malang. Bridging The Gaps in Pain Management.",
    url: "https://www.isapm2026.org",
    siteName: "ISAPM 2026",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ISAPM Vol. 8 - 8th National Meeting, April 2026, Malang",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISAPM National Meeting 2026 - 8th National Meeting",
    description: "Indonesian Society of Anesthesiology for Pain Management National Meeting 2026. April 2026, Malang.",
    images: ["/images/og-image.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} ${geistMono.className} antialiased overflow-x-hidden`}>
        <CartProvider>{children}</CartProvider>
        <Analytics />
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  )
}
