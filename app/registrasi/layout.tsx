import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "On-Site Registration | ISAPM 2026",
  description: "On-site registration for ISAPM 8th National Meeting 2026",
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegistrasiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
