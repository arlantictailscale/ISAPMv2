import Navigation from "@/components/navigation"
import LandingHero from "@/components/landing-hero"
import ConferenceHighlights from "@/components/conference-highlights"
import FlipBookSection from "@/components/flip-book-section"
import WelcomeSection from "@/components/welcome-section"
import AboutSection from "@/components/about-section"
import ImportantInfo from "@/components/important-info"
import CTA from "@/components/cta"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Navigation />
      <LandingHero />
      <div id="content">
        <FlipBookSection />
        <WelcomeSection />
        <ConferenceHighlights />
        <AboutSection />
        <ImportantInfo />
        <CTA />
      </div>
      <Footer />
    </main>
  )
}
