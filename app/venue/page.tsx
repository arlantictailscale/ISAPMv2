import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { MapPin, Phone, Mail, Clock, Hotel, Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Venue() {
  return (
    <>
      <Navigation />
      <main className="pt-24 overflow-x-hidden">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">Venue & Accommodations</h1>
            <p className="text-lg text-muted-foreground">The Singhasari Resort & Convention Batu, Malang, Jawa Timur</p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Venue Information */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-8">Venue Details</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
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
                  <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        <strong>Resort:</strong>{" "}
                        <a href="tel:+62341513333" className="text-primary hover:underline">
                          (62-341) 513333
                        </a>
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Conference Info:</strong>{" "}
                        <a
                          href="https://wa.me/6289602626709"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          +62 896-0262-6709 (WhatsApp)
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:admin@isapm2026.org" className="text-primary hover:underline">
                      admin@isapm2026.org
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Conference Dates</h3>
                    <p className="text-muted-foreground">April 16-18, 2026</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Map & Info */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl overflow-hidden h-80">
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

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
                <h3 className="font-semibold mb-3">Getting There</h3>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground block mb-1">By Air (International/Major):</strong>
                    Juanda International Airport (SUB), Surabaya. The most common entry point for international and many
                    domestic flights.
                    <br />
                    <span className="italic">Travel time: approx. 2-3 hours to Batu via Pandaan-Malang Toll Road.</span>
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
                    Ride-hailing apps (Grab, Gojek) and official airport taxis are widely available. Private car rentals
                    can also be arranged from airports or stations.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Accommodations & Hotel Booking */}
        <section className="py-16 px-4 bg-card">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Hotel className="w-8 h-8 text-primary" />
              <h2 className="font-display text-2xl font-bold">Hotel Accommodations & Booking</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Room Types & Pricing */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Deluxe Room
                    </CardTitle>
                    <CardDescription>Spacious comfort with modern amenities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">Rp 1,250,000</span>
                        <span className="text-muted-foreground">/ night</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className="text-primary font-bold">•</span> King or twin beds
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary font-bold">•</span> Mountain or garden view
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary font-bold">•</span> Modern bathroom with amenities
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary font-bold">•</span> Complimentary WiFi & breakfast
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Premier Room
                    </CardTitle>
                    <CardDescription>Enhanced luxury and exclusive amenities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">Rp 1,350,000</span>
                        <span className="text-muted-foreground">/ night</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                          <span className="text-primary font-bold">•</span> Larger room with premium furnishings
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary font-bold">•</span> Panoramic mountain views
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary font-bold">•</span> Executive bathroom with bathtub
                        </li>
                        <li className="flex gap-2">
                          <span className="text-primary font-bold">•</span> Complimentary WiFi, breakfast & minibar
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resort Facilities & Booking CTA */}
              <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle>Book Your Stay</CardTitle>
                    <CardDescription>Reserve your room for ISAPM 2026</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Stay at the conference venue for maximum convenience. Book your room now and enjoy easy access to
                      all sessions, networking opportunities, and resort amenities.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conference Dates:</span>
                        <span className="font-medium">April 16-18, 2026</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-in:</span>
                        <span className="font-medium">2:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-out:</span>
                        <span className="font-medium">12:00 PM</span>
                      </div>
                    </div>
                    <Link href="/hotel-booking" className="block">
                      <Button
                        size="lg"
                        className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                      >
                        <Hotel className="w-5 h-5 mr-2" />
                        Book Hotel Room
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resort Facilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span> Modern convention center & conference rooms
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span> High-speed WiFi throughout the resort
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span> Multiple on-site restaurants & cafes
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span> Business center & meeting facilities
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span> Swimming pool, fitness center & spa
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span> Beautiful mountain views and resort grounds
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary font-bold">•</span> 24-hour room service & concierge
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
