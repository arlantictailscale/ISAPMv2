import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  Moon,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  BedDouble,
  Users,
  Coffee,
  Wifi,
  Car,
} from "lucide-react"
import Link from "next/link"

interface HotelOrder {
  id: string
  created_at: string
  full_name: string
  email: string
  phone: string
  order_items: {
    id: string
    item_type: string
    hotel_room_type: string
    check_in_date: string
    check_out_date: string
    nights: number
    unit_price: number
    currency: string
  }[]
  order_payments: {
    id: string
    payment_status: string
    verified_at: string
    invoice_number: string
  }[]
}

// Hotel room details
const ROOM_DETAILS: Record<
  string,
  {
    name: string
    description: string
    amenities: string[]
    image: string
  }
> = {
  deluxe: {
    name: "Deluxe Room",
    description: "Spacious room with modern amenities and garden view",
    amenities: ["King/Twin Bed", "Free WiFi", "Breakfast Included", "Air Conditioning", "Mini Bar"],
    image: "/deluxe-hotel-room.png",
  },
  premier: {
    name: "Premier Room",
    description: "Premium room with enhanced comfort and city view",
    amenities: ["King Bed", "Free WiFi", "Breakfast Included", "Air Conditioning", "Mini Bar", "Bathtub"],
    image: "/premier-hotel-room.jpg",
  },
  suite: {
    name: "Suite Room",
    description: "Luxurious suite with separate living area and mountain view",
    amenities: [
      "King Bed",
      "Free WiFi",
      "Breakfast Included",
      "Air Conditioning",
      "Mini Bar",
      "Bathtub",
      "Living Room",
    ],
    image: "/luxury-hotel-suite.png",
  },
}

