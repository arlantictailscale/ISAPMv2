"use client"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, CheckCircle, Clock, Hotel, BedDouble, Users, ShieldCheck } from "lucide-react"
import Link from "next/link"

interface OrderItem {
  id: string
  hotel_room_type: string
  check_in_date: string
  check_out_date: string
  nights: number
  unit_price: number
  currency: string
  item_type: string
}

interface OrderPayment {
  payment_status: string
  payment_proof_url?: string
  verified_at?: string
}

interface Order {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  institution?: string
  status: string
  total_amount: number
  currency: string
  created_at: string
  order_items?: OrderItem[]
  order_payments?: OrderPayment[]
}

export default async function MyHotelBookingsPage() {
  const supabase = await createClient()
  const router = useRouter()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    router.push("/auth/login")
    return null
  }

  const { data: bookings } = await supabase
    .from("orders")
    .select(`
      *,
      order_items!inner (*),
      order_payments!inner (
        payment_status,
        payment_proof_url,
        verified_at
      )
    `)
    .eq("user_id", user.id)
    .eq("order_items.item_type", "hotel")
    .eq("order_payments.payment_status", "verified")
    .order("created_at", { ascending: false })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getRoomIcon = (roomType: string) => {
    const type = roomType.toLowerCase()
    if (type.includes("suite") || type.includes("premier")) {
      return <BedDouble className="w-5 h-5 text-primary" />
    }
    return <Hotel className="w-5 h-5 text-primary" />
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-background to-muted/20">
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Hotel className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold">My Hotel Bookings</h1>
                  <p className="text-muted-foreground">Your confirmed accommodation reservations</p>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">Verified Bookings Only</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      This page displays only hotel bookings with verified payments. Pending or unsubmitted bookings are
                      not shown here.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!bookings || bookings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                    <Hotel className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">No Verified Hotel Bookings</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    You don't have any verified hotel bookings yet. Complete your booking and payment verification to
                    see your confirmed reservations here.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/hotel-booking">
                      <Button size="lg" className="gap-2">
                        <Hotel className="w-4 h-4" />
                        Book Hotel Room
                      </Button>
                    </Link>
                    <Link href="/my-purchases">
                      <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                        <Clock className="w-4 h-4" />
                        View Pending Bookings
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => {
                  const hotelItems = booking.order_items?.filter((item) => item.item_type === "hotel") || []
                  const payment = booking.order_payments?.[0]

                  return (
                    <Card
                      key={booking.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow border-green-200 dark:border-green-900"
                    >
                      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-b border-green-200 dark:border-green-900">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 mb-2">
                              <Hotel className="w-5 h-5 text-primary" />
                              Booking #{booking.id.slice(0, 8).toUpperCase()}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Booked on{" "}
                              {new Date(booking.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </CardDescription>
                          </div>
                          <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" />
                            Verified & Confirmed
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 rounded-lg border border-primary/20">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-background rounded-lg">
                                <Hotel className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-bold mb-1">The Singhasari Resort & Convention</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span>Batu, Malang, Jawa Timur</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Official accommodation for ISAPM 2026 National Meeting
                                </p>
                              </div>
                            </div>
                          </div>

                          {hotelItems.map((item) => (
                            <div
                              key={item.id}
                              className="border rounded-lg p-5 bg-gradient-to-br from-background to-muted/30"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  {getRoomIcon(item.hotel_room_type)}
                                  <div>
                                    <h4 className="text-lg font-bold">{item.hotel_room_type}</h4>
                                    <Badge variant="outline" className="text-xs font-semibold mt-1">
                                      {item.nights} Night{item.nights !== 1 ? "s" : ""}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-primary">
                                    {item.currency} {(item.unit_price * item.nights).toLocaleString("id-ID")}
                                  </span>
                                  {item.nights > 1 && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.currency} {item.unit_price.toLocaleString("id-ID")} × {item.nights} nights
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2 text-sm bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-xs text-muted-foreground mb-1">Check-In</p>
                                    <p className="font-semibold">{formatDate(item.check_in_date)}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">After 2:00 PM</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-xs text-muted-foreground mb-1">Check-Out</p>
                                    <p className="font-semibold">{formatDate(item.check_out_date)}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Before 12:00 PM</p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                <div className="flex items-start gap-3 text-sm">
                                  <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                      Payment Verified & Booking Confirmed
                                    </p>
                                    <p className="text-green-700 dark:text-green-300 mb-2">
                                      Your reservation has been confirmed. Please bring a valid ID and this booking
                                      reference at check-in.
                                    </p>
                                    {payment?.verified_at && (
                                      <p className="text-xs text-green-600 dark:text-green-400">
                                        Verified on{" "}
                                        {new Date(payment.verified_at).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="border-t pt-6">
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Guest Information
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm bg-muted/50 p-4 rounded-lg">
                              <div>
                                <span className="text-muted-foreground">Name:</span>
                                <p className="font-medium">{booking.full_name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Email:</span>
                                <p className="font-medium break-all">{booking.email}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Phone:</span>
                                <p className="font-medium">{booking.phone}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Institution:</span>
                                <p className="font-medium">{booking.institution || "Not specified"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2 flex-wrap">
                            <Link href={`/payment/order/${booking.id}`} className="flex-1 min-w-[200px]">
                              <Button variant="outline" className="w-full gap-2 bg-transparent" size="lg">
                                <CheckCircle className="w-4 h-4" />
                                View Payment Details
                              </Button>
                            </Link>
                            <Link href="/venue" className="flex-1 min-w-[200px]">
                              <Button variant="outline" className="w-full gap-2 bg-transparent" size="lg">
                                <MapPin className="w-4 h-4" />
                                View Resort Information
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Hotel className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Need to Modify Your Booking?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      For changes to your reservation or special requests, please contact our support team or the hotel
                      directly.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Link href="/contact">
                        <Button variant="outline" size="sm">
                          Contact Support
                        </Button>
                      </Link>
                      <Link href="/hotel-booking">
                        <Button variant="outline" size="sm">
                          Book Another Room
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
