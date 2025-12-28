import type { Metadata } from "next"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Scale } from "lucide-react"

export const dynamic = "force-static"
export const revalidate = 86400 // Revalidate once per day

export const metadata: Metadata = {
  title: "Terms of Service | ISAPM 2026",
  description:
    "Terms of Service for the 8th National Meeting of the Indonesian Society of Anesthesiology for Pain Management.",
}

export default function TermsOfServicePage() {
  return (
    <>
      <Navigation />

      <section className="relative bg-gradient-to-r from-primary via-primary/90 to-primary pt-24 pb-12">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Terms of Service</h1>
              <p className="text-white/80 mt-1">ISAPM 8th National Meeting 2026</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p>
              These Terms of Service constitute a legally binding agreement made between you, whether personally or on
              behalf of an entity ("you") and ISAPM 2026 ("we," "us" or "our"), concerning your access to and use of the
              isapm2026.org website as well as any other media form, media channel, mobile website or mobile application
              related, linked, or otherwise connected thereto (collectively, the "Site").
            </p>
            <p className="mt-2">
              You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these
              Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly
              prohibited from using the Site and you must discontinue use immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Intellectual Property Rights</h2>
            <p>
              Unless otherwise indicated, the Site is our proprietary property and all source code, databases,
              functionality, software, website designs, audio, video, text, photographs, and graphics on the Site
              (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks")
              are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and
              various other intellectual property rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Representations</h2>
            <p>By using the Site, you represent and warrant that:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>All registration information you submit will be true, accurate, current, and complete.</li>
              <li>
                You will maintain the accuracy of such information and promptly update such registration information as
                necessary.
              </li>
              <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
              <li>You will not use the Site for any illegal or unauthorized purpose.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Registration and Payments</h2>
            <p>
              You may be required to register with the Site. You agree to keep your password confidential and will be
              responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a
              username you select if we determine, in our sole discretion, that such username is inappropriate, obscene,
              or otherwise objectionable.
            </p>
            <p className="mt-2">
              All payments made through the Site for conference registration, workshops, or other services are subject
              to our refund policy as stated on the pricing page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Contact Us</h2>
            <p>
              In order to resolve a complaint regarding the Site or to receive further information regarding use of the
              Site, please contact us at:
            </p>
            <address className="mt-4 not-italic">
              Indonesian Society of Anesthesiology for Pain Management
              <br />
              Batu, Malang
              <br />
              East Java, Indonesia
              <br />
              Email: admin@isapm2026.org
            </address>
          </section>
        </div>
      </div>

      <Footer />
    </>
  )
}
