import type { Metadata } from "next"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { WebinarHero } from "@/components/webinar/webinar-hero"
import { WebinarSpeakers } from "@/components/webinar/webinar-speakers"
import { WebinarRegistration } from "@/components/webinar/webinar-registration"

export const metadata: Metadata = {
  title: "Webinar: Achieving Equity in Pain Management Services in Indonesia | ISAPM 2026",
  description:
    "Join our webinar on achieving equity in pain management services in Indonesia. Featuring speakers from Ministry of Health, ISAPM, PP Perdatin, and BPJS Kesehatan.",
  openGraph: {
    title: "Webinar: Achieving Equity in Pain Management Services in Indonesia",
    description:
      "Synergy between Anesthesiologists, Government Regulations, and BPJS Health Financing Schemes. Friday, January 30, 2026, 13:00 WIB.",
  },
}

export default function WebinarPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <WebinarHero />
        <WebinarSpeakers />
        <WebinarRegistration />
      </main>
      <Footer />
    </div>
  )
}
