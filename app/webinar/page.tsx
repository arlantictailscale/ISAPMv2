import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Calendar, Clock, Users, ArrowRight, Bell, CheckCircle2, Sparkles } from "lucide-react"
import { WEBINARS, formatWebinarDate, type Webinar } from "@/lib/data/webinars"
import { formatPrice } from "@/lib/data/event-pricing"

export const metadata: Metadata = {
  title: "Webinars | ISAPM 2026",
  description:
    "Explore our series of webinars on pain management, healthcare policy, and clinical practices. Register for upcoming sessions.",
  openGraph: {
    title: "ISAPM 2026 Webinar Series",
    description:
      "Join leading experts in healthcare policy, pain management, and health financing through our webinar series.",
  },
}

function WebinarCard({ webinar, index }: { webinar: Webinar; index: number }) {
  const isActive = webinar.status === "active"
  const isComingSoon = webinar.status === "coming_soon"
  const isSoldOut = webinar.status === "sold_out"

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 ${
        isActive
          ? "border-primary/20 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
          : "border-muted bg-muted/30"
      }`}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        {isActive && (
          <Badge className="bg-green-500 text-white border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Open Registration
          </Badge>
        )}
        {isComingSoon && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
            <Bell className="w-3 h-3 mr-1" />
            Coming Soon
          </Badge>
        )}
        {isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
      </div>

      {/* Webinar Number Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
          }`}
        >
          {index + 1}
        </div>
      </div>

      <CardContent className="p-6 pt-16">
        {/* Title */}
        <h3 className={`text-xl font-bold mb-3 line-clamp-2 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
          {isActive ? webinar.shortTitle : webinar.title}
        </h3>

        {/* Description */}
        <p className={`text-sm mb-4 line-clamp-3 ${isActive ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
          {webinar.description}
        </p>

        {/* Date & Time for Active Webinars */}
        {isActive && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatWebinarDate(webinar.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>
                {webinar.time} {webinar.timezone} ({webinar.duration})
              </span>
            </div>
            {webinar.speakers.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span>{webinar.speakers.length} Expert Speakers</span>
              </div>
            )}
          </div>
        )}

        {/* Speaker Avatars for Active Webinars */}
        {isActive && webinar.speakers.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {webinar.speakers.slice(0, 4).map((speaker) => (
                <div key={speaker.id} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                  <Image
                    src={speaker.image || "/placeholder.svg"}
                    alt={speaker.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {webinar.speakers.length > 4 ? `+${webinar.speakers.length - 4} more` : "speakers"}
            </span>
          </div>
        )}

        {/* Tags for Active Webinars */}
        {isActive && webinar.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {webinar.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t">
          {isActive ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Registration Fee</p>
                <p className="text-lg font-bold text-primary">{formatPrice(webinar.price)}</p>
              </div>
              <Link href={`/webinar/${webinar.slug}`}>
                <Button className="group/btn">
                  View Details
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="text-lg font-medium text-muted-foreground">TBD</p>
              </div>
              <Button variant="outline" disabled>
                <Bell className="w-4 h-4 mr-1" />
                Notify Me
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function WebinarsPage() {
  const activeWebinars = WEBINARS.filter((w) => w.status === "active")
  const upcomingWebinars = WEBINARS.filter((w) => w.status === "coming_soon")

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

            {/* Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {WEBINARS.map((webinar, index) => (
                <WebinarCard key={webinar.id} webinar={webinar} index={index} />
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
                    priority access and exclusive discounts on webinar registrations.
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
