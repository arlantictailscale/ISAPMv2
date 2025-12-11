"use client"

import { useState } from "react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, ArrowRight, Sparkles, ArrowLeft, Gift } from "lucide-react"
import { WEBINARS, type Webinar } from "@/lib/data/webinars"
import { WebinarCard } from "@/components/webinar/webinar-card"
import { WebinarDetailHero } from "@/components/webinar/webinar-detail-hero"
import { WebinarDetailSpeakers } from "@/components/webinar/webinar-detail-speakers"
import { WebinarDetailRegistration } from "@/components/webinar/webinar-detail-registration"

export default function WebinarsPage() {
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null)

  const activeWebinars = WEBINARS.filter((w) => w.status === "active")
  const upcomingWebinars = WEBINARS.filter((w) => w.status === "coming_soon")

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

              {/* Symposium Bonus Info Banner */}
              <div className="mt-8 max-w-xl mx-auto">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200 shadow-sm">
                  <div className="p-2 rounded-lg bg-teal-100">
                    <Gift className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-teal-800">Symposium Registrants Get 4 Free Webinars</p>
                    <p className="text-xs text-teal-600">
                      Register for the symposium to receive complimentary access to all pre-conference webinars.
                    </p>
                  </div>
                  <Link href="/symposium">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-teal-300 text-teal-700 hover:bg-teal-50 bg-transparent"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Webinars Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-primary/10">
                <Video className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">All Webinars</h2>
                <p className="text-sm text-muted-foreground">Browse and register for our webinar series</p>
              </div>
            </div>

            {/* Grid - Use new WebinarCard component with onViewDetails callback */}
            <div className="grid md:grid-cols-2 gap-6">
              {WEBINARS.map((webinar, index) => (
                <WebinarCard
                  key={webinar.id}
                  webinar={webinar}
                  index={index}
                  onViewDetails={webinar.status === "active" ? () => setSelectedWebinar(webinar) : undefined}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-0 text-white overflow-hidden">
              <CardContent className="p-8 md:p-12 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

                <div className="relative z-10 max-w-2xl mx-auto text-center">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated on New Webinars</h3>
                  <p className="text-white/80 mb-6">
                    Be the first to know when new webinars are announced. Register for the main conference to get
                    priority access and exclusive discounts on webinar registrations. Symposium registrants receive
                    complimentary access to all 4 pre-conference webinars.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/pricing">
                      <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-white/90">
                        Register for Conference
                        <ArrowRight className="w-4 h-4 ml-1" />
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
