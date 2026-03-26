import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RoomAvailabilityForm } from "./room-availability-form"
import { Hotel } from "lucide-react"
import Navigation from "@/components/navigation"

export default async function RoomAvailabilityPage() {
  const supabase = await createClient()

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  // Fetch current room availability settings
  const { data: settings } = await supabase.from("room_availability_settings").select("*").order("room_type")

  const deluxeSetting = settings?.find((s) => s.room_type === "deluxe")
  const premierSetting = settings?.find((s) => s.room_type === "premier")

  // Get all hotel bookings with their payment status
  const { data: bookings } = await supabase
    .from("order_items")
    .select(`
      hotel_room_type, 
      orders!inner(
        status,
        order_payments(payment_status)
      )
    `)
    .in("hotel_room_type", ["deluxe", "premier"])
    .not("hotel_room_type", "is", null)
    .neq("orders.status", "cancelled")

  // Count total bookings (verified + pending) for each room type
  const deluxeBookings = bookings?.filter((b) => b.hotel_room_type === "deluxe") || []
  const premierBookings = bookings?.filter((b) => b.hotel_room_type === "premier") || []

  // Helper to check payment status
  const getPaymentStatus = (booking: any) => {
    const payment = booking.orders?.order_payments?.[0]
    return payment?.payment_status || "no_payment"
  }

  // Count verified and pending separately for display
  const deluxeVerified = deluxeBookings.filter((b) => getPaymentStatus(b) === "verified").length
  const deluxePending = deluxeBookings.filter((b) => getPaymentStatus(b) === "pending").length
  const deluxeBooked = deluxeVerified + deluxePending

  const premierVerified = premierBookings.filter((b) => getPaymentStatus(b) === "verified").length
  const premierPending = premierBookings.filter((b) => getPaymentStatus(b) === "pending").length
  const premierBooked = premierVerified + premierPending

  return (
    <>
      <Navigation />
      <main className="pt-24 lg:pt-20 pb-20">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Hotel className="w-8 h-8 text-cyan-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Room Availability Management</h1>
                <p className="text-slate-600 mt-1">Set default room capacity for hotel bookings</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-cyan-600">Deluxe Room Status</CardTitle>
                  <CardDescription>Current availability overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Capacity:</span>
                    <span className="text-2xl font-bold text-cyan-600">{deluxeSetting?.default_capacity || 120}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Currently Booked:</span>
                    <span className="text-2xl font-bold text-slate-700">{deluxeBooked}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pl-4">
                    <span className="text-muted-foreground">- Confirmed:</span>
                    <span className="font-medium text-green-600">{deluxeVerified}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pl-4">
                    <span className="text-muted-foreground">- Pending Payment:</span>
                    <span className="font-medium text-amber-600">{deluxePending}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm font-medium">Available Rooms:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.max(0, (deluxeSetting?.default_capacity || 120) - deluxeBooked)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-cyan-600">Premier Room Status</CardTitle>
                  <CardDescription>Current availability overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Capacity:</span>
                    <span className="text-2xl font-bold text-cyan-600">{premierSetting?.default_capacity || 56}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Currently Booked:</span>
                    <span className="text-2xl font-bold text-slate-700">{premierBooked}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pl-4">
                    <span className="text-muted-foreground">- Confirmed:</span>
                    <span className="font-medium text-green-600">{premierVerified}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pl-4">
                    <span className="text-muted-foreground">- Pending Payment:</span>
                    <span className="font-medium text-amber-600">{premierPending}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm font-medium">Available Rooms:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {Math.max(0, (premierSetting?.default_capacity || 56) - premierBooked)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Update Default Capacity</CardTitle>
                <CardDescription>
                  Set the maximum number of rooms available for booking. Changes will reflect immediately on the venue
                  page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RoomAvailabilityForm
                  deluxeCapacity={deluxeSetting?.default_capacity || 120}
                  premierCapacity={premierSetting?.default_capacity || 56}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
