import Navigation from "@/components/navigation"
import LandingHero from "@/components/landing-hero"
import PromoBanner from "@/components/promo-banner"
import dynamic from "next/dynamic"
import { getRegisteredCount } from "@/app/actions/public-stats"
import { ParallaxSection } from "@/components/parallax-section"
import { ScrollReveal } from "@/components/scroll-reveal"
import {
  FlipBookSkeleton,
  StatsSkeleton,
  WelcomeSkeleton,
  LatestNewsSkeleton,
  HighlightsSkeleton,
  AboutSkeleton,
  ImportantInfoSkeleton,
  CTASkeleton,
  FooterSkeleton,
} from "@/components/skeleton-loaders"

export const revalidate = 300

const FlipBookSection = dynamic(() => import("@/components/flip-book-section"), {
  loading: () => <FlipBookSkeleton />,
  ssr: true,
})

const RegistrationStats = dynamic(() => import("@/components/registration-stats"), {
  loading: () => <StatsSkeleton />,
  ssr: true,
})

import { ParticipantMapWrapper } from "@/components/participant-map-wrapper"

const WelcomeSection = dynamic(() => import("@/components/welcome-section"), {
  loading: () => <WelcomeSkeleton />,
  ssr: true,
})

const LatestNewsSection = dynamic(() => import("@/components/latest-news-section"), {
  loading: () => <LatestNewsSkeleton />,
  ssr: true,
})

const ConferenceHighlights = dynamic(() => import("@/components/conference-highlights"), {
  loading: () => <HighlightsSkeleton />,
  ssr: true,
})

const AboutSection = dynamic(() => import("@/components/about-section"), {
  loading: () => <AboutSkeleton />,
  ssr: true,
})

const ImportantInfo = dynamic(() => import("@/components/important-info"), {
  loading: () => <ImportantInfoSkeleton />,
  ssr: true,
})

const CTA = dynamic(() => import("@/components/cta"), {
  loading: () => <CTASkeleton />,
  ssr: true,
})

const Footer = dynamic(() => import("@/components/footer"), {
  loading: () => <FooterSkeleton />,
  ssr: true,
})

export default async function Home() {
  const registeredCount = await getRegisteredCount()

  return (
    <main className="overflow-x-hidden">
      <Navigation />
      <div className="pt-16 sm:pt-20">
        <PromoBanner />
      </div>
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

        <ScrollReveal direction="up" delay={150}>
          <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            <ParticipantMapWrapper />
          </section>
        </ScrollReveal>

        <ScrollReveal direction="up" duration={900}>
          <WelcomeSection />
        </ScrollReveal>

        <ScrollReveal direction="up" duration={800} delay={50}>
          <LatestNewsSection />
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
