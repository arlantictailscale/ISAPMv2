"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Hotel, Loader2, Calendar, MapPin, Users } from "lucide-react"
import { toast } from "sonner"
import { format, differenceInDays } from "date-fns"
import { AddToCartButton } from "@/components/add-to-cart-button"

const ROOM_TYPES = [
  { id: "deluxe", name: "Deluxe Room", price: 1250000 },
  { id: "premier", name: "Premier Room", price: 1350000 },
]

export default function HotelBookingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [checkInDate, setCheckInDate] = useState("2026-04-16")
  const [checkOutDate, setCheckOutDate] = useState("2026-04-18")
  const [roomType, setRoomType] = useState("")
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
        setGuestName(`${profileData.first_name} ${profileData.last_name}`)
        setGuestEmail(user.email || "")
        setGuestPhone(profileData.phone || "")
      }
    } catch (error) {
      console.error("[v0] Auth error:", error)
      toast.error("Failed to load user information")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0
    const nights = differenceInDays(new Date(checkOutDate), new Date(checkInDate))
    return nights > 0 ? nights : 0
  }

  const calculateTotal = () => {
    const selectedRoom = ROOM_TYPES.find((r) => r.id === roomType)
    if (!selectedRoom) return 0
    return selectedRoom.price * calculateNights()
  }

  const handleBookNow = async () => {
    if (!user || !profile) {
      toast.error("Please log in to continue")
      return
    }

    if (!checkInDate || !checkOutDate || !roomType || !guestName || !guestEmail || !guestPhone) {
      toast.error("Please fill in all fields")
      return
    }

    const nights = calculateNights()
    if (nights <= 0) {
      toast.error("Check-out date must be after check-in date")
      return
    }

    try {
      setIsSubmitting(true)

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: calculateTotal(),
          status: "pending",
          full_name: guestName,
          email: guestEmail,
          phone: guestPhone,
          position: profile.position || "",
          institution: profile.institution || "",
        })
        .select()
        .single()

      if (orderError) throw orderError

      const selectedRoom = ROOM_TYPES.find((r) => r.id === roomType)
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: orderData.id,
        item_type: "hotel",
        event_label: `${selectedRoom?.name} - ${nights} night(s)`,
        hotel_room_type: roomType,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        nights: nights,
        unit_price: selectedRoom?.price || 0,
        currency: "IDR",
      })

      if (itemError) throw itemError

      toast.success("Booking created successfully!")
      router.push(`/payment/order/${orderData.id}`)
    } catch (error: any) {
      console.error("[v0] Booking error:", error)
      toast.error(`Booking error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    )
  }

  const selectedRoom = ROOM_TYPES.find((r) => r.id === roomType)
  const nights = calculateNights()
  const total = calculateTotal()
  const isFormValid = checkInDate && checkOutDate && roomType && nights > 0

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <section className="py-12 px-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Hotel className="w-12 h-12 text-primary" />
                  <div>
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-balance">Hotel Accommodation</h1>
                    <p className="text-lg text-primary font-semibold mt-1">ISAPM 8th National Meeting 2026</p>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Reserve your accommodation at our exclusive event venue and enjoy convenient access to all conference
                  activities, workshops, and networking opportunities.
                </p>
              </div>

              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Calendar className="w-6 h-6 text-primary" />
                    Event Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Event Dates</p>
                      <p className="text-muted-foreground">April 16-18, 2026</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        • Day 1-2: CPD Courses (April 16-17)
                        <br />• Day 3: Workshops & Symposium (April 17)
                        <br />• Day 4: Symposium (April 18)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Location</p>
                      <p className="text-muted-foreground">The Singhasari Resort & Convention</p>
                      <p className="text-sm text-muted-foreground">Batu, Malang, Jawa Timur, Indonesia</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Expected Participants</p>
                      <p className="text-sm text-muted-foreground">
                        Anesthesiologists, Pain Specialists, General Practitioners, Nurses, Healthcare Professionals
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Booking Form Section */}
        <section className="py-12 px-4 bg-background">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold mb-2">Complete Your Booking</h2>
              <p className="text-muted-foreground">
                Fill in your details below to reserve your accommodation for ISAPM 2026
              </p>
            </div>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>Select your room type and dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-in Date</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-out Date</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger id="roomType">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} - Rp {room.price.toLocaleString("id-ID")}/night
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Guest Information</h3>

                  <div className="space-y-2">
                    <Label htmlFor="guestName">Full Name</Label>
                    <Input id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="guestEmail">Email</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guestPhone">Phone</Label>
                      <Input
                        id="guestPhone"
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {nights > 0 && selectedRoom && (
                  <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 rounded-lg border border-primary/20 space-y-2">
                    <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
                    <div className="flex justify-between">
                      <span>Room Type:</span>
                      <span className="font-medium">{selectedRoom.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check-in:</span>
                      <span className="font-medium">{format(new Date(checkInDate), "PPP")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check-out:</span>
                      <span className="font-medium">{format(new Date(checkOutDate), "PPP")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of Nights:</span>
                      <span className="font-medium">{nights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per Night:</span>
                      <span className="font-medium">Rp {selectedRoom.price.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {isFormValid && selectedRoom && (
                    <AddToCartButton
                      item={{
                        item_type: "hotel",
                        hotel_room_type: roomType,
                        check_in_date: checkInDate,
                        check_out_date: checkOutDate,
                        nights: nights,
                        unit_price: selectedRoom.price,
                        currency: "IDR",
                      }}
                      variant="default"
                      size="lg"
                      className="w-full"
                    />
                  )}
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
