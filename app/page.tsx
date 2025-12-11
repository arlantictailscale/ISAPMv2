import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { getRegisteredCount } from "@/app/actions/public-stats"
import { ParallaxSection } from "@/components/parallax-section"
import { ScrollReveal } from "@/components/scroll-reveal"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const LandingHero = dynamic(() => import("@/components/landing-hero"), {
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-purple-50/30 flex items-center justify-center">
      <Skeleton className="h-96 w-full max-w-4xl mx-4" />
    </div>
  ),
})

const FlipBookSection = dynamic(() => import("@/components/flip-book-section"), {
  loading: () => <Skeleton className="h-64 w-full" />,
})

const RegistrationStats = dynamic(() => import("@/components/registration-stats"), {
  loading: () => <Skeleton className="h-32 w-full" />,
})

const WelcomeSection = dynamic(() => import("@/components/welcome-section"), {
  loading: () => <Skeleton className="h-96 w-full" />,
})

const ConferenceHighlights = dynamic(() => import("@/components/conference-highlights"), {
  loading: () => <Skeleton className="h-96 w-full" />,
})

const AboutSection = dynamic(() => import("@/components/about-section"), {
  loading: () => <Skeleton className="h-64 w-full" />,
})

const ImportantInfo = dynamic(() => import("@/components/important-info"), {
  loading: () => <Skeleton className="h-48 w-full" />,
})

const CTA = dynamic(() => import("@/components/cta"), {
  loading: () => <Skeleton className="h-32 w-full" />,
})

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
