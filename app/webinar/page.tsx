"use client"

import { useState } from "react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Sparkles, ArrowLeft, Gift } from "lucide-react"
import { WEBINARS, type Webinar } from "@/lib/data/webinars"
import { WebinarCard } from "@/components/webinar/webinar-card"
import { WebinarDetailHero } from "@/components/webinar/webinar-detail-hero"
import { WebinarDetailSpeakers } from "@/components/webinar/webinar-detail-speakers"
import { WebinarDetailRegistration } from "@/components/webinar/webinar-detail-registration"
import { SymposiumBundleBanner } from "@/components/promotions/symposium-bundle-banner"
import { getActiveSymposiumPromotion, calculateBundleSavings, formatCurrency } from "@/lib/data/promotions"

export default function WebinarsPage() {
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null)

  const activeWebinars = WEBINARS.filter((w) => w.status === "active")
  const upcomingWebinars = WEBINARS.filter((w) => w.status === "coming_soon")

  const promotion = getActiveSymposiumPromotion()
  const bundleSavings = calculateBundleSavings()

  if (selectedWebinar) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          {/* Back Button */}
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => setSelectedWebinar(null)} className="group hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Webinars
            </Button>
          </div>

          {/* Webinar Detail Content */}
          <WebinarDetailHero webinar={selectedWebinar} />
          <WebinarDetailSpeakers webinar={selectedWebinar} />
          <WebinarDetailRegistration webinar={selectedWebinar} />
        </main>
        <Footer />
      </div>
    )
  }

  // Default list view
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-4 py-1.5">
                <Sparkles className="w-3 h-3 mr-1" />
                ISAPM 2026 Webinar Series
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Expert Webinars
                </span>
                <br />
                <span className="text-foreground">on Pain Management</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                Join leading healthcare professionals and policymakers in our comprehensive webinar series. Gain
                insights on pain management practices, clinical guidelines, and healthcare financing.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{activeWebinars.length}</div>
                  <div className="text-sm text-muted-foreground">Active Now</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{upcomingWebinars.length}</div>
                  <div className="text-sm text-muted-foreground">Coming Soon</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{WEBINARS.length}</div>
                  <div className="text-sm text-muted-foreground">Total Series</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {promotion && (
          <section className="py-8 bg-background">
            <div className="container mx-auto px-4">
              <SymposiumBundleBanner variant="full" showCTA={true} />
            </div>
          </section>
        )}

        {/* Webinars Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">All Webinars</h2>
                  <p className="text-sm text-muted-foreground">Browse and register for our webinar series</p>
                </div>
              </div>

              {promotion && bundleSavings > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    FREE with Symposium (Save {formatCurrency(bundleSavings)})
                  </span>
                </div>
              )}
            </div>

            {/* Grid - Use new WebinarCard component with onViewDetails callback */}
            <div className="grid md:grid-cols-2 gap-6">
              {WEBINARS.map((webinar, index) => (
                <WebinarCard
                  key={webinar.id}
                  webinar={webinar}
                  index={index}
                  onViewDetails={webinar.status === "active" ? () => setSelectedWebinar(webinar) : undefined}
                  showBundleBadge={promotion !== null}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Updated to highlight bundle deal */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border-0 text-white overflow-hidden">
              <CardContent className="p-8 md:p-12 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

                <div className="relative z-10 max-w-2xl mx-auto text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                    <Gift className="w-4 h-4" />
                    <span className="text-sm font-medium">Special Bundle Offer</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Get All 4 Webinars FREE!</h3>
                  <p className="text-white/90 mb-6">
                    Purchase any Symposium ticket and receive all webinars at no additional cost.
                    {bundleSavings > 0 && (
                      <span className="block mt-2 text-lg font-semibold">
                        Save {formatCurrency(bundleSavings)} instantly!
                      </span>
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/pricing">
                      <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-white/90">
                        <Gift className="w-4 h-4 mr-2" />
                        Get the Bundle Deal
                      </Button>
                    </Link>
                    <Link href="/events">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 bg-transparent"
                      >
                        View All Events
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
