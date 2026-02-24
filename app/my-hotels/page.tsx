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
  MapPin,
  Phone,
  Mail,
  CreditCard,
  BedDouble,
  Users,
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
    extra_beds: number // Add extra_beds field
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
        currency,
        extra_beds
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
                  const hotelItems = order.order_items.filter((item) => item.item_type === "hotel")
                  const payment = order.order_payments?.[0]

                  if (hotelItems.length === 0) return null

                  const totalAmount = hotelItems.reduce((sum, item) => sum + item.unit_price * item.nights, 0)
                  const currency = hotelItems[0].currency

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
                            <h2 className="text-xl sm:text-2xl font-bold mb-2">The Singhasari Hotel</h2>
                            <p className="text-amber-100 text-sm sm:text-base flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Batu, Malang, East Java, Indonesia
                            </p>
                            <p className="text-amber-100 text-sm mt-2">
                              {hotelItems.length} Room{hotelItems.length > 1 ? "s" : ""} Reserved
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
                        <div className="space-y-6 mb-8">
                          {hotelItems.map((hotelItem, roomIndex) => {
                            const roomType = hotelItem.hotel_room_type?.toLowerCase() || "deluxe"
                            const roomDetails = ROOM_DETAILS[roomType] || ROOM_DETAILS.deluxe

                            return (
                              <div
                                key={hotelItem.id}
                                className="border-2 border-amber-100 rounded-xl p-6 bg-amber-50/30"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <BedDouble className="w-5 h-5 text-amber-600" />
                                    Room {roomIndex + 1}: {roomDetails.name}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    {hotelItem.extra_beds > 0 && (
                                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                                        +{hotelItem.extra_beds} Extra Bed{hotelItem.extra_beds > 1 ? "s" : ""}
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="bg-amber-200 text-amber-900">
                                      {hotelItem.nights} Night{hotelItem.nights > 1 ? "s" : ""}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Booking Summary for this room */}
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Check-in</p>
                                      <p className="font-semibold text-sm">
                                        {formatShortDate(hotelItem.check_in_date)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                                    <Calendar className="w-4 h-4 text-red-600" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Check-out</p>
                                      <p className="font-semibold text-sm">
                                        {formatShortDate(hotelItem.check_out_date)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                                    <CreditCard className="w-4 h-4 text-amber-600" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Room Total</p>
                                      <p className="font-semibold text-sm">
                                        {currency === "IDR" ? "Rp" : currency}{" "}
                                        {(hotelItem.unit_price * hotelItem.nights).toLocaleString("id-ID")}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Room amenities */}
                                <div className="grid grid-cols-2 gap-2">
                                  {roomDetails.amenities.slice(0, 4).map((amenity, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                                      <span className="text-muted-foreground">{amenity}</span>
                                    </div>
                                  ))}
                                  {hotelItem.extra_beds > 0 && (
                                    <div className="flex items-center gap-2 text-sm col-span-2 mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                                      <BedDouble className="w-4 h-4 text-orange-500 shrink-0" />
                                      <span className="text-orange-700 font-medium">
                                        {hotelItem.extra_beds} Extra Bed{hotelItem.extra_beds > 1 ? "s" : ""} with
                                        Breakfast Included
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
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
                                <span className="text-muted-foreground">Rooms</span>
                                <span className="font-medium">{hotelItems.length}</span>
                              </div>
                              <div className="border-t pt-3 flex justify-between items-center">
                                <span className="font-semibold">Total Paid</span>
                                <span className="font-bold text-lg text-amber-600">
                                  {currency === "IDR" ? "Rp" : currency} {totalAmount.toLocaleString("id-ID")}
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
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
