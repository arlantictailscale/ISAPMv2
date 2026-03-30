import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Accommodation | ISAPM 2026",
  description: "Hotel accommodation booking for ISAPM 8th National Meeting 2026",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function AkomodasiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
