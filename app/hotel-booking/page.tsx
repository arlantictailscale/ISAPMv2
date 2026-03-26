"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { EventOverviewCard } from "@/components/event-overview-card"
import {
  Calendar,
  Loader2,
  Hotel,
  UserCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  BedDouble,
  UtensilsCrossed,
  Plus,
  AlertCircle,
  ExternalLink,
  Building2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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

const EXTRA_BED_PRICE = 550000
const MAX_EXTRA_BEDS = 2

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
  extraBeds: number
}

interface UserProfile {
  full_name: string
  phone: string
}

export default function HotelBookingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { refreshCart, user, isLoading: isCartLoading } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [availability, setAvailability] = useState<any>(null)

  const roomRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

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
      extraBeds: 0,
    },
  ])

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoadingProfile(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log("[v0] User not authenticated, skipping auto-fill")
          setIsLoadingProfile(false)
          return
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("[v0] Error loading profile:", error)
          setIsLoadingProfile(false)
          return
        }

        if (profile) {
          setUserProfile({
            full_name: profile.full_name || "",
            phone: profile.phone || "",
          })
        }

        setIsLoadingProfile(false)
      } catch (error) {
        console.error("[v0] Error in loadUserProfile:", error)
        setIsLoadingProfile(false)
      }
    }

    loadRoomAvailability() // Keep existing loadRoomAvailability call
    checkAuth() // Keep existing checkAuth call

    loadUserProfile()
  }, [supabase])

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

  // Refresh room availability periodically and when page becomes visible
  useEffect(() => {
    // Refresh every 10 seconds to ensure fresh availability data
    // Critical for preventing overselling when rooms sell out
    const interval = setInterval(() => {
      loadRoomAvailability()
    }, 10000)

    // Also refresh when the tab becomes visible again (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadRoomAvailability()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    
    // Also refresh when window regains focus (user switches windows)
    const handleFocus = () => {
      loadRoomAvailability()
    }
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  const calculateNights = (checkInDate: string, checkOutDate: string) => {
    if (!checkInDate || !checkOutDate) return 0
    const nights = differenceInDays(parseISO(checkOutDate), parseISO(checkInDate))
    return nights > 0 ? nights : 0
  }

  const addRoom = () => {
    const firstRoom = rooms[0]
    const guestName = firstRoom?.guestName || userProfile?.full_name || ""
    const guestPhone = firstRoom?.guestPhone || userProfile?.phone || ""
    const guestEmail = firstRoom?.guestEmail || ""

    const lastRoom = rooms[rooms.length - 1]
    const newRoom: RoomBooking = {
      id: `room-${Date.now()}`,
      roomType: "",
      checkInDate: lastRoom?.checkInDate || "2026-04-16",
      checkOutDate: lastRoom?.checkOutDate || "2026-04-19",
      guestName: guestName,
      guestEmail: guestEmail,
      guestPhone: guestPhone,
      specialRequests: "",
      isExpanded: true,
      extraBeds: 0,
    }

    // Collapse other rooms when adding new one
    setRooms([...rooms.map((r) => ({ ...r, isExpanded: false })), newRoom])

    setTimeout(() => {
      const newRoomElement = roomRefs.current[newRoom.id]
      if (newRoomElement) {
        newRoomElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 0)
  }

  const removeRoom = (id: string) => {
    if (rooms.length === 1) {
      toast.error("You must have at least one room")
      return
    }
    setRooms(rooms.filter((room) => room.id !== id))
  }

  const updateRoom = (id: string, field: keyof RoomBooking, value: any) => {
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

  const isRoomTypeAvailable = (roomTypeId: string) => {
    if (!availability) return true
    const avail = availability[roomTypeId as "deluxe" | "premier"]
    return avail ? avail.available > 0 : true
  }

  const getRoomAvailabilityLabel = (roomTypeId: string) => {
    if (!availability) return null
    const avail = availability[roomTypeId as "deluxe" | "premier"]
    if (!avail) return null
    if (avail.available === 0) return "Sold Out"
    if (avail.available <= 5) return `${avail.available} left`
    return null
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

      // Add validation for extra beds
      if (room.extraBeds > MAX_EXTRA_BEDS) {
        toast.error(`Room ${i + 1}: Maximum ${MAX_EXTRA_BEDS} extra beds allowed per room.`)
        return false
      }
    }

    // Check each room for sold-out status
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i]
      if (room.roomType && !isRoomTypeAvailable(room.roomType)) {
        const roomName = ROOM_TYPES.find((r) => r.id === room.roomType)?.name || room.roomType
        toast.error(`${roomName} is fully booked`, {
          description: "This room type is no longer available. Please select a different room type.",
        })
        return false
      }
    }

    // Check availability totals
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
      const roomCost = (roomType?.price || 0) * nights
      const extraBedCost = room.extraBeds * EXTRA_BED_PRICE * nights
      return total + roomCost + extraBedCost
    }, 0)
  }

  const calculateRoomTotal = (room: RoomBooking) => {
    const roomType = ROOM_TYPES.find((r) => r.id === room.roomType)
    const nights = calculateNights(room.checkInDate, room.checkOutDate)
    const roomCost = (roomType?.price || 0) * nights
    const extraBedCost = room.extraBeds * EXTRA_BED_PRICE * nights
    return { roomCost, extraBedCost, total: roomCost + extraBedCost, nights }
  }

  const handleAddToCart = async () => {
    if (!validateBooking()) return

    setIsSubmitting(true)

    try {
      // Fetch fresh availability data before submitting to prevent race conditions
      const freshAvailability = await getRoomAvailability()
      setAvailability(freshAvailability)

      // Re-validate with fresh data
      const deluxeCount = rooms.filter((r) => r.roomType === "deluxe").length
      const premierCount = rooms.filter((r) => r.roomType === "premier").length

      if (freshAvailability) {
        if (freshAvailability.deluxe.available <= 0 && deluxeCount > 0) {
          toast.error("Deluxe rooms are now fully booked", {
            description: "Please select a different room type or try again later.",
          })
          setIsSubmitting(false)
          return
        }
        if (freshAvailability.premier.available <= 0 && premierCount > 0) {
          toast.error("Premier rooms are now fully booked", {
            description: "Please select a different room type or try again later.",
          })
          setIsSubmitting(false)
          return
        }
        if (deluxeCount > freshAvailability.deluxe.available) {
          toast.error(`Only ${freshAvailability.deluxe.available} Deluxe room(s) available`, {
            description: "Please reduce the number of Deluxe rooms in your booking.",
          })
          setIsSubmitting(false)
          return
        }
        if (premierCount > freshAvailability.premier.available) {
          toast.error(`Only ${freshAvailability.premier.available} Premier room(s) available`, {
            description: "Please reduce the number of Premier rooms in your booking.",
          })
          setIsSubmitting(false)
          return
        }
      }

      for (let i = 0; i < rooms.length; i++) {
        const room = rooms[i]
        const roomType = ROOM_TYPES.find((r) => r.id === room.roomType)
        if (!roomType) continue

        const nights = calculateNights(room.checkInDate, room.checkOutDate)
        const unitPricePerNight = roomType.price + room.extraBeds * EXTRA_BED_PRICE

        const extraBedLabel = room.extraBeds > 0 ? ` + ${room.extraBeds} extra bed(s)` : ""

        const result = await addToCart({
          item_type: "hotel",
          event_label: `Room ${i + 1}: ${roomType.name}${extraBedLabel} - ${nights} night(s) - ${room.guestName}`,
          hotel_room_type: room.roomType,
          check_in_date: room.checkInDate,
          check_out_date: room.checkOutDate,
          nights: nights,
          extra_beds: room.extraBeds,
          unit_price: unitPricePerNight,
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
          extraBeds: 0,
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

  // Check if ALL promotional rooms are sold out
  const isAllSoldOut = availability && 
    availability.deluxe.available <= 0 && 
    availability.premier.available <= 0

  // Show sold out page when all promotional rates are exhausted
  if (isAllSoldOut) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background pt-16 pb-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Sold Out Notice */}
            <Card className="mt-8 border-amber-200 bg-white shadow-lg">
              <CardContent className="pt-8 pb-10 px-6 sm:px-10">
                <div className="text-center space-y-6">
                  {/* Icon */}
                  <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                    <Hotel className="w-10 h-10 text-amber-600" />
                  </div>
                  
                  {/* Title */}
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                      Promotional Rate Sold Out
                    </h1>
                    <p className="text-amber-600 font-medium text-lg">
                      ISAPM 2026 Special Hotel Package
                    </p>
                  </div>
                  
                  {/* Message */}
                  <div className="max-w-lg mx-auto space-y-4 text-slate-600">
                    <p className="text-base leading-relaxed">
                      We apologize, but the special promotional rates for hotel accommodation 
                      through our website have been fully booked. Thank you for your overwhelming 
                      interest in the ISAPM 8th National Meeting 2026!
                    </p>
                    <p className="text-sm text-slate-500">
                      You can still book directly with the hotel or through online travel platforms 
                      at regular rates.
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-200 pt-6">
                    <p className="text-sm font-medium text-slate-700 mb-4">
                      Alternative Booking Options
                    </p>
                    
                    {/* Hotel Official Website - Primary */}
                    <a
                      href="https://www.thesinghasari.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors mb-4 max-w-sm mx-auto"
                    >
                      <Building2 className="w-5 h-5" />
                      Hotel Official Website
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    
                    <p className="text-xs text-slate-500 mb-3">Or book through these platforms:</p>
                    
                    {/* OTA Options Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                      {/* Traveloka */}
                      <a
                        href="https://www.traveloka.com/en-id/hotel/detail?spec=09-04-2026.10-04-2026.1.1.HOTEL.3000010000303.The%20Singhasari%20Resort%20Batu.2&loginPromo=1&prevSearchId=1860731724614365329&priceDisplay=NIGHTNOTAX&iuid=d185076a-ca27-4b31-a1f2-7509eef6a831"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group"
                      >
                        <img 
                          src="https://d1785e74lyxkqq.cloudfront.net/_next/static/v2/9/97f3e7a54e9c6987283b78e016664776.svg" 
                          alt="Traveloka" 
                          className="h-5 object-contain"
                        />
                        <span className="text-xs text-slate-500 group-hover:text-blue-600">Traveloka</span>
                      </a>
                      
                      {/* Tiket.com */}
                      <a
                        href="https://www.tiket.com/id-id/hotel/indonesia/the-singhasari-resort-batu-412001639950331681"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group"
                      >
                        <img 
                          src="https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/original/core-ina/2023/11/15/c36b23ef-ac3f-44c2-8c0c-5e84c0a32f9e-1700019959330-d43ba6be5d9cba4f84c4a4db85f78a1f.png" 
                          alt="Tiket.com" 
                          className="h-5 object-contain"
                        />
                        <span className="text-xs text-slate-500 group-hover:text-blue-600">Tiket.com</span>
                      </a>
                      
                      {/* Agoda */}
                      <a
                        href="https://www.agoda.com/the-singhasari-resort/hotel/malang-id.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-300 transition-colors group"
                      >
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Agoda_transparent_logo.png" 
                          alt="Agoda" 
                          className="h-5 object-contain"
                        />
                        <span className="text-xs text-slate-500 group-hover:text-red-600">Agoda</span>
                      </a>
                      
                      {/* Booking.com */}
                      <a
                        href="https://www.booking.com/hotel/id/the-singhasari-resort-batu.en-gb.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group"
                      >
                        <img 
                          src="https://cf.bstatic.com/static/img/favicon/9f92ee64ab887057f3dabbe4a26cd9e9e8c4e7a9.svg" 
                          alt="Booking.com" 
                          className="h-5 object-contain"
                        />
                        <span className="text-xs text-slate-500 group-hover:text-blue-600">Booking.com</span>
                      </a>
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="bg-slate-50 rounded-xl p-5 text-left max-w-md mx-auto">
                    <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Hotel className="w-4 h-4 text-teal-600" />
                      The Singhasari Hotel & Convention
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary" className="bg-white">Event Venue</Badge>
                      <Badge variant="secondary" className="bg-white">April 16-19, 2026</Badge>
                    </div>
                  </div>

                  {/* Contact Support */}
                  <div className="pt-4">
                    <p className="text-sm text-slate-500 mb-2">
                      Need assistance with your registration?
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open("https://wa.me/6289602626709", "_blank")}
                      className="gap-2"
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Availability Status */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Current Availability Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Deluxe Room (Promotional)</span>
                    <Badge variant="destructive">Sold Out</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600">Premier Room (Promotional)</span>
                    <Badge variant="destructive">Sold Out</Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  Last updated: {new Date().toLocaleString("en-US", { 
                    dateStyle: "medium", 
                    timeStyle: "short" 
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const total = calculateTotal()
  const hasSoldOutRoom = rooms.some((r) => r.roomType && !isRoomTypeAvailable(r.roomType))
  const isFormValid = !hasSoldOutRoom && rooms.every((r) => {
    const nights = calculateNights(r.checkInDate, r.checkOutDate)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValidEmail = r.guestEmail && emailRegex.test(r.guestEmail)
    return r.roomType && r.guestName && isValidEmail && r.guestPhone && nights > 0
  })

  // Updated UI to match the new structure
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-muted/30 pt-16 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Title and Description */}
          <div className="mb-12 space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold">Hotel Accommodation</h1>
            <p className="text-base font-medium text-muted-foreground">ISAPM 8th National Meeting 2026</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Reserve your accommodation at our exclusive event venue. Book multiple rooms with flexible dates - each
              room can have its own check-in and check-out dates.
            </p>
          </div>

          {/* Rest of Content */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {rooms.map((room, index) => (
                  <Card
                    key={room.id}
                    ref={(el) => {
                      if (el) roomRefs.current[room.id] = el
                    }}
                  >
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRoomExpanded(room.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hotel className="w-5 h-5 text-primary" />
                          <CardTitle>Room {index + 1}</CardTitle>
                        </div>
                        <div className="text-sm text-muted-foreground flex gap-2">
                          {room.roomType ? (
                            <>
                              <span className="hidden sm:inline">
                                {ROOM_TYPES.find((rt) => rt.id === room.roomType)?.name}
                              </span>
                              {room.extraBeds > 0 && `+${room.extraBeds} Extra Bed`}
                              {" • "}
                            </>
                          ) : (
                            "Configure room details"
                          )}
                          {room.checkInDate} - {room.checkOutDate}
                          {room.guestName && ` • ${room.guestName}`}
                        </div>
                        <div className="flex items-center gap-2">
                          {room.isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {room.isExpanded && (
                      <CardContent className="space-y-6 pt-0">
                        {/* Room Type Selection */}
                        <div className="space-y-2">
                          <Label htmlFor={`roomType-${room.id}`}>Room Type *</Label>
                          <Select
                            value={room.roomType}
                            onValueChange={(value) => updateRoom(room.id, "roomType", value)}
                          >
                            <SelectTrigger id={`roomType-${room.id}`}>
                              <SelectValue placeholder="Select room type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROOM_TYPES.map((rt) => {
                                const available = isRoomTypeAvailable(rt.id)
                                const label = getRoomAvailabilityLabel(rt.id)
                                return (
                                  <SelectItem key={rt.id} value={rt.id} disabled={!available}>
                                    <span className="flex items-center justify-between w-full gap-4">
                                      <span className={`pointer-events-auto ${!available ? "text-muted-foreground" : ""}`}>
                                        {rt.name}
                                        {label && (
                                          <span className={`ml-2 text-xs font-semibold ${label === "Sold Out" ? "text-destructive" : "text-amber-600"}`}>
                                            ({label})
                                          </span>
                                        )}
                                      </span>
                                      {available && (
                                        <span className="text-primary font-semibold pointer-events-auto whitespace-nowrap">
                                          Rp {rt.price.toLocaleString("id-ID")}/night
                                        </span>
                                      )}
                                    </span>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>

                          {room.roomType && !isRoomTypeAvailable(room.roomType) && (
                            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                              <span className="text-destructive text-sm font-medium">
                                This room type is fully booked and cannot be reserved.
                              </span>
                            </div>
                          )}

                          {room.roomType && isRoomTypeAvailable(room.roomType) && (
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

                        {/* Stay Dates */}
                        <div className="space-y-4">
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

                          {calculateNights(room.checkInDate, room.checkOutDate) > 0 && (
                            <div className="p-3 bg-primary/5 rounded-lg">
                              <p className="text-sm font-medium">
                                <Calendar className="inline w-4 h-4 mr-1" />
                                {calculateNights(room.checkInDate, room.checkOutDate)} night
                                {calculateNights(room.checkInDate, room.checkOutDate) > 1 ? "s" : ""} (
                                {format(parseISO(room.checkInDate), "MMM dd")} -{" "}
                                {format(parseISO(room.checkOutDate), "MMM dd, yyyy")})
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Extra Bed Option */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold flex items-center gap-2">
                              <BedDouble className="w-4 h-4 text-primary" />
                              Extra Bed (Optional)
                            </h4>
                          </div>

                          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">Add Extra Bed</p>
                                <p className="text-sm text-muted-foreground">
                                  Rp {EXTRA_BED_PRICE.toLocaleString("id-ID")}/night per bed
                                </p>
                                <div className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-400">
                                  <UtensilsCrossed className="w-3 h-3" />
                                  <span>Includes breakfast for extra guest</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateRoom(room.id, "extraBeds", Math.max(0, room.extraBeds - 1))}
                                  disabled={room.extraBeds === 0}
                                  className="h-10 w-10"
                                >
                                  -
                                </Button>
                                <span className="w-12 text-center font-semibold text-lg">{room.extraBeds}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    updateRoom(room.id, "extraBeds", Math.min(MAX_EXTRA_BEDS, room.extraBeds + 1))
                                  }
                                  disabled={room.extraBeds >= MAX_EXTRA_BEDS}
                                  className="h-10 w-10"
                                >
                                  +
                                </Button>
                              </div>
                            </div>

                            {room.extraBeds > 0 && calculateNights(room.checkInDate, room.checkOutDate) > 0 && (
                              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {room.extraBeds} extra bed{room.extraBeds > 1 ? "s" : ""} ×{" "}
                                    {calculateNights(room.checkInDate, room.checkOutDate)} night
                                    {calculateNights(room.checkInDate, room.checkOutDate) > 1 ? "s" : ""} × Rp{" "}
                                    {EXTRA_BED_PRICE.toLocaleString("id-ID")}
                                  </span>
                                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                                    + Rp{" "}
                                    {(
                                      room.extraBeds *
                                      EXTRA_BED_PRICE *
                                      calculateNights(room.checkInDate, room.checkOutDate)
                                    ).toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
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
                            <Label htmlFor={`guestName-${room.id}`}>Full Name *</Label>
                            <Input
                              id={`guestName-${room.id}`}
                              value={room.guestName}
                              onChange={(e) => updateRoom(room.id, "guestName", e.target.value)}
                              placeholder="Guest full name"
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`guestEmail-${room.id}`}>Email *</Label>
                              <Input
                                id={`guestEmail-${room.id}`}
                                type="email"
                                value={room.guestEmail}
                                onChange={(e) => updateRoom(room.id, "guestEmail", e.target.value)}
                                placeholder="guest@example.com"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`guestPhone-${room.id}`}>Phone *</Label>
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

                        {room.roomType && calculateNights(room.checkInDate, room.checkOutDate) > 0 && (
                          <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">
                                {ROOM_TYPES.find((rt) => rt.id === room.roomType)?.name} ×{" "}
                                {calculateNights(room.checkInDate, room.checkOutDate)} night
                                {calculateNights(room.checkInDate, room.checkOutDate) > 1 ? "s" : ""}
                              </span>
                              <span className="font-medium">
                                Rp{" "}
                                {(
                                  ROOM_TYPES.find((rt) => rt.id === room.roomType)?.price *
                                  calculateNights(room.checkInDate, room.checkOutDate)
                                ).toLocaleString("id-ID")}
                              </span>
                            </div>
                            {room.extraBeds > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  Extra bed ({room.extraBeds}) × {calculateNights(room.checkInDate, room.checkOutDate)}{" "}
                                  night{calculateNights(room.checkInDate, room.checkOutDate) > 1 ? "s" : ""}
                                </span>
                                <span className="font-medium text-amber-600">
                                  + Rp{" "}
                                  {(
                                    room.extraBeds *
                                    EXTRA_BED_PRICE *
                                    calculateNights(room.checkInDate, room.checkOutDate)
                                  ).toLocaleString("id-ID")}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="font-semibold">Room Subtotal</span>
                              <span className="font-semibold text-primary">
                                Rp {calculateRoomTotal(room).total.toLocaleString("id-ID")}
                              </span>
                            </div>
                          </div>
                        )}

                        {rooms.length > 1 && (
                          <Button variant="destructive" className="w-full" onClick={() => removeRoom(room.id)}>
                            Remove Room
                          </Button>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
                {/* Add Another Room Button */}
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 bg-transparent"
                  onClick={addRoom}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Room
                </Button>
              </div>
            </div>

            {/* Sidebar - Right Column (Takes 1 col on desktop) */}
            <div className="lg:col-span-1 order-2 lg:order-none">
              <div className="sticky top-24 space-y-6">
                <EventOverviewCard availability={availability} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Summary Section - Full Width */}
      {rooms.some((r) => r.roomType && calculateNights(r.checkInDate, r.checkOutDate) > 0) && (
        <section className="py-12 px-4 bg-background">
          <div className="max-w-5xl mx-auto">
            <Card className="mt-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rooms.map((room, index) => {
                  const roomType = ROOM_TYPES.find((r) => r.id === room.roomType)
                  const nights = calculateNights(room.checkInDate, room.checkOutDate)
                  if (!roomType || nights <= 0) return null

                  const { roomCost, extraBedCost, total: roomTotal } = calculateRoomTotal(room)

                  return (
                    <div
                      key={room.id}
                      className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          Room {index + 1}: {roomType.name}
                          {room.extraBeds > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              +{room.extraBeds} extra bed
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{room.guestName || "Guest name not provided"}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(room.checkInDate), "MMM dd")} -{" "}
                          {format(parseISO(room.checkOutDate), "MMM dd, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {nights} night{nights > 1 ? "s" : ""} × Rp {roomType.price.toLocaleString("id-ID")}
                        </p>
                        {room.extraBeds > 0 && (
                          <p className="text-sm text-amber-600 flex items-center gap-1">
                            <BedDouble className="w-3 h-3" />
                            {room.extraBeds} extra bed{room.extraBeds > 1 ? "s" : ""} × {nights} night
                            {nights > 1 ? "s" : ""} × Rp {EXTRA_BED_PRICE.toLocaleString("id-ID")}
                            <span className="text-muted-foreground ml-1">(incl. breakfast)</span>
                          </p>
                        )}
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
                    {rooms.some((r) => r.extraBeds > 0) && (
                      <span className="text-amber-600">
                        {" "}
                        + {rooms.reduce((sum, r) => sum + r.extraBeds, 0)} extra bed
                        {rooms.reduce((sum, r) => sum + r.extraBeds, 0) > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

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
                ) : hasSoldOutRoom ? (
                  <>Room Unavailable - Fully Booked</>
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
      )}

      <Footer />
    </>
  )
}
