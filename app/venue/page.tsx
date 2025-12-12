import Footer from "@/components/footer"
import { MapPin, Phone, Mail, Clock, Hotel, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { RoomAvailabilitySection } from "@/components/room-availability-section"
import { VenueRoomGalleries } from "@/components/venue-room-galleries"

export const revalidate = 3600 // 1 hour

export default async function VenuePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/luxury-hotel-conference-venue-with-modern-architec.jpg"
              alt="The Singhasari Hotel - Exterior View"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>

          <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <Hotel className="w-4 h-4" />
              <span className="text-sm font-medium">Official Conference Venue</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">Welcome to The Singhasari Hotel</h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 text-pretty">
              Experience world-class conference facilities nestled in the breathtaking mountain landscape of Batu,
              Malang
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-black hover:bg-white/90 font-semibold">
                <Link href="/pricing">Book Your Stay</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm bg-white/5"
              >
                <a href="https://thesinghasari.com" target="_blank" rel="noopener noreferrer">
                  Visit Resort Website
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Info Bar */}
        <section className="bg-primary text-primary-foreground py-6">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <MapPin className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Location</div>
                  <div className="text-sm opacity-90">Batu, Malang, East Java</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Phone className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Contact</div>
                  <div className="text-sm opacity-90">+62 341 592 777</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Check-in/out</div>
                  <div className="text-sm opacity-90">2:00 PM / 12:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">World-Class Conference Facilities</h2>
              <p className="text-lg text-muted-foreground">
                The Singhasari Hotel offers state-of-the-art meeting rooms, modern amenities, and breathtaking views—the
                perfect setting for the 8th National Meeting of ISAPM 2026.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Hotel className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Spacious Rooms</CardTitle>
                  <CardDescription>Comfortable accommodations with stunning mountain views</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Modern Meeting Spaces</CardTitle>
                  <CardDescription>Equipped with the latest technology for presentations</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <MapPin className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Prime Location</CardTitle>
                  <CardDescription>Easy access to local attractions and natural beauty</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <Suspense
          fallback={
            <section className="py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <Skeleton className="h-8 w-64 mb-4 mx-auto" />
                  <Skeleton className="h-4 w-96 mb-12 mx-auto" />
                  <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                  </div>
                </div>
              </div>
            </section>
          }
        >
          <RoomAvailabilitySection />
        </Suspense>

        <VenueRoomGalleries />

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Contact The Singhasari Hotel</CardTitle>
                <CardDescription className="text-center">
                  Have questions about your stay? Reach out to the hotel directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">Address</div>
                    <div className="text-sm text-muted-foreground">
                      Jl. Raya Tlekung No. 1, Junrejo, Batu, Malang, East Java 65327
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-sm text-muted-foreground">+62 341 592 777</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-sm text-muted-foreground">reservation@thesinghasari.com</div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button asChild className="w-full">
                    <a href="https://thesinghasari.com" target="_blank" rel="noopener noreferrer">
                      Visit Hotel Website
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
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
