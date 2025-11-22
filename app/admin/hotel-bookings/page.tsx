"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Hotel, FileDown } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

export default function AdminHotelBookingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    checkAuthAndLoadBookings()
  }, [])

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredBookings(bookings)
    } else {
      setFilteredBookings(bookings.filter((b) => b.status === statusFilter))
    }
  }, [statusFilter, bookings])

  const checkAuthAndLoadBookings = async () => {
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

      await loadBookings()
    } catch (error: any) {
      console.error("[v0] Error:", error)
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items!inner (*)
      `)
      .eq("order_items.item_type", "hotel")
      .order("created_at", { ascending: false })

    console.log("[v0] Hotel bookings loaded:", data?.length)
    if (error) {
      console.error("[v0] Error loading bookings:", error)
      throw error
    }
    setBookings(data || [])
  }

  const handleApprove = async (orderId: string) => {
    try {
      setIsProcessing(true)
      const { error } = await supabase.from("orders").update({ status: "paid" }).eq("id", orderId)

      if (error) throw error

      toast.success("Booking approved successfully")
      await loadBookings()
      setSelectedBooking(null)
    } catch (error: any) {
      console.error("[v0] Error approving:", error)
      toast.error("Failed to approve booking")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (orderId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    try {
      setIsProcessing(true)
      const { error } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          rejection_reason: rejectionReason,
        })
        .eq("id", orderId)

      if (error) throw error

      toast.success("Booking rejected")
      await loadBookings()
      setSelectedBooking(null)
      setRejectionReason("")
    } catch (error: any) {
      console.error("[v0] Error rejecting:", error)
      toast.error("Failed to reject booking")
    } finally {
      setIsProcessing(false)
    }
  }

  const exportToExcel = () => {
    const exportData = filteredBookings.map((booking) => {
      const item = booking.order_items[0]
      return {
        "Order ID": booking.id,
        "Guest Name": booking.full_name || "",
        Email: booking.email || "",
        Phone: booking.phone || "",
        Position: booking.position || "",
        Institution: booking.institution || "",
        "Room Type": item?.hotel_room_type || "",
        "Check-in": item?.check_in_date || "",
        "Check-out": item?.check_out_date || "",
        Nights: item?.nights || 0,
        "Total Amount": booking.total_amount,
        Status: booking.status,
        "Booked At": new Date(booking.created_at).toLocaleString("id-ID"),
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Hotel Bookings")
    XLSX.writeFile(wb, `hotel-bookings-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any }> = {
      pending: { label: "Pending", variant: "default" },
      paid: { label: "Verified", variant: "default" },
      cancelled: { label: "Rejected", variant: "destructive" },
    }
    const c = config[status] || config.pending
    return <Badge variant={c.variant}>{c.label}</Badge>
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
      <main className="pt-24 pb-20 min-h-screen">
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-4xl font-bold mb-2">Hotel Booking Management</h1>
                <p className="text-muted-foreground">Review and approve hotel bookings</p>
              </div>
              <Button onClick={exportToExcel} variant="outline">
                <FileDown className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {["all", "pending", "paid", "cancelled"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status === "paid" ? "VERIFIED" : status.toUpperCase()}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Hotel className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hotel bookings found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => {
                  const item = booking.order_items[0]
                  return (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Hotel className="w-5 h-5" />
                              {booking.full_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              The Singhasari Resort - {item?.hotel_room_type}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3 mb-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Contact</p>
                            <p className="font-medium">{booking.email}</p>
                            <p className="font-medium">{booking.phone}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Stay Details</p>
                            <p>
                              Check-in:{" "}
                              {item?.check_in_date && new Date(item.check_in_date).toLocaleDateString("id-ID")}
                            </p>
                            <p>
                              Check-out:{" "}
                              {item?.check_out_date && new Date(item.check_out_date).toLocaleDateString("id-ID")}
                            </p>
                            <p>Nights: {item?.nights}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Payment</p>
                            <p className="font-bold text-lg">Rp {booking.total_amount.toLocaleString("id-ID")}</p>
                            <p className="text-xs">
                              Booked: {new Date(booking.created_at).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => setSelectedBooking(booking)} variant="outline" className="w-full">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>View booking details and payment information</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Guest Information</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{selectedBooking.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selectedBooking.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{selectedBooking.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span>{selectedBooking.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Institution:</span>
                    <span>{selectedBooking.institution}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 Payment approval and rejection is handled in the <strong>Payment Validation</strong> page
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
