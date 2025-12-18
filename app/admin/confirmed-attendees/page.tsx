"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { getWebinarById } from "@/lib/data/webinars"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Loader2 } from "lucide-react"

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
  const [webinarRegistrations, setWebinarRegistrations] = useState<any[]>([])

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
      await loadData()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("order_payments")
      .select(`*, orders (*, order_items (*))`)
      .eq("payment_status", "verified")
      .order("verified_at", { ascending: false })

    if (paymentsError) throw paymentsError

    const grouped: Record<string, any[]> = {}
    EVENT_OPTIONS.forEach((event) => {
      grouped[event.id] = []
    })

    const hotelList: any[] = []
    const webinarList: any[] = []

    paymentsData?.forEach((payment) => {
      const order = payment.orders
      if (!order || !order.order_items) return

      order.order_items.forEach((item: any) => {
        if (item.item_type === "event") {
          const eventId = item.event_id
          if (!grouped[eventId]) grouped[eventId] = []
          grouped[eventId].push({
            ...order,
            participant_type_label: item.participant_type_label,
            verified_at: payment.verified_at,
          })
        } else if (item.item_type === "hotel") {
          hotelList.push({ ...order, order_items: [item], verified_at: payment.verified_at })
        } else if (item.item_type === "webinar") {
          const webinarInfo = getWebinarById(item.event_id)
          webinarList.push({
            ...order,
            webinar_id: item.event_id,
            webinar_title: webinarInfo?.title || item.event_label || item.event_id,
            webinar_short_title: webinarInfo?.shortTitle || item.event_label || item.event_id,
            webinar_date: webinarInfo?.date || "",
            webinar_time: webinarInfo?.time || "",
            access_type: "purchased",
            unit_price: item.unit_price,
            verified_at: payment.verified_at,
          })
        }
      })
    })

    const { data: webinarGrantsData } = await supabase
      .from("symposium_webinar_grants")
      .select("*")
      .eq("status", "active")
      .order("granted_at", { ascending: false })

    const grantUserIds = webinarGrantsData?.map((g) => g.user_id).filter(Boolean) as string[]

    if (grantUserIds && grantUserIds.length > 0) {
      const { data: grantProfilesData } = await supabase.from("profiles").select("*").in("id", grantUserIds)
      const grantProfilesMap = new Map(grantProfilesData?.map((p) => [p.id, p]) || [])

      webinarGrantsData?.forEach((grant) => {
        const profile = grantProfilesMap.get(grant.user_id) || {}
        const webinarInfo = getWebinarById(grant.webinar_id)
        webinarList.push({
          id: grant.id,
          user_id: grant.user_id,
          full_name: (profile as any).full_name || "",
          email: (profile as any).email || "",
          phone: (profile as any).phone || "",
          institution: (profile as any).institution || "",
          webinar_id: grant.webinar_id,
          webinar_title: webinarInfo?.title || grant.webinar_id,
          webinar_short_title: webinarInfo?.shortTitle || grant.webinar_id,
          webinar_date: webinarInfo?.date || "",
          webinar_time: webinarInfo?.time || "",
          access_type: grant.grant_type || "symposium_bonus",
          unit_price: 0,
          verified_at: grant.granted_at,
          order_id: grant.order_id,
        })
      })
    }

    setAttendees(grouped)
    setHotelBookings(hotelList)
    setWebinarRegistrations(webinarList)
  }

  const exportAttendees = () => {
    const wb = XLSX.utils.book_new()
    Object.entries(attendees).forEach(([eventId, list]) => {
      if (list.length === 0) return
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
        Institution: booking.institution || "",
        "Room Type": item?.hotel_room_type || "",
        "Check-in": item?.check_in_date ? format(new Date(item.check_in_date), "MMM dd, yyyy") : "",
        "Check-out": item?.check_out_date ? format(new Date(item.check_out_date), "MMM dd, yyyy") : "",
        Nights: item?.nights || 0,
        "Total Paid": (item?.unit_price || 0) * (item?.nights || 1),
        "Verified At": booking.verified_at ? format(new Date(booking.verified_at), "MMM dd, yyyy") : "",
      }
    })
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(wb, ws, "Hotel Bookings")
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `hotel-bookings-${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportWebinarRegistrations = () => {
    const exportData = webinarRegistrations.map((reg) => ({
      "Full Name": reg.full_name || "",
      Email: reg.email || "",
      Phone: reg.phone || "",
      Institution: reg.institution || "",
      "Webinar Title": reg.webinar_short_title || reg.webinar_title || "",
      "Webinar Date": reg.webinar_date || "TBD",
      "Webinar Time": reg.webinar_time ? `${reg.webinar_time} WIB` : "TBD",
      "Access Type": reg.access_type === "purchased" ? "Purchased" : "Symposium Bonus",
      "Amount Paid": reg.unit_price ? `Rp ${reg.unit_price.toLocaleString("id-ID")}` : "Free (Bonus)",
      "Registered At": reg.verified_at ? format(new Date(reg.verified_at), "MMM dd, yyyy") : "",
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(wb, ws, "Webinar Registrations")
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `webinar-registrations-${new Date().toISOString().split("T")[0]}.xlsx`
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
      if (!session?.access_token) {
        toast.error("Not authenticated")
        return
      }
      const res = await fetch("/api/admin/sync-google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to sync")
      toast.success(
        `Synced! ${data.stats?.totalAttendees || 0} attendees, ${data.stats?.hotelBookings || 0} hotels, ${data.stats?.webinarRegistrations || 0} webinars`,
      )
    } catch (error: any) {
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
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading confirmed attendees...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const totalEventAttendees = Object.values(attendees).reduce((sum, list) => sum + list.length, 0)

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">Confirmed Attendees</h1>
                <p className="text-lg text-muted-foreground">View and export verified registrations</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportAttendees}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Export Events (.xlsx)
                </button>
                <button
                  onClick={exportHotelBookings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export Hotels (.xlsx)
                </button>
                <button
                  onClick={exportWebinarRegistrations}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Export Webinars (.xlsx)
                </button>
                <button
                  onClick={syncToGoogleSheets}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isSyncing ? "Syncing..." : "Sync to Google Sheets"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Event Attendees</p>
                <p className="text-2xl font-bold">{totalEventAttendees}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Hotel Bookings</p>
                <p className="text-2xl font-bold">{hotelBookings.length}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Webinar Registrations</p>
                <p className="text-2xl font-bold">{webinarRegistrations.length}</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Events</p>
                <p className="text-2xl font-bold">{EVENT_OPTIONS.length}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Event Attendees</h2>
              <div className="grid gap-4">
                {EVENT_OPTIONS.map((event) => {
                  const list = attendees[event.id] || []
                  return (
                    <div key={event.id} className="bg-card border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{event.label}</h3>
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {list.length} attendees
                        </span>
                      </div>
                      {list.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2">Name</th>
                                <th className="text-left py-2 px-2">Email</th>
                                <th className="text-left py-2 px-2">Institution</th>
                                <th className="text-left py-2 px-2">Type</th>
                                <th className="text-left py-2 px-2">Verified</th>
                              </tr>
                            </thead>
                            <tbody>
                              {list.slice(0, 5).map((a, i) => (
                                <tr key={i} className="border-b last:border-0">
                                  <td className="py-2 px-2">{a.full_name || "-"}</td>
                                  <td className="py-2 px-2">{a.email || "-"}</td>
                                  <td className="py-2 px-2">{a.institution || "-"}</td>
                                  <td className="py-2 px-2">{a.participant_type_label || "-"}</td>
                                  <td className="py-2 px-2">
                                    {a.verified_at ? format(new Date(a.verified_at), "MMM dd") : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {list.length > 5 && (
                            <p className="text-sm text-muted-foreground mt-2">+ {list.length - 5} more attendees</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Hotel Bookings ({hotelBookings.length})</h2>
              {hotelBookings.length > 0 && (
                <div className="bg-card border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4">Guest Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Room Type</th>
                        <th className="text-left py-3 px-4">Check-in</th>
                        <th className="text-left py-3 px-4">Check-out</th>
                        <th className="text-left py-3 px-4">Nights</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotelBookings.slice(0, 10).map((booking, i) => {
                        const item = booking.order_items[0]
                        return (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-3 px-4">{booking.full_name || "-"}</td>
                            <td className="py-3 px-4">{booking.email || "-"}</td>
                            <td className="py-3 px-4">{item?.hotel_room_type || "-"}</td>
                            <td className="py-3 px-4">
                              {item?.check_in_date ? format(new Date(item.check_in_date), "MMM dd, yyyy") : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {item?.check_out_date ? format(new Date(item.check_out_date), "MMM dd, yyyy") : "-"}
                            </td>
                            <td className="py-3 px-4">{item?.nights || "-"}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {hotelBookings.length > 10 && (
                    <p className="text-sm text-muted-foreground p-4">+ {hotelBookings.length - 10} more bookings</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Webinar Registrations ({webinarRegistrations.length})</h2>
              {webinarRegistrations.length > 0 && (
                <div className="bg-card border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Webinar</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Access Type</th>
                        <th className="text-left py-3 px-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webinarRegistrations.slice(0, 10).map((reg, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3 px-4">{reg.full_name || "-"}</td>
                          <td className="py-3 px-4">{reg.email || "-"}</td>
                          <td className="py-3 px-4">{reg.webinar_short_title || reg.webinar_title || "-"}</td>
                          <td className="py-3 px-4">{reg.webinar_date || "TBD"}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${reg.access_type === "purchased" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                            >
                              {reg.access_type === "purchased" ? "Purchased" : "Symposium Bonus"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {reg.unit_price ? `Rp ${reg.unit_price.toLocaleString("id-ID")}` : "Free"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {webinarRegistrations.length > 10 && (
                    <p className="text-sm text-muted-foreground p-4">
                      + {webinarRegistrations.length - 10} more registrations
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
