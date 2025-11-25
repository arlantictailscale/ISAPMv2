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
import { ParallaxSection } from "@/components/parallax-section"
import { ScrollReveal } from "@/components/scroll-reveal"

export default async function Home() {
  const registeredCount = await getRegisteredCount()

  return (
    <main className="overflow-x-hidden">
      <Navigation />
      <LandingHero />
      <div id="content">
        <ScrollReveal direction="up" duration={800}>
          <FlipBookSection registeredCount={registeredCount} />
        </ScrollReveal>

        <ParallaxSection speed={0.15}>
          <ScrollReveal direction="up" delay={100}>
            <RegistrationStats initialCount={registeredCount} />
          </ScrollReveal>
        </ParallaxSection>

        <ScrollReveal direction="up" duration={900}>
          <WelcomeSection />
        </ScrollReveal>

        <ParallaxSection speed={0.2}>
          <ScrollReveal direction="left" duration={800}>
            <ConferenceHighlights />
          </ScrollReveal>
        </ParallaxSection>

        <ScrollReveal direction="right" duration={800} delay={50}>
          <AboutSection />
        </ScrollReveal>

        <ParallaxSection speed={0.1}>
          <ScrollReveal direction="up" duration={700}>
            <ImportantInfo />
          </ScrollReveal>
        </ParallaxSection>

        <ScrollReveal direction="scale" duration={800}>
          <CTA />
        </ScrollReveal>
      </div>
      <Footer />
    </main>
  )
}
