import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { MapPin, Phone, Mail, Clock, Hotel, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { getRoomAvailability } from "@/app/actions/get-room-availability"
import { DeluxeRoomGallery } from "@/components/deluxe-room-gallery"
import { PremierRoomGallery } from "@/components/premier-room-gallery"

export default async function VenuePage() {
  const roomAvailability = await getRoomAvailability()

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section with Stunning Pool Image Backdrop */}
        <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
          <Image
            src="/images/edt.jpg"
            alt="The Singhasari Resort Pool and Mountain View"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          <div className="relative h-full max-w-6xl mx-auto px-4 flex flex-col justify-center items-start">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-white text-balance">
              Welcome to The Singhasari Hotel
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-6 max-w-2xl text-pretty">
              Experience world-class conference facilities nestled in the breathtaking mountain landscape of Batu,
              Malang
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-lg">
                <Link href="/hotel-booking">
                  <Hotel className="w-5 h-5 mr-2" />
                  Book Your Stay
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white text-white hover:bg-white/10 backdrop-blur-sm bg-transparent"
              >
                <a href="https://www.thesinghasari.com/" target="_blank" rel="noopener noreferrer">
                  Visit Resort Website
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Photo Gallery Section Showing Resort Amenities */}
        <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Resort Facilities & Amenities</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover our premium facilities designed to enhance your conference experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Grand Lobby */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="/images/sgh-153.jpg"
                    alt="Grand Lobby with Traditional Indonesian Architecture"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardHeader>
                  <CardTitle>Elegant Reception & Lobby</CardTitle>
                  <CardDescription>
                    Stunning traditional Indonesian design with modern luxury and warm hospitality
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Luxurious Rooms */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="/images/img-9900.jpg"
                    alt="Luxurious Hotel Room with Pool View"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardHeader>
                  <CardTitle>Luxurious Accommodations</CardTitle>
                  <CardDescription>
                    Spacious rooms with pool views, modern furnishings, and premium amenities
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Pool Evening */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="/images/aw.jpg"
                    alt="Evening Pool with Lighting"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardHeader>
                  <CardTitle>Stunning Pool Areas</CardTitle>
                  <CardDescription>
                    Beautiful pools with ambient lighting, perfect for relaxation after conference sessions
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Fitness Center */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="/images/img-9667ed.jpg"
                    alt="Modern Fitness Center"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardHeader>
                  <CardTitle>Modern Fitness Center</CardTitle>
                  <CardDescription>
                    State-of-the-art gym equipment in a contemporary, climate-controlled environment
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Sports Facilities */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="/images/img-0010.jpg"
                    alt="Outdoor Sports Facilities"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardHeader>
                  <CardTitle>Outdoor Recreation</CardTitle>
                  <CardDescription>
                    Basketball courts, adventure activities, and outdoor sports facilities including Padel (coming soon)
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Kayuputih Family Reflexology */}
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="/images/img-8942e.jpg"
                    alt="Kayuputih Family Reflexology Spa Treatment"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <CardHeader>
                  <CardTitle>Kayuputih Family Reflexology</CardTitle>
                  <CardDescription>
                    Traditional reflexology and spa treatments for complete relaxation and rejuvenation
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Venue Details Section with Improved Styling */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-3xl font-bold mb-8 text-center">Venue Details</h2>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Venue Information - Left Column */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-muted-foreground">
                      The Singhasari Resort & Convention Batu
                      <br />
                      Jl. Ir. Soekarno No. 120
                      <br />
                      Batu, Malang, Jawa Timur 65236
                      <br />
                      Indonesia
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Phone className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        <strong>Resort:</strong>{" "}
                        <a href="tel:+62341513333" className="text-cyan-600 hover:underline">
                          (62-341) 513333
                        </a>
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Conference Info:</strong>{" "}
                        <a
                          href="https://wa.me/6289602626709"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-600 hover:underline"
                        >
                          +62 896-0262-6709 (WhatsApp)
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:admin@isapm2026.org" className="text-cyan-600 hover:underline">
                      admin@isapm2026.org
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Conference Dates</h3>
                    <p className="text-muted-foreground">April 16-18, 2026</p>
                  </div>
                </div>

                {/* Getting There info moved to left column for better balance */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Getting There</h3>
                  <ul className="space-y-4 text-sm text-muted-foreground">
                    <li>
                      <strong className="text-foreground block mb-1">By Air (International/Major):</strong>
                      Juanda International Airport (SUB), Surabaya. The most common entry point for international and
                      many domestic flights.
                      <br />
                      <span className="italic">
                        Travel time: approx. 2-3 hours to Batu via Pandaan-Malang Toll Road.
                      </span>
                    </li>
                    <li>
                      <strong className="text-foreground block mb-1">By Air (Regional):</strong>
                      Abdul Rachman Saleh Airport (MLG), Malang. Closer option for select domestic flights.
                      <br />
                      <span className="italic">Travel time: approx. 45-60 minutes to the resort.</span>
                    </li>
                    <li>
                      <strong className="text-foreground block mb-1">By Train:</strong>
                      Malang Kota Baru Station. Scenic train routes available from Jakarta, Bandung, Yogyakarta, and
                      Surabaya.
                      <br />
                      <span className="italic">Travel time: approx. 30-45 minutes by car to Batu.</span>
                    </li>
                    <li>
                      <strong className="text-foreground block mb-1">Ground Transport:</strong>
                      Ride-hailing apps (Grab, Gojek) and official airport taxis are widely available. Private car
                      rentals can also be arranged from airports or stations.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Location Map - Right Column */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl overflow-hidden h-[400px] shadow-md">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.3445!2d112.5209!3d-7.8774!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e78819b8b8b8b8b%3A0x1234567890abcdef!2sThe%20Singhasari%20Resort%20Batu!5e0!3m2!1sen!2sid!4v1234567890123!5m2!1sen!2sid"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    title="The Singhasari Resort & Convention Batu Map"
                  ></iframe>
                </div>

                <Card className="border-cyan-200 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-cyan-600" />
                      Quick Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                      <a href="https://www.thesinghasari.com/" target="_blank" rel="noopener noreferrer">
                        <Hotel className="w-4 h-4 mr-2" />
                        Visit Resort Website
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                      <a href="https://goo.gl/maps/singhasari" target="_blank" rel="noopener noreferrer">
                        <MapPin className="w-4 h-4 mr-2" />
                        Open in Google Maps
                      </a>
                    </Button>
                    <Button asChild className="w-full justify-start bg-cyan-600 hover:bg-cyan-700">
                      <Link href="/hotel-booking">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Your Room
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Accommodations & Hotel Booking */}
        <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-cyan-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Hotel className="w-8 h-8 text-cyan-600" />
              <h2 className="font-display text-3xl font-bold">Hotel Accommodations & Booking</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Room Types & Pricing */}
              <div className="space-y-6">
                <Card className="border-cyan-200 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                      Deluxe Room
                    </CardTitle>
                    <CardDescription>Spacious comfort with modern amenities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <span className="text-sm font-medium text-cyan-900">Rooms Available:</span>
                        <span className="text-lg font-bold text-cyan-600">
                          {roomAvailability.deluxe.available} / {roomAvailability.deluxe.total}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-cyan-600">Rp 1,250,000</span>
                        <span className="text-muted-foreground">/ night</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className="text-cyan-600 font-bold">•</span> King or twin beds
                        </li>
                        <li className="flex gap-2">
                          <span className="text-cyan-600 font-bold">•</span> Mountain or garden view
                        </li>
                        <li className="flex gap-2">
                          <span className="text-cyan-600 font-bold">•</span> Modern bathroom with amenities
                        </li>
                        <li className="flex gap-2">
                          <span className="text-cyan-600 font-bold">•</span> Complimentary WiFi & breakfast
                        </li>
                      </ul>
                      <DeluxeRoomGallery />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-cyan-200 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                      Premier Room
                    </CardTitle>
                    <CardDescription>Enhanced luxury and exclusive amenities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                        <span className="text-sm font-medium text-cyan-900">Rooms Available:</span>
                        <span className="text-lg font-bold text-cyan-600">
                          {roomAvailability.premier.available} / {roomAvailability.premier.total}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-cyan-600">Rp 1,350,000</span>
                        <span className="text-muted-foreground">/ night</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className="text-cyan-600 font-bold">•</span> Larger room with premium furnishings
                        </li>
                        <li className="flex gap-2">
                          <span className="text-cyan-600 font-bold">•</span> Panoramic mountain views
                        </li>
                        <li className="flex gap-2">
                          <span className="text-cyan-600 font-bold">•</span> Executive bathroom with bathtub
                        </li>
                        <li className="flex gap-2">
                          <span className="text-cyan-600 font-bold">•</span> Complimentary WiFi, breakfast & minibar
                        </li>
                      </ul>
                      <PremierRoomGallery />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resort Facilities & Booking CTA */}
              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-cyan-600 to-teal-600 text-white border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white">Book Your Stay</CardTitle>
                    <CardDescription className="text-white/90">Reserve your room for ISAPM 2026</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-white/90">
                      Stay at the conference venue for maximum convenience. Book your room now and enjoy easy access to
                      all sessions, networking opportunities, and resort amenities.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/80">Conference Dates:</span>
                        <span className="font-medium">April 16-18, 2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Check-in:</span>
                        <span className="font-medium">2:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/80">Check-out:</span>
                        <span className="font-medium">12:00 PM</span>
                      </div>
                    </div>
                    <Link href="/hotel-booking" className="block">
                      <Button
                        size="lg"
                        className="w-full bg-white text-cyan-600 hover:bg-white/90 shadow-md hover:shadow-lg transition-all"
                      >
                        <Hotel className="w-5 h-5 mr-2" />
                        Book Hotel Room
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Resort Facilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li className="flex gap-2">
                        <span className="text-cyan-600 font-bold">•</span> Modern convention center & conference rooms
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-600 font-bold">•</span> High-speed WiFi throughout the resort
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-600 font-bold">•</span> Multiple on-site restaurants & cafes
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-600 font-bold">•</span> Business center & meeting facilities
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-600 font-bold">•</span> Swimming pool, fitness center & spa
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-600 font-bold">•</span> Beautiful mountain views and resort grounds
                      </li>
                      <li className="flex gap-2">
                        <span className="text-cyan-600 font-bold">•</span> 24-hour room service & concierge
                      </li>
                    </ul>
                    <Button
                      variant="outline"
                      asChild
                      className="w-full mt-6 border-cyan-600 text-cyan-600 hover:bg-cyan-50 bg-transparent"
                    >
                      <a href="https://www.thesinghasari.com/" target="_blank" rel="noopener noreferrer">
                        Visit Resort Website
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
