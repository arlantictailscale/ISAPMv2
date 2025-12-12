"use client"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, GraduationCap, Wrench, Users } from "lucide-react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import Link from "next/link"
import { MyEventsSearch } from "@/components/my-events-search"

// Fallback event details (used if database has no data)
const fallbackEventDetails: Record<
  string,
  {
    title: string
    shortTitle: string
    date: string
    time: string
    location: string
    venue: string
    room: string
    type: "cpd" | "workshop" | "symposium"
    description: string
  }
> = {
  cpd: {
    title: "CPD (Continuing Professional Development) Courses",
    shortTitle: "CPD Courses",
    date: "April 16-17, 2026",
    time: "08:00 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "cpd",
    description: "Comprehensive 2-day continuing professional development program.",
  },
  ws1: {
    title: "Workshop 1: Regenerative Pain Therapy",
    shortTitle: "Regenerative Pain Therapy",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "workshop",
    description: "Hands-on workshop on regenerative pain therapy.",
  },
  ws2: {
    title: "Workshop 2: Basic Interventional Pain Management",
    shortTitle: "Basic Interventional Pain",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "workshop",
    description: "Foundational workshop on musculoskeletal procedures.",
  },
  ws3: {
    title: "Workshop 3: Pediatric Essential Pain Management",
    shortTitle: "Pediatric Pain Management",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "workshop",
    description: "Specialized workshop on pediatric pain management.",
  },
  ws4: {
    title: "Workshop 4: Adjunct Therapy for Pain Management",
    shortTitle: "Adjunct Therapy",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "workshop",
    description: "Workshop on complementary pain therapies.",
  },
  ws5: {
    title: "Workshop 5: Developing a Pain Clinic",
    shortTitle: "Developing a Pain Clinic",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "workshop",
    description: "Team-based workshop on establishing pain clinics.",
  },
  ws6: {
    title: "Workshop 6: Cancer Pain",
    shortTitle: "Cancer Pain",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "workshop",
    description: "Comprehensive workshop on cancer pain management.",
  },
  ws7: {
    title: "Workshop 7: Advanced Intervention",
    shortTitle: "Advanced Intervention",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "workshop",
    description: "Advanced workshop on neuromodulation and interventional techniques.",
  },
  symposium: {
    title: "ISAPM 8th National Meeting Symposium",
    shortTitle: "Symposium",
    date: "April 18, 2026",
    time: "08:00 - 17:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    room: "",
    type: "symposium",
    description: "Scientific symposium featuring keynote speakers and research presentations.",
  },
}

function isEventItem(item: any): boolean {
  const itemType = item.item_type?.toLowerCase()
  const eventId = item.event_id?.toLowerCase()
  if (itemType === "event") {
    return eventId && (eventId.startsWith("ws") || eventId === "cpd" || eventId === "symposium")
  }
  return ["workshop", "cpd", "symposium"].includes(itemType)
}

function getEventTypeFromId(eventId: string): "cpd" | "workshop" | "symposium" {
  const id = eventId?.toLowerCase()
  if (id === "cpd") return "cpd"
  if (id === "symposium") return "symposium"
  if (id?.startsWith("ws")) return "workshop"
  return "workshop"
}

function getEventIcon(type: string) {
  switch (type) {
    case "cpd":
      return GraduationCap
    case "workshop":
      return Wrench
    case "symposium":
      return Users
    default:
      return Calendar
  }
}

function getEventColorScheme(type: string) {
  switch (type) {
    case "cpd":
      return {
        gradient: "from-purple-600 to-purple-800",
        bg: "bg-purple-50",
        icon: "text-purple-600",
        badge: "bg-purple-100 text-purple-700",
      }
    case "workshop":
      return {
        gradient: "from-orange-500 to-orange-700",
        bg: "bg-orange-50",
        icon: "text-orange-600",
        badge: "bg-orange-100 text-orange-700",
      }
    case "symposium":
      return {
        gradient: "from-teal-600 to-teal-800",
        bg: "bg-teal-50",
        icon: "text-teal-600",
        badge: "bg-teal-100 text-teal-700",
      }
    default:
      return {
        gradient: "from-slate-600 to-slate-800",
        bg: "bg-slate-50",
        icon: "text-slate-600",
        badge: "bg-slate-100 text-slate-700",
      }
  }
}