export default async function MyHotelsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch orders that contain hotel items with approved payments
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      full_name,
      email,
      phone,
      order_items!inner (
        id,
        item_type,
        hotel_room_type,
        check_in_date,
        check_out_date,
        nights,
        unit_price,
        currency
      ),
      order_payments (
        id,
        payment_status,
        verified_at,
        invoice_number
      )
    `,
    )
    .eq("user_id", user.id)
    .eq("order_items.item_type", "hotel")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error loading hotel bookings:", error.message)
  }

  // Filter for only approved hotel bookings
  const approvedBookings =
    orders?.filter((order: HotelOrder) => {
      const payment = order.order_payments?.[0]
      return payment?.payment_status === "verified"
    }) || []

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-amber-50/50 to-background">
        {/* Header Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">My Hotel Reservations</h1>
                <p className="text-amber-100">View your confirmed hotel bookings</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {approvedBookings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">No Hotel Reservations Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You don&apos;t have any confirmed hotel reservations, or your payment is still being processed.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/hotel-booking">
                      <Button className="bg-amber-600 hover:bg-amber-700">
                        <Building2 className="w-4 h-4 mr-2" />
                        Book a Room
                      </Button>
                    </Link>
                    <Link href="/my-purchases">
                      <Button variant="outline">Check Payment Status</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {approvedBookings.map((order: HotelOrder) => {
                  const hotelItem = order.order_items.find((item) => item.item_type === "hotel")
                  const payment = order.order_payments?.[0]
                  const roomType = hotelItem?.hotel_room_type?.toLowerCase() || "deluxe"
                  const roomDetails = ROOM_DETAILS[roomType] || ROOM_DETAILS.deluxe

                  if (!hotelItem) return null

                  return (
                    <Card key={order.id} className="overflow-hidden border-amber-200 shadow-lg">
                      {/* Booking Header */}
                      <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <Badge className="bg-white/20 text-white border-white/30 mb-3">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Reservation Confirmed
                            </Badge>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">The Singhasari Resort</h2>
                            <p className="text-amber-100 text-sm sm:text-base flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Batu, Malang, East Java, Indonesia
                            </p>
                          </div>
                          <div className="shrink-0">
                            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                              <Building2 className="w-8 h-8" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        {/* Booking Summary */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Check-in</p>
                              <p className="font-semibold text-sm">{formatShortDate(hotelItem.check_in_date)}</p>
                              <p className="text-xs text-muted-foreground">From 14:00</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Check-out</p>
                              <p className="font-semibold text-sm">{formatShortDate(hotelItem.check_out_date)}</p>
                              <p className="text-xs text-muted-foreground">Until 12:00</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                            <Moon className="w-5 h-5 text-amber-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-semibold text-sm">
                                {hotelItem.nights} Night{hotelItem.nights > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                            <BedDouble className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-xs text-muted-foreground">Room Type</p>
                              <p className="font-semibold text-sm">{roomDetails.name}</p>
                            </div>
                          </div>
                        </div>

                        {/* Room Details */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-8">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <BedDouble className="w-5 h-5 text-amber-600" />
                            Room Details
                          </h3>
                          <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                              <h4 className="font-medium text-lg mb-2">{roomDetails.name}</h4>
                              <p className="text-sm text-muted-foreground mb-4">{roomDetails.description}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {roomDetails.amenities.map((amenity, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                    <span>{amenity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border">
                              <h4 className="font-medium mb-3">Hotel Amenities</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Wifi className="w-4 h-4" />
                                  <span>Free WiFi</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Coffee className="w-4 h-4" />
                                  <span>Restaurant</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Car className="w-4 h-4" />
                                  <span>Free Parking</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  <span>Concierge</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Guest Information */}
                        <div className="grid gap-6 lg:grid-cols-2 mb-8">
                          <div className="border rounded-xl p-4">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5 text-amber-600" />
                              Guest Information
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Guest Name</p>
                                  <p className="font-medium">{order.full_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Email</p>
                                  <p className="font-medium">{order.email}</p>
                                </div>
                              </div>
                              {order.phone && (
                                <div className="flex items-center gap-3">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="font-medium">{order.phone}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="border rounded-xl p-4">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-amber-600" />
                              Payment Information
                            </h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Room Rate</span>
                                <span className="font-medium">
                                  {hotelItem.currency === "IDR" ? "Rp" : hotelItem.currency}{" "}
                                  {hotelItem.unit_price.toLocaleString("id-ID")} / night
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="font-medium">
                                  {hotelItem.nights} night{hotelItem.nights > 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="border-t pt-3 flex justify-between items-center">
                                <span className="font-semibold">Total Paid</span>
                                <span className="font-bold text-lg text-amber-600">
                                  {hotelItem.currency === "IDR" ? "Rp" : hotelItem.currency}{" "}
                                  {(hotelItem.unit_price * hotelItem.nights).toLocaleString("id-ID")}
                                </span>
                              </div>
                              {payment?.invoice_number && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Invoice</span>
                                  <span className="font-mono">{payment.invoice_number}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Important Information */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                            <Clock className="w-5 h-5" />
                            Important Information
                          </h3>
                          <ul className="space-y-2 text-sm text-blue-700">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Check-in time: 14:00 - 22:00 (Please inform us if you arrive late)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Check-out time: Before 12:00</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Please bring a valid ID and this confirmation when checking in</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              <span>Complimentary breakfast is included in your stay</span>
                            </li>
                          </ul>
                        </div>

                        {/* Order Info */}
                        <div className="border-t pt-4 mt-6">
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                            <span>Booking ID: {order.id.slice(0, 8)}</span>
                            <span>
                              Booked:{" "}
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span>
                              Confirmed:{" "}
                              {payment?.verified_at
                                ? new Date(payment.verified_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Hotel Contact */}
            <Card className="mt-8 border-amber-200">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-amber-600" />
                  Hotel Contact Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hotel</p>
                      <p className="font-medium">The Singhasari Resort</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">+62 341 595 888</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">reservation@singhasari.com</p>
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
