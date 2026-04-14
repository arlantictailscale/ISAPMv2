"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  Gift,
  Ticket,
  Video,
  ExternalLink,
  Download,
  Building,
  DoorOpen,
  FileText,
  LinkIcon,
  Search,
  QrCode,
} from "lucide-react"
import { PageLoader } from "@/components/ui/page-loader"

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

function getEventDetails(eventId: string) {
  return (
    fallbackEventDetails[eventId] || {
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
      return Gift
    case "workshop":
      return Ticket
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

export default function MyEventsPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [resources, setResources] = useState<EventResource[]>([])
  const [dbEvents, setDbEvents] = useState<DBEventDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    loadUserEvents()
  }, [])

  async function loadUserEvents() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        router.push("/login")
        return
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*),
          order_payments (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      const verifiedOrders = (ordersData || []).filter((order) => {
        const hasVerifiedPayment = order.order_payments?.some((p: any) => p.payment_status === "verified")
        const hasEventItems = order.order_items?.some((item: any) => isEventItem(item))
        return hasVerifiedPayment && hasEventItems
      })

      setOrders(verifiedOrders)

      const eventSlugs = new Set<string>()
      verifiedOrders.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          if (isEventItem(item)) {
            eventSlugs.add(item.event_id)
          }
        })
      })

      if (eventSlugs.size > 0) {
        const { data: eventsData } = await supabase.from("events").select("*").in("slug", Array.from(eventSlugs))

        setDbEvents(eventsData || [])

        const eventUuids = (eventsData || []).map((e) => e.id)

        if (eventUuids.length > 0) {
          const { data: resourcesData } = await supabase
            .from("event_resources")
            .select("*")
            .in("event_id", eventUuids) // Query by UUID instead of slug
            .eq("is_active", true)
            .order("sort_order", { ascending: true })

          setResources(resourcesData || [])
        }
      }
    } catch (error) {
      console.error("Error loading events:", error)
    } finally {
      setLoading(false)
    }
  }

  const eventDetails = useMemo(() => {
    const allEventIds = new Set<string>()
    orders.forEach((order) => {
      order.order_items?.forEach((item: any) => {
        if (isEventItem(item)) {
          allEventIds.add(item.event_id)
        }
      })
    })

    const details: Record<string, any> = {}
    allEventIds.forEach((eventId) => {
      const dbEvent = dbEvents.find((e) => e.slug === eventId)
      if (dbEvent) {
        // Use database event details
        details[eventId] = {
          id: dbEvent.id, // Include UUID for resource lookup
          title: dbEvent.title,
          shortTitle: dbEvent.short_title,
          date: formatEventDate(dbEvent.start_date, dbEvent.end_date),
          time: formatEventTime(dbEvent.start_time, dbEvent.end_time, dbEvent.timezone),
          location: dbEvent.location || "Malang, East Java",
          venue: dbEvent.venue || "Hotel Venue (TBA)",
          room: dbEvent.room || "",
          type: dbEvent.event_type as "cpd" | "workshop" | "symposium",
          description: dbEvent.description || "",
        }
      } else {
        // Fall back to static data
        details[eventId] = getEventDetails(eventId)
      }
    })
    return details
  }, [orders, dbEvents])

  const allEventItems = useMemo(() => {
    const items: { order: any; item: any }[] = []
    orders.forEach((order) => {
      order.order_items?.forEach((item: any) => {
        if (isEventItem(item)) {
          items.push({ order, item })
        }
      })
    })
    return items
  }, [orders])

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allEventItems
    const query = searchQuery.toLowerCase()
    return allEventItems.filter(({ item }) => {
      const details = eventDetails[item.event_id]
      if (!details) return false
      return (
        details.title?.toLowerCase().includes(query) ||
        details.shortTitle?.toLowerCase().includes(query) ||
        item.event_label?.toLowerCase().includes(query)
      )
    })
  }, [allEventItems, searchQuery, eventDetails])

  const stats = useMemo(() => {
    const allItems = orders.flatMap((o) => o.order_items || [])
    const eventItems = allItems.filter((item: any) => isEventItem(item))
    return {
      cpd: eventItems.filter((i: any) => getEventTypeFromId(i.event_id) === "cpd").length,
      workshop: eventItems.filter((i: any) => getEventTypeFromId(i.event_id) === "workshop").length,
      symposium: eventItems.filter((i: any) => getEventTypeFromId(i.event_id) === "symposium").length,
    }
  }, [orders])

  if (loading) {
    return <PageLoader text="Loading your events..." />
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

            <div className="flex flex-wrap gap-3 mt-6">
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2">CPD: {stats.cpd}</Badge>
              <Badge className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2">
                Workshops: {stats.workshop}
              </Badge>
              <Badge className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2">Symposium: {stats.symposium}</Badge>
            </div>

            {/* Participant Card Button */}
            {orders.length > 0 && (
              <div className="mt-6">
                <Link href={`/my-events/participant-card/${orders[0].id}`}>
                  <Button className="bg-white text-orange-600 hover:bg-orange-50">
                    <QrCode className="w-4 h-4 mr-2" />
                    View Participant Card
                  </Button>
                </Link>
              </div>
            )}
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
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              {/* Event Cards */}
              <div className="space-y-6">
                {filteredItems.map(({ order, item }, index) => {
                  const details = eventDetails[item.event_id]
                  if (!details) return null
                  const colors = getEventColorScheme(details.type)
                  const EventIcon = getEventIcon(details.type)
                  const eventResources = resources.filter((r) => {
                    const eventUuid = details.id
                    return eventUuid ? r.event_id === eventUuid : false
                  })
                  const materials = eventResources.filter((r) => r.resource_type === "document")
                  const links = eventResources.filter((r) => r.resource_type === "link")
                  const videos = eventResources.filter((r) => r.resource_type === "video")

                  return (
                    <Card key={`${order.id}-${item.id}-${index}`} className="overflow-hidden shadow-lg">
                      <CardHeader className={`bg-gradient-to-r ${colors.gradient} p-6 text-white`}>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <Badge className="bg-white/20 text-white border-white/30 mb-3">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Registered
                            </Badge>
                            <CardTitle className="text-xl sm:text-2xl font-bold mb-2 text-balance">
                              {details.shortTitle}
                            </CardTitle>
                            <p className="text-white/90 text-sm sm:text-base line-clamp-2">{details.title}</p>
                          </div>
                          <div className="shrink-0">
                            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                              <EventIcon className="w-8 h-8" />
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                          <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                            <Calendar className={`w-5 h-5 ${colors.icon}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold text-sm">{details.date}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                            <Clock className={`w-5 h-5 ${colors.icon}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Time</p>
                              <p className="font-semibold text-sm">{details.time}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                            <MapPin className={`w-5 h-5 ${colors.icon}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Location</p>
                              <p className="font-semibold text-sm">{details.location}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                            <Building className={`w-5 h-5 ${colors.icon}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Venue</p>
                              <p className="font-semibold text-sm">{details.venue}</p>
                            </div>
                          </div>
                          {details.room && (
                            <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                              <DoorOpen className={`w-5 h-5 ${colors.icon}`} />
                              <div>
                                <p className="text-xs text-muted-foreground">Room</p>
                                <p className="font-semibold text-sm">{details.room}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {details.description && (
                          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                            <p className="text-sm text-muted-foreground">{details.description}</p>
                          </div>
                        )}

                        {eventResources.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900">Event Resources</h3>

                            {materials.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Materials
                                </h4>
                                <div className="space-y-2">
                                  {materials.map((resource) => (
                                    <a
                                      key={resource.id}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                      <Download className="w-4 h-4 text-slate-500" />
                                      <span className="flex-1 text-sm font-medium">{resource.title}</span>
                                      {resource.file_type && (
                                        <Badge variant="outline" className="text-xs">
                                          {resource.file_type.toUpperCase()}
                                        </Badge>
                                      )}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {links.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <LinkIcon className="w-4 h-4" />
                                  Links
                                </h4>
                                <div className="space-y-2">
                                  {links.map((resource) => (
                                    <a
                                      key={resource.id}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4 text-slate-500" />
                                      <span className="flex-1 text-sm font-medium">{resource.title}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {videos.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <Video className="w-4 h-4" />
                                  Videos
                                </h4>
                                <div className="space-y-2">
                                  {videos.map((resource) => (
                                    <a
                                      key={resource.id}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                      <Video className="w-4 h-4 text-slate-500" />
                                      <span className="flex-1 text-sm font-medium">{resource.title}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {eventResources.length === 0 && (
                          <div className="text-center py-6 text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No resources available yet.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

// Helper functions for formatting dates/times from database
function formatEventDate(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "TBA"
  const start = new Date(startDate)
  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }
  const end = new Date(endDate)
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })}-${end.getDate()}, ${end.getFullYear()}`
  }
  return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
}

function formatEventTime(startTime: string | null, endTime: string | null, timezone: string | null): string {
  if (!startTime) return "TBA"
  const tz = timezone || "WIB"
  if (!endTime) return `${startTime} ${tz}`
  return `${startTime} - ${endTime} ${tz}`
}
