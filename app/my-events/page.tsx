import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Users,
  FileText,
  Video,
  BookOpen,
  Download,
  ExternalLink,
  GraduationCap,
  Stethoscope,
} from "lucide-react"
import { getPricingByEventId } from "@/lib/data/event-pricing"

interface EventOrder {
  id: string
  user_id: string
  email: string
  full_name: string
  created_at: string
  order_items: {
    id: string
    event_id: string
    event_label: string
    item_type: string
    participant_type_label: string
  }[]
  order_payments: {
    payment_status: string
    verified_at: string
  }[]
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
}

// Event details with dates, location, etc.
const eventDetails: Record<
  string,
  {
    title: string
    shortTitle: string
    date: string
    time: string
    location: string
    venue: string
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
    type: "cpd",
    description:
      "Comprehensive 2-day continuing professional development program covering pain management fundamentals, assessment techniques, and practical skills.",
  },
  ws1: {
    title: "Workshop 1: Regenerative Pain Therapy",
    shortTitle: "Regenerative Pain Therapy",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    type: "workshop",
    description:
      "Hands-on workshop on regenerative pain therapy including PRP preparation, prolotherapy, and microinvasive techniques.",
  },
  ws2: {
    title: "Workshop 2: Basic Interventional Pain Management (Musculoskeletal)",
    shortTitle: "Basic Interventional Pain",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    type: "workshop",
    description:
      "Foundational workshop covering ultrasound-guided musculoskeletal procedures for shoulder, low back, and knee pain.",
  },
  ws3: {
    title: "Workshop 3: Pediatric Essential Pain Management (EPM Lite) + TOT",
    shortTitle: "Pediatric Pain Management",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    type: "workshop",
    description:
      "Specialized workshop on pediatric pain assessment, regional techniques, and non-pharmacologic management approaches.",
  },
  ws4: {
    title: "Workshop 4: Adjunct Therapy for Pain Management",
    shortTitle: "Adjunct Therapy",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    type: "workshop",
    description:
      "Workshop covering complementary pain therapies including massage, TENS, shock wave therapy, SEFT, and mindfulness.",
  },
  ws5: {
    title: "Workshop 5: Developing a Pain Clinic",
    shortTitle: "Developing a Pain Clinic",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    type: "workshop",
    description:
      "Team-based workshop on establishing and running a multidisciplinary pain clinic including workflow, staffing, and documentation.",
  },
  ws6: {
    title: "Workshop 6: Cancer Pain",
    shortTitle: "Cancer Pain",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    type: "workshop",
    description:
      "Comprehensive workshop on cancer pain management including WHO ladder, interventional techniques, and palliative care.",
  },
  ws7: {
    title: "Workshop 7: Advanced Intervention of Pain Management",
    shortTitle: "Advanced Intervention",
    date: "April 17, 2026",
    time: "07:30 - 16:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    type: "workshop",
    description:
      "Advanced workshop on neuromodulation, intrathecal drug delivery, radiofrequency techniques, and complex case management.",
  },
  symposium: {
    title: "ISAPM 8th National Meeting Symposium",
    shortTitle: "Symposium",
    date: "April 18, 2026",
    time: "08:00 - 17:00 WIB",
    location: "Malang, East Java",
    venue: "Hotel Venue (TBA)",
    type: "symposium",
    description:
      "Scientific symposium featuring keynote speakers, research presentations, and expert panel discussions on the latest in pain management.",
  },
}

function getEventColorScheme(eventType: string) {
  if (eventType === "cpd") {
    return {
      gradient: "from-purple-600 to-violet-600",
      badge: "bg-purple-100 text-purple-700 border-purple-200",
      icon: "text-purple-600",
      bg: "bg-purple-50",
    }
  } else if (eventType === "workshop") {
    return {
      gradient: "from-orange-500 to-amber-500",
      badge: "bg-orange-100 text-orange-700 border-orange-200",
      icon: "text-orange-600",
      bg: "bg-orange-50",
    }
  } else if (eventType === "symposium") {
    return {
      gradient: "from-teal-600 to-emerald-600",
      badge: "bg-teal-100 text-teal-700 border-teal-200",
      icon: "text-teal-600",
      bg: "bg-teal-50",
    }
  }
  return {
    gradient: "from-slate-600 to-slate-700",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "text-slate-600",
    bg: "bg-slate-50",
  }
}

function getEventIcon(eventType: string) {
  if (eventType === "cpd") return GraduationCap
  if (eventType === "workshop") return Stethoscope
  return Users
}

