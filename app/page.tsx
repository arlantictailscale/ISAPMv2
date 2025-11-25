import Navigation from "@/components/navigation"
import LandingHero from "@/components/landing-hero"
import ConferenceHighlights from "@/components/conference-highlights"
import FlipBookSection from "@/components/flip-book-section"
import WelcomeSection from "@/components/welcome-section"
import AboutSection from "@/components/about-section"
import ImportantInfo from "@/components/important-info"
import CTA from "@/components/cta"
import Footer from "@/components/footer"
import { getRegisteredCount } from "@/app/actions/public-stats"
import RegistrationStats from "@/components/registration-stats"
import { ScrollSection } from "@/components/scroll-section"

export default async function Home() {
  const registeredCount = await getRegisteredCount()

  return (
    <main className="overflow-x-hidden">
      <Navigation />
      <LandingHero />
      <div id="content">
        <ScrollSection animation="fade-up">
          <FlipBookSection registeredCount={registeredCount} />
        </ScrollSection>

        <ScrollSection animation="zoom" delay={0.1}>
          <RegistrationStats initialCount={registeredCount} />
        </ScrollSection>

        <ScrollSection animation="slide-left">
          <WelcomeSection />
        </ScrollSection>

        <ScrollSection animation="flip">
          <ConferenceHighlights />
        </ScrollSection>

        <ScrollSection animation="glow">
          <AboutSection />
        </ScrollSection>

        <ScrollSection animation="slide-right">
          <ImportantInfo />
        </ScrollSection>

        <ScrollSection animation="scale">
          <CTA />
        </ScrollSection>
      </div>
      <Footer />
    </main>
  )
}
