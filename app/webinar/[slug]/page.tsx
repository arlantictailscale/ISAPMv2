import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { WebinarDetailHero } from "@/components/webinar/webinar-detail-hero"
import { WebinarDetailSpeakers } from "@/components/webinar/webinar-detail-speakers"
import { WebinarDetailRegistration } from "@/components/webinar/webinar-detail-registration"
import { WEBINARS, getWebinarBySlug } from "@/lib/data/webinars"

interface WebinarDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return WEBINARS.filter((w) => w.status === "active").map((webinar) => ({
    slug: webinar.slug,
  }))
}

export async function generateMetadata({ params }: WebinarDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const webinar = getWebinarBySlug(slug)

  if (!webinar) {
    return {
      title: "Webinar Not Found | ISAPM 2026",
    }
  }

  return {
    title: `${webinar.shortTitle} | ISAPM 2026 Webinar`,
    description: webinar.description,
    openGraph: {
      title: webinar.title,
      description: webinar.description,
    },
  }
}

export default async function WebinarDetailPage({ params }: WebinarDetailPageProps) {
  const { slug } = await params
  const webinar = getWebinarBySlug(slug)

  if (!webinar || webinar.status !== "active") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <WebinarDetailHero webinar={webinar} />
        <WebinarDetailSpeakers webinar={webinar} />
        <WebinarDetailRegistration webinar={webinar} />
      </main>
      <Footer />
    </div>
  )
}