function EventCard({
  order,
  eventItem,
  resources,
}: {
  order: EventOrder
  eventItem: EventOrder["order_items"][0]
  resources: EventResource[]
}) {
  const details = eventDetails[eventItem.event_id]
  const pricing = getPricingByEventId(eventItem.event_id)
  const payment = order.order_payments?.[0]
  const colors = getEventColorScheme(details?.type || "workshop")
  const EventIcon = getEventIcon(details?.type || "workshop")

  const eventResources = resources.filter((r) => r.event_id === eventItem.event_id)
  const materials = eventResources.filter((r) => r.resource_type === "document")
  const links = eventResources.filter((r) => r.resource_type === "link")
  const videos = eventResources.filter((r) => r.resource_type === "video")

  return (
    <Card className="overflow-hidden shadow-lg">
      {/* Event Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Badge className="bg-white/20 text-white border-white/30 mb-3">
              <CheckCircle className="w-3 h-3 mr-1" />
              Registered
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-balance">
              {details?.shortTitle || eventItem.event_label}
            </h2>
            <p className="text-white/90 text-sm sm:text-base line-clamp-2">{details?.title || eventItem.event_label}</p>
          </div>
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <EventIcon className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Event Details Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
            <Calendar className={`w-5 h-5 ${colors.icon}`} />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-semibold text-sm">{details?.date || pricing?.date || "TBA"}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
            <Clock className={`w-5 h-5 ${colors.icon}`} />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-semibold text-sm">{details?.time || "TBA"}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
            <MapPin className={`w-5 h-5 ${colors.icon}`} />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-semibold text-sm">{details?.location || "TBA"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Registration</p>
              <p className="font-semibold text-sm text-green-700">Confirmed</p>
            </div>
          </div>
        </div>

        {/* Participant Type */}
        {eventItem.participant_type_label && (
          <div className="mb-6 p-4 border rounded-xl bg-card">
            <p className="text-sm text-muted-foreground mb-1">Registered As</p>
            <p className="font-semibold">{eventItem.participant_type_label}</p>
          </div>
        )}

        {/* Description */}
        {details?.description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-600" />
              About This Event
            </h3>
            <p className="text-muted-foreground text-sm">{details.description}</p>
          </div>
        )}

        {/* Resources Section */}
        {eventResources.length > 0 && (
          <div className="space-y-4">
            {/* Materials */}
            {materials.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Materials & Documents
                </h3>
                <div className="grid gap-2">
                  {materials.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{resource.title}</p>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground">{resource.description}</p>
                          )}
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {links.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-indigo-600" />
                  Links
                </h3>
                <div className="grid gap-2">
                  {links.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{resource.title}</p>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground">{resource.description}</p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-600" />
                  Videos & Recordings
                </h3>
                <div className="grid gap-2">
                  {videos.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Video className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{resource.title}</p>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground">{resource.description}</p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Resources Yet */}
        {eventResources.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed rounded-lg">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-muted-foreground text-sm">Event materials will be available closer to the event date.</p>
          </div>
        )}

        {/* Order Info */}
        <div className="border-t pt-4 mt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>Order ID: {order.id.slice(0, 8)}</span>
            <span>Registered: {order.full_name}</span>
            <span>
              Approved:{" "}
              {payment?.verified_at
                ? new Date(payment.verified_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function MyEventsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch event orders (CPD, Workshop, Symposium) with verified payments
  // Exclude webinars which have their own page
  const { data: eventOrders } = await supabase
    .from("orders")
    .select(
      `
      id,
      user_id,
      email,
      full_name,
      created_at,
      order_items!inner(id, event_id, event_label, item_type, participant_type_label),
      order_payments!inner(payment_status, verified_at)
    `,
    )
    .eq("user_id", user.id)
    .in("order_items.item_type", ["event", "workshop", "cpd", "symposium"])
    .eq("order_payments.payment_status", "verified")
    .order("created_at", { ascending: false })

  // Fetch event resources for user's registered events
  const eventIds =
    eventOrders?.flatMap((order) =>
      order.order_items
        .filter((item) => ["event", "workshop", "cpd", "symposium"].includes(item.item_type))
        .map((item) => item.event_id),
    ) || []

  // Get unique UUIDs for events table lookup
  const { data: eventsData } = await supabase
    .from("events")
    .select("id, slug")
    .in("slug", [...new Set(eventIds)])

  const eventUuids = eventsData?.map((e) => e.id) || []

  // Fetch resources for those events
  const { data: resources } = await supabase
    .from("event_resources")
    .select("*")
    .in("event_id", eventUuids)
    .eq("is_active", true)
    .order("sort_order")

  // Map resources back to event slugs
  const eventIdToSlug = new Map(eventsData?.map((e) => [e.id, e.slug]) || [])
  const mappedResources =
    resources?.map((r) => ({
      ...r,
      event_id: eventIdToSlug.get(r.event_id) || r.event_id,
    })) || []

  const approvedEvents = (eventOrders || []) as EventOrder[]

  // Group events by type
  const cpdEvents = approvedEvents.filter((order) =>
    order.order_items.some((item) => item.event_id === "cpd" || item.item_type === "cpd"),
  )
  const workshopEvents = approvedEvents.filter((order) =>
    order.order_items.some((item) => item.event_id.startsWith("ws") || item.item_type === "workshop"),
  )
  const symposiumEvents = approvedEvents.filter((order) =>
    order.order_items.some((item) => item.event_id === "symposium" || item.item_type === "symposium"),
  )

  const totalEvents =
    cpdEvents.flatMap((o) => o.order_items).length +
    workshopEvents.flatMap((o) => o.order_items).length +
    symposiumEvents.flatMap((o) => o.order_items).length

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-orange-50/50 to-background">
        {/* Header Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">My Events</h1>
                <p className="text-orange-100">Access your registered CPD, workshops, and symposium</p>
              </div>
            </div>
            {totalEvents > 0 && (
              <div className="flex flex-wrap gap-4 mt-6">
                {cpdEvents.length > 0 && (
                  <div className="bg-purple-500/30 rounded-lg px-4 py-2">
                    <span className="text-purple-100 text-sm">CPD:</span>
                    <span className="font-bold ml-2">{cpdEvents.flatMap((o) => o.order_items).length}</span>
                  </div>
                )}
                {workshopEvents.length > 0 && (
                  <div className="bg-orange-400/30 rounded-lg px-4 py-2">
                    <span className="text-orange-100 text-sm">Workshops:</span>
                    <span className="font-bold ml-2">{workshopEvents.flatMap((o) => o.order_items).length}</span>
                  </div>
                )}
                {symposiumEvents.length > 0 && (
                  <div className="bg-teal-500/30 rounded-lg px-4 py-2">
                    <span className="text-teal-100 text-sm">Symposium:</span>
                    <span className="font-bold ml-2">{symposiumEvents.flatMap((o) => o.order_items).length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {totalEvents === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">No Events Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven&apos;t registered for any events yet, or your payment is still being processed.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/events">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        Browse Events
                      </Button>
                    </Link>
                    <Link href="/my-purchases">
                      <Button variant="outline">Check Payment Status</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* CPD Events */}
                {cpdEvents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                      <h2 className="text-lg font-semibold">CPD Courses</h2>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        {cpdEvents.flatMap((o) => o.order_items.filter((i) => i.event_id === "cpd")).length} registered
                      </Badge>
                    </div>
                    {cpdEvents.map((order) =>
                      order.order_items
                        .filter((item) => item.event_id === "cpd" || item.item_type === "cpd")
                        .map((item) => (
                          <EventCard
                            key={`${order.id}-${item.id}`}
                            order={order}
                            eventItem={item}
                            resources={mappedResources}
                          />
                        )),
                    )}
                  </div>
                )}

                {/* Workshop Events */}
                {workshopEvents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-orange-600" />
                      <h2 className="text-lg font-semibold">Workshops</h2>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                        {workshopEvents.flatMap((o) => o.order_items.filter((i) => i.event_id.startsWith("ws"))).length}{" "}
                        registered
                      </Badge>
                    </div>
                    {workshopEvents.map((order) =>
                      order.order_items
                        .filter((item) => item.event_id.startsWith("ws") || item.item_type === "workshop")
                        .map((item) => (
                          <EventCard
                            key={`${order.id}-${item.id}`}
                            order={order}
                            eventItem={item}
                            resources={mappedResources}
                          />
                        )),
                    )}
                  </div>
                )}

                {/* Symposium Events */}
                {symposiumEvents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-600" />
                      <h2 className="text-lg font-semibold">Symposium</h2>
                      <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                        {symposiumEvents.flatMap((o) => o.order_items.filter((i) => i.event_id === "symposium")).length}{" "}
                        registered
                      </Badge>
                    </div>
                    {symposiumEvents.map((order) =>
                      order.order_items
                        .filter((item) => item.event_id === "symposium" || item.item_type === "symposium")
                        .map((item) => (
                          <EventCard
                            key={`${order.id}-${item.id}`}
                            order={order}
                            eventItem={item}
                            resources={mappedResources}
                          />
                        )),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
