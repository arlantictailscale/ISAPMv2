import type React from "react"
import type { Metadata, Viewport } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "sonner"
import { CartProvider } from "@/lib/cart/cart-context"
import { ScrollProgressBar } from "@/components/scroll-progress-bar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { LinkPrefetch } from "@/components/link-prefetch"
import { OfflineIndicator } from "@/components/offline-indicator"
import { WebVitalsReporter } from "@/components/web-vitals-reporter"
import { FloatingWhatsApp } from "@/components/floating-whatsapp"

import { Inter, Playfair_Display } from "next/font/google"

// Initialize fonts
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-sans",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-playfair",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#14b8a6",
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: {
    default: "ISAPM 8th National Meeting 2026 | Pain Management Conference Indonesia",
    template: "%s | ISAPM 8th National Meeting 2026",
  },
  description:
    "Join the 8th Indonesian Society of Anesthesiology for Pain Management (ISAPM) National Meeting 2026. April 16-18 at The Singhasari Hotel, Batu Malang. Bridging The Gaps: Equity, Access, and Excellence in Pain Management.",
  applicationName: "The 8th National Meeting of the Indonesian Society of Anesthesiology for Pain Management (ISAPM)",
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
  creator: "Indonesian Society of Anesthesiology for Pain Management (ISAPM)",
  publisher: "Indonesian Society of Anesthesiology for Pain Management (ISAPM)",
  generator: "v0.app",
  metadataBase: new URL("https://www.isapm2026.org"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/logo-isapm-2026.png", type: "image/png" },
      { url: "/logo-isapm-2026.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-isapm-2026.png", sizes: "120x120", type: "image/png" },
      { url: "/logo-isapm-2026.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/logo-isapm-2026.png",
    apple: [{ url: "/logo-isapm-2026.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ISAPM 2026",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  other: {
    "facebook-domain-verification": "2lkqcnahzfqor7sw69uh5itdns02sq",
  },
  openGraph: {
    title: "ISAPM 8th National Meeting 2026 | Pain Management Conference Indonesia",
    description:
      "Join Indonesia's premier pain management conference. ISAPM 8th National Meeting, April 16-18, 2026 at The Singhasari Hotel, Batu Malang. Register now!",
    url: "https://www.isapm2026.org",
    siteName: "The 8th National Meeting of the Indonesian Society of Anesthesiology for Pain Management (ISAPM)",
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
    site: "@ISAPM2026",
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

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "The 8th National Meeting of the Indonesian Society of Anesthesiology for Pain Management (ISAPM)",
  alternateName: ["ISAPM 2026", "ISAPM 8th National Meeting", "ISAPM National Meeting 2026"],
  url: "https://www.isapm2026.org",
  description:
    "The 8th Indonesian Society of Anesthesiology for Pain Management National Meeting. Bridging The Gaps: Equity, Access, and Excellence in Pain Management.",
  publisher: {
    "@type": "Organization",
    name: "Indonesian Society of Anesthesiology for Pain Management (ISAPM)",
    logo: {
      "@type": "ImageObject",
      url: "https://www.isapm2026.org/logo-isapm-2026.png",
      width: 120,
      height: 120,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.isapm2026.org/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Indonesian Society of Anesthesiology for Pain Management (ISAPM)",
  alternateName: "ISAPM",
  url: "https://www.isapm2026.org",
  logo: {
    "@type": "ImageObject",
    url: "https://www.isapm2026.org/logo-isapm-2026.png",
    width: 120,
    height: 120,
  },
  image: "https://www.isapm2026.org/logo-isapm-2026.png",
  description:
    "The Indonesian Society of Anesthesiology for Pain Management (ISAPM) is a professional organization dedicated to advancing pain management practices in Indonesia.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "ID",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "info@isapm2026.org",
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
    name: "The Singhasari Hotel & Convention",
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ISAPM 2026" />
        <link rel="apple-touch-icon" href="/logo-isapm-2026.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vercel.live" />
        <link rel="dns-prefetch" href="https://vercel.com" />
        <link rel="dns-prefetch" href="https://supabase.co" />
        <link rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MSXB55PJ');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-MSXB55PJ"
            height="0" 
            width="0" 
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <WebVitalsReporter />
        <OfflineIndicator />
        <ScrollProgressBar />
        <LinkPrefetch />
        <CartProvider>
          <div className="pb-16 md:pb-0">{children}</div>
          <MobileBottomNav />
          <FloatingWhatsApp 
            phoneNumber="6289602626709"
            defaultMessage="Hi! I have a question about ISAPM 2026 National Meeting."
            welcomeMessage="Hello! Need help with registration or have questions about ISAPM 2026? We're here to help!"
          />
          {/* <PWAInstallPrompt /> */}
        </CartProvider>
        <Analytics />
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
