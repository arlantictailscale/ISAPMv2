"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Hotel, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format, differenceInDays } from "date-fns"

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

  const [checkInDate, setCheckInDate] = useState("")
  const [checkOutDate, setCheckOutDate] = useState("")
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

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Hotel className="w-10 h-10 text-primary" />
              <h1 className="font-display text-4xl font-bold">Hotel Booking</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Reserve your room at The Singhasari Resort & Convention, Batu, Malang, Jawa Timur
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>The Singhasari Resort & Convention</CardTitle>
                <CardDescription>Batu, Malang, Jawa Timur</CardDescription>
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
                          {room.name} - Rp {room.price.toLocaleString("id-ID")}
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
                  <div className="bg-muted p-6 rounded-lg space-y-2">
                    <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>
                    <div className="flex justify-between">
                      <span>Room Type:</span>
                      <span className="font-medium">{selectedRoom.name}</span>
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

                <Button
                  onClick={handleBookNow}
                  disabled={isSubmitting || nights <= 0 || !roomType}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Book Now"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