function formatEventDate(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "TBA"
  const start = new Date(startDate)
  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }
  const end = new Date(endDate)
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`
  }
  return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
}

function formatEventTime(startTime: string | null, endTime: string | null, timezone: string | null): string {
  if (!startTime) return "TBA"
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    return `${hours}:${minutes}`
  }
  const tz = timezone || "WIB"
  if (!endTime) return `${formatTime(startTime)} ${tz}`
  return `${formatTime(startTime)} - ${formatTime(endTime)} ${tz}`
}

interface DBEventDetails {
  id: string
  slug: string
  title: string
  short_title: string
  event_type: string
  start_date: string | null
  end_date: string | null
  start_time: string | null
  end_time: string | null
  timezone: string | null
  location: string | null
  venue: string | null
  room: string | null
  description: string | null
}

interface EventResource {
  id: string
  event_id: string
  resource_type: string
  title: string
  description: string | null
  url: string
  file_type: string | null
  file_size: number | null
  is_public: boolean
  is_active: boolean
}

export default async function MyEventsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Load orders with verified payments
  const { data: ordersData } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*),
      order_payments (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // Filter to only verified orders with event items
  const verifiedOrders = (ordersData || []).filter((order) => {
    const hasVerifiedPayment = order.order_payments?.some((p: any) => p.payment_status === "verified")
    const hasEventItems = order.order_items?.some((item: any) => isEventItem(item))
    return hasVerifiedPayment && hasEventItems
  })

  // Get unique event IDs from orders
  const eventIds = new Set<string>()
  verifiedOrders.forEach((order) => {
    order.order_items?.forEach((item: any) => {
      if (isEventItem(item)) {
        eventIds.add(item.event_id)
      }
    })
  })

  // Load event details
  let dbEvents: DBEventDetails[] = []
  if (eventIds.size > 0) {
    const { data: eventsData } = await supabase.from("events").select("*").in("slug", Array.from(eventIds))
    dbEvents = eventsData || []
  }

  // Load resources for these events
  let resources: EventResource[] = []
  if (eventIds.size > 0) {
    const { data: resourcesData } = await supabase
      .from("event_resources")
      .select("*")
      .in("event_id", Array.from(eventIds))
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    resources = resourcesData || []
  }

  function getEventDetails(eventId: string) {
    const dbEvent = dbEvents.find((e) => e.slug === eventId)
    const fallback = fallbackEventDetails[eventId]

    if (dbEvent) {
      return {
        title: dbEvent.title || fallback?.title || eventId,
        shortTitle: dbEvent.short_title || fallback?.shortTitle || eventId,
        date: formatEventDate(dbEvent.start_date, dbEvent.end_date),
        time: formatEventTime(dbEvent.start_time, dbEvent.end_time, dbEvent.timezone),
        location: dbEvent.location || fallback?.location || "TBA",
        venue: dbEvent.venue || fallback?.venue || "TBA",
        room: dbEvent.room || "",
        type: (dbEvent.event_type || fallback?.type || "workshop") as "cpd" | "workshop" | "symposium",
        description: dbEvent.description || fallback?.description || "",
      }
    }

    return (
      fallback || {
        title: eventId,
        shortTitle: eventId,
        date: "TBA",
        time: "TBA",
        location: "TBA",
        venue: "TBA",
        room: "",
        type: "workshop" as const,
        description: "",
      }
    )
  }

  // Extract all event items from orders
  const allEventItems: { order: any; item: any }[] = []
  verifiedOrders.forEach((order) => {
    order.order_items?.forEach((item: any) => {
      if (isEventItem(item)) {
        allEventItems.push({ order, item })
      }
    })
  })

  // Stats
  const stats = {
    cpd: allEventItems.filter(({ item }) => getEventTypeFromId(item.event_id) === "cpd").length,
    workshop: allEventItems.filter(({ item }) => getEventTypeFromId(item.event_id) === "workshop").length,
    symposium: allEventItems.filter(({ item }) => getEventTypeFromId(item.event_id) === "symposium").length,
  }

  return (
    <>
      <Navigation />
      <main className="pt-20 pb-20 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-700 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-4">
              <Calendar className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">My Events</h1>
                <p className="text-orange-100">Access your registered CPD, workshops, and symposium</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2">CPD: {stats.cpd}</Badge>
              <Badge className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2">
                Workshops: {stats.workshop}
              </Badge>
              <Badge className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2">Symposium: {stats.symposium}</Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {allEventItems.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-700 mb-2">No Events Yet</h2>
                <p className="text-muted-foreground mb-6">You haven&apos;t registered for any events yet.</p>
                <Button asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search - Client Component */}
              <MyEventsSearch
                allEventItems={allEventItems}
                dbEvents={dbEvents}
                resources={resources}
                fallbackEventDetails={fallbackEventDetails}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
