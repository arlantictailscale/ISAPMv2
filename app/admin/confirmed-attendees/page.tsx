"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, FileDown, Users, Hotel, Calendar, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { format } from "date-fns"

// Copied from pricing page to ensure consistency in event labeling
const EVENT_OPTIONS = [
  { id: "cpd", label: "CPD (Continuing Professional Development) Courses" },
  { id: "ws1", label: "WS 1 (Regenerative Pain Therapy)" },
  { id: "ws2", label: "WS 2 (Basic Interventional Pain Management)" },
  { id: "ws3", label: "WS 3 (Pediatric Essential Pain Management)" },
  { id: "ws4", label: "WS 4 (Adjunct Therapy for Pain Management)" },
  { id: "ws5", label: "WS 5 (Developing a Pain Clinic)" },
  { id: "ws6", label: "WS 6 (Cancer Pain)" },
  { id: "ws7", label: "WS 7 (Advanced Intervention of Pain Management)" },
  { id: "symposium", label: "Symposium" },
]

export default function ConfirmedAttendeesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [attendees, setAttendees] = useState<Record<string, any[]>>({})
  const [hotelBookings, setHotelBookings] = useState<any[]>([])

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (profile?.role !== "admin") {
        toast.error("Unauthorized access")
        router.push("/dashboard")
        return
      }

      // Load all data in one go
      await loadData()
    } catch (error: any) {
      console.error("[v0] Error:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    console.log("[v0] Loading confirmed data...")
    // Fetch verified payments from order_payments instead of orders status to ensure we get verified data
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("order_payments")
      .select(`
        *,
        orders (
          *,
          order_items (*)
        )
      `)
      .eq("payment_status", "verified")
      .order("verified_at", { ascending: false })

    if (paymentsError) {
      console.error("[v0] Error loading payments:", paymentsError)
      throw paymentsError
    }

    console.log("[v0] Found verified payments:", paymentsData?.length || 0)

    // Process Event Attendees
    const grouped: Record<string, any[]> = {}
    EVENT_OPTIONS.forEach((event) => {
      grouped[event.id] = []
    })

    // Process Hotel Bookings
    const hotelList: any[] = []

    // Iterate through payments instead of orders
    paymentsData?.forEach((payment) => {
      const order = payment.orders
      // @ts-ignore - Supabase types can be tricky with joins
      if (!order || !order.order_items) return

      // @ts-ignore
      order.order_items.forEach((item: any) => {
        if (item.item_type === "event") {
          const eventId = item.event_id
          // Normalize event ID matching to handle potential inconsistencies
          const matchedEventId = Object.keys(grouped).find((id) => id === eventId) || eventId

          if (!grouped[matchedEventId]) {
            grouped[matchedEventId] = []
          }

          grouped[matchedEventId].push({
            ...order,
            // Add item specific details if needed
            participant_type_label: item.participant_type_label,
            // Add payment date
            verified_at: payment.verified_at,
          })
        } else if (item.item_type === "hotel") {
          // Create a structure that matches the expected format for hotel bookings
          hotelList.push({
            ...order,
            // Use the specific hotel item for this row in the display
            order_items: [item],
            // Add payment date
            verified_at: payment.verified_at,
          })
        }
      })
    })

    setAttendees(grouped)
    setHotelBookings(hotelList)
  }

  const exportAttendees = () => {
    const wb = XLSX.utils.book_new()

    Object.entries(attendees).forEach(([eventId, list]) => {
      if (list.length === 0) return
      const eventLabel = EVENT_OPTIONS.find((e) => e.id === eventId)?.label || eventId
      // Sheet names limited to 31 chars
      const sheetName = eventId.toUpperCase().substring(0, 31)

      const wsData = list.map((a) => ({
        "Full Name": a.full_name,
        Email: a.email,
        Phone: a.phone,
        Institution: a.institution,
        Position: a.position,
        "Participant Type": a.participant_type_label,
        "Verified At": a.verified_at ? format(new Date(a.verified_at), "MMM dd, yyyy") : "",
      }))

      const ws = XLSX.utils.json_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    // Create a blob and trigger download in browser
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `confirmed-attendees-${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportHotelBookings = () => {
    const exportData = hotelBookings.map((booking) => {
      const item = booking.order_items[0]
      return {
        "Order ID": booking.id,
        "Guest Name": booking.full_name || "",
        Email: booking.email || "",
        Phone: booking.phone || "",
        "Room Type": item?.hotel_room_type || "",
        "Check-in": item?.check_in_date ? format(new Date(item.check_in_date), "MMM dd, yyyy") : "",
        "Check-out": item?.check_out_date ? format(new Date(item.check_out_date), "MMM dd, yyyy") : "",
        Nights: item?.nights || 0,
        "Verified At": booking.verified_at ? format(new Date(booking.verified_at), "MMM dd, yyyy") : "",
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Hotel Bookings")

    // Create a blob and trigger download in browser
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `confirmed-hotel-bookings-${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const syncToGoogleSheets = async () => {
    setIsSyncing(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error("Not authenticated")
        return
      }

      const response = await fetch("/api/admin/sync-google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync")
      }

      toast.success(
        `Successfully synced! ${data.stats.totalAttendees} attendees and ${data.stats.hotelBookings} hotel bookings.`,
      )
    } catch (error: any) {
      console.error("[v0] Sync error:", error)
      toast.error(error.message || "Failed to sync to Google Sheets")
    } finally {
      setIsSyncing(false)
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

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-slate-50/50 dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-slate-50">
                Confirmed Attendees & Bookings
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                View verified attendees for events and hotel reservations.
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
                  Auto-syncs hourly
                </span>
              </p>
            </div>
            <Button onClick={syncToGoogleSheets} disabled={isSyncing} size="lg" className="gap-2">
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="events" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Event Attendees
              </TabsTrigger>
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                Hotel Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-6">
              <div className="flex justify-end mb-4">
                <Button onClick={exportAttendees} variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export All Events to Excel
                </Button>
              </div>

              <div className="grid gap-6">
                {EVENT_OPTIONS.map((event) => {
                  const list = attendees[event.id] || []
                  return (
                    <Card key={event.id} className="overflow-hidden">
                      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              {event.label}
                            </CardTitle>
                            <CardDescription>
                              {list.length} confirmed attendee{list.length !== 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {list.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">No confirmed attendees yet.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Phone</TableHead>
                                  <TableHead>Institution</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Verified At</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {list.map((attendee, idx) => (
                                  <TableRow key={`${event.id}-${attendee.id}-${idx}`}>
                                    <TableCell className="font-medium">{attendee.full_name}</TableCell>
                                    <TableCell>{attendee.email}</TableCell>
                                    <TableCell>{attendee.phone}</TableCell>
                                    <TableCell>{attendee.institution}</TableCell>
                                    <TableCell>
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                        {attendee.participant_type_label}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {attendee.verified_at
                                        ? format(new Date(attendee.verified_at), "MMM dd, yyyy")
                                        : ""}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="hotels" className="space-y-6">
              <div className="flex justify-end mb-4">
                <Button onClick={exportHotelBookings} variant="outline" size="sm">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export Bookings to Excel
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Confirmed Hotel Reservations</CardTitle>
                  <CardDescription>List of guests with fully paid and verified hotel bookings.</CardDescription>
                </CardHeader>
                <CardContent>
                  {hotelBookings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                      <Hotel className="w-12 h-12 mb-4 opacity-20" />
                      <p>No confirmed hotel bookings found.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Guest Name</TableHead>
                            <TableHead>Room Type</TableHead>
                            <TableHead>Check-in</TableHead>
                            <TableHead>Check-out</TableHead>
                            <TableHead>Nights</TableHead>
                            <TableHead className="text-right">Total Paid</TableHead>
                            <TableHead className="text-right">Verified At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hotelBookings.map((booking) => {
                            const item = booking.order_items[0]
                            return (
                              <TableRow key={booking.id}>
                                <TableCell className="font-medium">
                                  <div>{booking.full_name}</div>
                                  <div className="text-xs text-muted-foreground">{booking.email}</div>
                                </TableCell>
                                <TableCell>{item?.hotel_room_type}</TableCell>
                                <TableCell>
                                  {item?.check_in_date && format(new Date(item.check_in_date), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell>
                                  {item?.check_out_date && format(new Date(item.check_out_date), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell>{item?.nights}</TableCell>
                                <TableCell className="text-right font-medium">
                                  Rp {booking.total_amount.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {booking.verified_at ? format(new Date(booking.verified_at), "MMM dd, yyyy") : ""}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  )
}
