"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Hotel, Loader2, Calendar, MapPin, Plus, Trash2, UserCircle, Copy, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { format, differenceInDays, parseISO } from "date-fns"
import { addToCart } from "@/app/actions/cart"
import { getRoomAvailability } from "@/app/actions/get-room-availability"
import { useCart } from "@/lib/cart/cart-context"
import { Badge } from "@/components/ui/badge"

const ROOM_TYPES = [
  { id: "deluxe", name: "Deluxe Room", price: 1250000, amenities: ["Queen Bed", "Garden View", "WiFi", "Mini Bar"] },
  {
    id: "premier",
    name: "Premier Room",
    price: 1350000,
    amenities: ["King Bed", "Mountain View", "WiFi", "Mini Bar", "Bathtub"],
  },
]

interface RoomBooking {
  id: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  guestName: string
  guestEmail: string
  guestPhone: string
  specialRequests: string
  isExpanded: boolean
}

export default function HotelBookingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { refreshCart, user, isLoading: isCartLoading } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [availability, setAvailability] = useState<any>(null)

  const [rooms, setRooms] = useState<RoomBooking[]>([
    {
      id: "room-1",
      roomType: "",
      checkInDate: "2026-04-16",
      checkOutDate: "2026-04-19",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      specialRequests: "",
      isExpanded: true,
    },
  ])

  useEffect(() => {
    checkAuth()
    loadRoomAvailability()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?redirect=/hotel-booking")
        return
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileData) {
        setProfile(profileData)
        const fullName =
          profileData.full_name || `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim()

        setRooms((prev) => [
          {
            ...prev[0],
            guestName: fullName,
            guestEmail: user.email || "",
            guestPhone: profileData.phone || "",
          },
        ])
      }
    } catch (error) {
      console.error("[v0] Auth error:", error)
      toast.error("Failed to load user information")
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoomAvailability = async () => {
    const data = await getRoomAvailability()
    setAvailability(data)
  }

  const calculateNights = (checkInDate: string, checkOutDate: string) => {
    if (!checkInDate || !checkOutDate) return 0
    const nights = differenceInDays(parseISO(checkOutDate), parseISO(checkInDate))
    return nights > 0 ? nights : 0
  }

  const addRoom = () => {
    const lastRoom = rooms[rooms.length - 1]
    const newRoom: RoomBooking = {
      id: `room-${Date.now()}`,
      roomType: "",
      checkInDate: lastRoom?.checkInDate || "2026-04-16",
      checkOutDate: lastRoom?.checkOutDate || "2026-04-19",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      specialRequests: "",
      isExpanded: true,
    }
    // Collapse other rooms when adding new one
    setRooms([...rooms.map((r) => ({ ...r, isExpanded: false })), newRoom])
  }

  const removeRoom = (id: string) => {
    if (rooms.length === 1) {
      toast.error("You must have at least one room")
      return
    }
    setRooms(rooms.filter((room) => room.id !== id))
  }

  const updateRoom = (id: string, field: keyof RoomBooking, value: string | boolean) => {
    setRooms(rooms.map((room) => (room.id === id ? { ...room, [field]: value } : room)))
  }

  const toggleRoomExpanded = (id: string) => {
    setRooms(rooms.map((room) => (room.id === id ? { ...room, isExpanded: !room.isExpanded } : room)))
  }

  const copyGuestInfoToAll = (sourceRoom: RoomBooking) => {
    setRooms(
      rooms.map((room) => ({
        ...room,
        guestName: sourceRoom.guestName,
        guestEmail: sourceRoom.guestEmail,
        guestPhone: sourceRoom.guestPhone,
      })),
    )
    toast.success("Guest information copied to all rooms")
  }

  const copyDatesToAll = (sourceRoom: RoomBooking) => {
    setRooms(
      rooms.map((room) => ({
        ...room,
        checkInDate: sourceRoom.checkInDate,
        checkOutDate: sourceRoom.checkOutDate,
      })),
    )
    toast.success("Dates copied to all rooms")
  }

  const validateBooking = () => {
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i]
      const nights = calculateNights(room.checkInDate, room.checkOutDate)

      if (nights <= 0) {
        toast.error(`Room ${i + 1}: Check-out date must be after check-in date`)
        return false
      }

      if (!room.roomType) {
        toast.error(`Room ${i + 1}: Please select a room type`)
        return false
      }

      if (!room.guestName || !room.guestEmail || !room.guestPhone) {
        toast.error(`Room ${i + 1}: Please fill in all guest information`)
        return false
      }
    }

    // Check availability
    const deluxeCount = rooms.filter((r) => r.roomType === "deluxe").length
    const premierCount = rooms.filter((r) => r.roomType === "premier").length

    if (availability) {
      if (deluxeCount > availability.deluxe.available) {
        toast.error(`Only ${availability.deluxe.available} Deluxe rooms available`)
        return false
      }
      if (premierCount > availability.premier.available) {
        toast.error(`Only ${availability.premier.available} Premier rooms available`)
        return false
      }
    }

    return true
  }

  const calculateTotal = () => {
    return rooms.reduce((total, room) => {
      const roomType = ROOM_TYPES.find((r) => r.id === room.roomType)
      const nights = calculateNights(room.checkInDate, room.checkOutDate)
      return total + (roomType?.price || 0) * nights
    }, 0)
  }

  const handleAddToCart = async () => {
    if (!validateBooking()) return

    setIsSubmitting(true)

    try {
      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i]
        const roomType = ROOM_TYPES.find((r) => r.id === room.roomType)
        if (!roomType) continue

        const nights = calculateNights(room.checkInDate, room.checkOutDate)

        const result = await addToCart({
          item_type: "hotel",
          // Include room number to make each label unique
          event_label: `Room ${i + 1}: ${roomType.name} - ${nights} night(s) - ${room.guestName}`,
          hotel_room_type: room.roomType,
          check_in_date: room.checkInDate,
          check_out_date: room.checkOutDate,
          nights: nights,
          unit_price: roomType.price,
          currency: "IDR",
        })

        if (result.error) {
          throw new Error(result.error)
        }
      }

      await refreshCart()
      toast.success(`${rooms.length} room(s) added to cart!`, {
        action: {
          label: "View Cart",
          onClick: () => router.push("/cart"),
        },
      })

      // Reset form
      setRooms([
        {
          id: "room-1",
          roomType: "",
          checkInDate: "2026-04-16",
          checkOutDate: "2026-04-19",
          guestName: profile?.full_name || "",
          guestEmail: user?.email || "",
          guestPhone: profile?.phone || "",
          specialRequests: "",
          isExpanded: true,
        },
      ])
    } catch (error: any) {
      console.error("[v0] Booking error:", error)
      toast.error(`Failed to add to cart: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isCartLoading) {
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

  const total = calculateTotal()
  const isFormValid = rooms.every((r) => {
    const nights = calculateNights(r.checkInDate, r.checkOutDate)
    return r.roomType && r.guestName && r.guestEmail && r.guestPhone && nights > 0
  })

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        {/* Header Section */}
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
                  Reserve your accommodation at our exclusive event venue. Book multiple rooms with flexible dates -
                  each room can have its own check-in and check-out dates.
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

                  {availability && (
                    <div className="flex items-start gap-3">
                      <Hotel className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="w-full">
                        <p className="font-semibold text-foreground mb-2">Room Availability</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Deluxe Room</span>
                            <Badge variant={availability.deluxe.available > 10 ? "default" : "destructive"}>
                              {availability.deluxe.available} available
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Premier Room</span>
                            <Badge variant={availability.premier.available > 10 ? "default" : "destructive"}>
                              {availability.premier.available} available
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Booking Form Section */}
        <section className="py-12 px-4 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold mb-2">Reserve Your Rooms</h2>
              <p className="text-muted-foreground">
                Each room can have different check-in/check-out dates and guest details
              </p>
            </div>

            {/* Rooms */}
            <div className="space-y-6">
              {rooms.map((room, index) => {
                const nights = calculateNights(room.checkInDate, room.checkOutDate)
                const roomType = ROOM_TYPES.find((r) => r.id === room.roomType)
                const roomTotal = roomType ? roomType.price * nights : 0

                return (
                  <Card key={room.id} className="border-primary/20 overflow-hidden">
                    {/* Room Header - Always Visible */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleRoomExpanded(room.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Hotel className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Room {index + 1}</h3>
                          <p className="text-sm text-muted-foreground">
                            {roomType ? (
                              <>
                                {roomType.name} • {nights} night{nights !== 1 ? "s" : ""} •{" "}
                                {room.guestName || "No guest"}
                              </>
                            ) : (
                              "Configure room details"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {roomType && nights > 0 && (
                          <span className="text-sm font-semibold text-primary hidden sm:block">
                            Rp {roomTotal.toLocaleString("id-ID")}
                          </span>
                        )}
                        {rooms.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeRoom(room.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                        {room.isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Room Details - Collapsible */}
                    {room.isExpanded && (
                      <CardContent className="border-t space-y-6 pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              Stay Dates
                            </h4>
                            {index === 0 && rooms.length > 1 && (
                              <Button variant="outline" size="sm" onClick={() => copyDatesToAll(room)}>
                                <Copy className="w-3 h-3 mr-1" />
                                Copy Dates to All
                              </Button>
                            )}
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`checkIn-${room.id}`}>Check-in Date</Label>
                              <Input
                                id={`checkIn-${room.id}`}
                                type="date"
                                value={room.checkInDate}
                                onChange={(e) => updateRoom(room.id, "checkInDate", e.target.value)}
                                min={format(new Date(), "yyyy-MM-dd")}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`checkOut-${room.id}`}>Check-out Date</Label>
                              <Input
                                id={`checkOut-${room.id}`}
                                type="date"
                                value={room.checkOutDate}
                                onChange={(e) => updateRoom(room.id, "checkOutDate", e.target.value)}
                                min={room.checkInDate || format(new Date(), "yyyy-MM-dd")}
                              />
                            </div>
                          </div>

                          {nights > 0 && (
                            <div className="p-3 bg-primary/5 rounded-lg">
                              <p className="text-sm font-medium">
                                <Calendar className="inline w-4 h-4 mr-1" />
                                {nights} night{nights > 1 ? "s" : ""} ({format(parseISO(room.checkInDate), "MMM dd")} -{" "}
                                {format(parseISO(room.checkOutDate), "MMM dd, yyyy")})
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Room Type Selection */}
                        <div className="space-y-2 border-t pt-6">
                          <Label htmlFor={`roomType-${room.id}`}>Room Type</Label>
                          <Select
                            value={room.roomType}
                            onValueChange={(value) => updateRoom(room.id, "roomType", value)}
                          >
                            <SelectTrigger id={`roomType-${room.id}`}>
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROOM_TYPES.map((rt) => (
                                <SelectItem key={rt.id} value={rt.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{rt.name}</span>
                                    <span className="ml-4 text-primary font-semibold">
                                      Rp {rt.price.toLocaleString("id-ID")}/night
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {room.roomType && (
                            <div className="mt-2 p-3 bg-primary/5 rounded-lg">
                              <div className="flex items-center gap-2 flex-wrap">
                                {ROOM_TYPES.find((r) => r.id === room.roomType)?.amenities.map((amenity) => (
                                  <Badge key={amenity} variant="secondary">
                                    {amenity}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Guest Information */}
                        <div className="border-t pt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <UserCircle className="w-4 h-4" />
                              Guest Information
                            </h4>
                            {index === 0 && rooms.length > 1 && (
                              <Button variant="outline" size="sm" onClick={() => copyGuestInfoToAll(room)}>
                                <Copy className="w-3 h-3 mr-1" />
                                Copy to All Rooms
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`guestName-${room.id}`}>Full Name</Label>
                            <Input
                              id={`guestName-${room.id}`}
                              value={room.guestName}
                              onChange={(e) => updateRoom(room.id, "guestName", e.target.value)}
                              placeholder="Guest full name"
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`guestEmail-${room.id}`}>Email</Label>
                              <Input
                                id={`guestEmail-${room.id}`}
                                type="email"
                                value={room.guestEmail}
                                onChange={(e) => updateRoom(room.id, "guestEmail", e.target.value)}
                                placeholder="guest@example.com"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`guestPhone-${room.id}`}>Phone</Label>
                              <Input
                                id={`guestPhone-${room.id}`}
                                type="tel"
                                value={room.guestPhone}
                                onChange={(e) => updateRoom(room.id, "guestPhone", e.target.value)}
                                placeholder="+62 812 3456 7890"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`specialRequests-${room.id}`}>Special Requests (Optional)</Label>
                            <Input
                              id={`specialRequests-${room.id}`}
                              value={room.specialRequests}
                              onChange={(e) => updateRoom(room.id, "specialRequests", e.target.value)}
                              placeholder="e.g., high floor, near elevator, smoking room"
                            />
                          </div>
                        </div>

                        {/* Room Subtotal */}
                        {roomType && nights > 0 && (
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                {roomType.name} × {nights} night{nights > 1 ? "s" : ""}
                              </span>
                              <span className="font-semibold text-primary">Rp {roomTotal.toLocaleString("id-ID")}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}

              {/* Add Room Button */}
              <Button variant="outline" onClick={addRoom} className="w-full bg-transparent" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Room
              </Button>
            </div>

            {/* Booking Summary */}
            {rooms.some((r) => r.roomType && calculateNights(r.checkInDate, r.checkOutDate) > 0) && (
              <Card className="mt-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rooms.map((room, index) => {
                    const roomType = ROOM_TYPES.find((r) => r.id === room.roomType)
                    const nights = calculateNights(room.checkInDate, room.checkOutDate)
                    if (!roomType || nights <= 0) return null

                    const roomTotal = roomType.price * nights

                    return (
                      <div
                        key={room.id}
                        className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            Room {index + 1}: {roomType.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{room.guestName || "Guest name not provided"}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(room.checkInDate), "MMM dd")} -{" "}
                            {format(parseISO(room.checkOutDate), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {nights} night{nights > 1 ? "s" : ""} × Rp {roomType.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <p className="font-semibold">Rp {roomTotal.toLocaleString("id-ID")}</p>
                      </div>
                    )
                  })}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-primary text-2xl">Rp {total.toLocaleString("id-ID")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rooms.filter((r) => r.roomType).length} room
                      {rooms.filter((r) => r.roomType).length > 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add to Cart Button */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={!isFormValid || isSubmitting}
                size="lg"
                className="w-full sm:flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding to Cart...
                  </>
                ) : (
                  <>
                    Add {rooms.filter((r) => r.roomType).length} Room
                    {rooms.filter((r) => r.roomType).length > 1 ? "s" : ""} to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
