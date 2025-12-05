import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Call for Papers & E-Poster Submission",
  description:
    "Submit your abstract for ISAPM 8th National Meeting 2026. E-poster presentations on pain management research. Guidelines, deadlines, and submission process.",
  keywords: [
    "call for papers",
    "abstract submission",
    "e-poster",
    "pain management research",
    "medical conference abstract",
    "ISAPM 2026 submission",
  ],
  openGraph: {
    title: "Call for Papers | ISAPM 8th National Meeting 2026",
    description:
      "Submit your pain management research abstract for ISAPM 2026. E-poster presentation opportunities available.",
    url: "https://www.isapm2026.org/call-for-papers",
  },
}

export default function CallForPapersLayout({ children }: { children: React.ReactNode }) {
  return children
}
