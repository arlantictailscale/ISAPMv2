"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Ticket,
  Users,
  Loader2,
  Info,
  Gift,
  Search,
  Filter,
  Download,
  LinkIcon,
  Video,
  FileText,
  Globe,
  Building,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getBadgeColors } from "@/lib/badge-colors"
import type { Event, EventResource } from "@/lib/event-cms/types"

interface OrderItem {
  id: string
  event_id: string
  event_label: string
  participant_type_label: string
  item_type: string
  unit_price: number
  currency: string
  quantity: number
}

interface OrderPayment {
  payment_status: string
  payment_proof_url?: string
  verified_at?: string
  payment_method?: string
  sponsor_name?: string
}

interface Order {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  institution?: string
  status: string
  total_amount: number
  currency: string
  created_at: string
  order_items?: OrderItem[]
  order_payments?: OrderPayment[]
}

interface EnrichedEventData {
  event: Event | null
  resources: EventResource[]
}

export default function MyEventsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventDataMap, setEventDataMap] = useState<Record<string, EnrichedEventData>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    loadUserEvents()
  }, [])

  const loadUserEvents = async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/auth/login")
        return
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items!inner (*),
          order_payments!inner (
            payment_status,
            payment_proof_url,
            verified_at,
            payment_method,
            sponsor_name
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("order_items.item_type", "event")
        .eq("order_payments.payment_status", "verified")
        .order("created_at", { ascending: false })

      if (ordersError) {
        console.error("Error loading events:", ordersError)
        toast.error("Failed to load your events")
        return
      }

      setOrders(ordersData || [])

      if (ordersData && ordersData.length > 0) {
        const eventIds = new Set<string>()
        ordersData.forEach((order: Order) => {
          order.order_items?.forEach((item) => {
            if (item.event_id) {
              eventIds.add(item.event_id)
            }
          })
        })

        // Fetch all events from CMS
        const { data: events } = await supabase.from("events").select("*").in("slug", Array.from(eventIds))

        // Fetch resources for these events
        const eventIdList = events?.map((e: Event) => e.id) || []
        const { data: resources } = await supabase
          .from("event_resources")
          .select("*")
          .in("event_id", eventIdList)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })

        // Build event data map keyed by slug
        const dataMap: Record<string, EnrichedEventData> = {}
        Array.from(eventIds).forEach((slug) => {
          const event = events?.find((e: Event) => e.slug === slug) || null
          const eventResources = event ? resources?.filter((r: EventResource) => r.event_id === event.id) || [] : []
          dataMap[slug] = { event, resources: eventResources }
        })

        setEventDataMap(dataMap)
      }
    } catch (err) {
      console.error("Error in loadUserEvents:", err)
      toast.error("An error occurred while loading your events")
    } finally {
      setIsLoading(false)
    }
  }

  const getFallbackEventDetails = (eventId: string, eventLabel: string) => {
    const lowerLabel = eventLabel?.toLowerCase() || ""
    const lowerId = eventId?.toLowerCase() || ""

    let type: "CPD" | "Workshop" | "Symposium" = "CPD"
    if (lowerLabel.startsWith("ws ") || lowerLabel.includes("workshop") || lowerId.includes("workshop")) {
      type = "Workshop"
    } else if (lowerLabel.includes("symposium") || lowerId.includes("symposium")) {
      type = "Symposium"
    }

    return {
      date: "April 16-17, 2026",
      location: "Malang, East Java",
      venue: "The Singhasari Resort & Convention, Batu, Malang",
      type,
    }
  }

  const getEventInfo = (eventId: string, eventLabel: string) => {
    const cmsData = eventDataMap[eventId]
    if (cmsData?.event) {
      const event = cmsData.event
      const startDate = event.start_date
        ? new Date(event.start_date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "TBA"

      return {
        date:
          event.end_date && event.end_date !== event.start_date
            ? `${startDate} - ${new Date(event.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
            : startDate,
        location: event.location || "TBA",
        venue: event.venue || "TBA",
        type: (event.event_type?.charAt(0).toUpperCase() + event.event_type?.slice(1)) as
          | "CPD"
          | "Workshop"
          | "Symposium",
        description: event.description,
        is_online: event.is_online,
        online_url: event.online_url,
        start_time: event.start_time,
        end_time: event.end_time,
      }
    }
    return getFallbackEventDetails(eventId, eventLabel)
  }

  const filteredOrders = orders.filter((order) => {
    const eventItems = order.order_items?.filter((item) => item.item_type === "event") || []

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        eventItems.some(
          (item) => item.event_label.toLowerCase().includes(query) || item.event_id.toLowerCase().includes(query),
        ) || order.full_name.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Type filter
    if (filterType !== "all") {
      const matchesType = eventItems.some((item) => {
        const eventInfo = getEventInfo(item.event_id, item.event_label)
        return eventInfo.type.toLowerCase() === filterType.toLowerCase()
      })
      if (!matchesType) return false
    }

    return true
  })

  const getUniqueEventTypes = () => {
    const types = new Set<string>()
    orders.forEach((order) => {
      order.order_items?.forEach((item) => {
        if (item.item_type === "event") {
          const eventInfo = getEventInfo(item.event_id, item.event_label)
          types.add(eventInfo.type)
        }
      })
    })
    return Array.from(types)
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4" />
      case "video":
        return <Video className="w-4 h-4" />
      case "link":
        return <LinkIcon className="w-4 h-4" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your events...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-background to-muted/20">
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold">My Verified Events</h1>
                  <p className="text-muted-foreground">Events you are confirmed to attend</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1">Verified Registrations</p>
                    <p className="text-green-700 dark:text-green-300">
                      Only events with verified payments are displayed here. These are the events you are confirmed to
                      attend. Please bring a valid ID and this confirmation on the event day.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {orders.length > 0 && (
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    <option value="all">All Types</option>
                    {getUniqueEventTypes().map((type) => (
                      <option key={type} value={type.toLowerCase()}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {!orders || orders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                    <Calendar className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">No Verified Events</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    You don't have any verified event registrations yet. Complete payment for your pending registrations
                    or browse new events to get started.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/my-purchases">
                      <Button variant="outline" size="lg" className="gap-2 bg-transparent">
                        <Clock className="w-4 h-4" />
                        View Pending Registrations
                      </Button>
                    </Link>
                    <Link href="/events">
                      <Button size="lg" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Browse Events
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : filteredOrders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No matching events</h3>
                  <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setFilterType("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const eventItems = order.order_items?.filter((item) => item.item_type === "event") || []
                  const payment = order.order_payments?.[0]

                  return (
                    <Card
                      key={order.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow border-green-200 dark:border-green-900"
                    >
                      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-b border-green-200 dark:border-green-800">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-green-900 dark:text-green-100">
                                Registration #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 text-green-700 dark:text-green-300">
                              <Calendar className="w-4 h-4" />
                              Verified on{" "}
                              {payment?.verified_at
                                ? new Date(payment.verified_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : new Date(order.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment?.payment_method === "sponsored" && (
                              <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0">
                                <Gift className="w-3 h-3 mr-1" />
                                Sponsored
                              </Badge>
                            )}
                            <Badge className="bg-green-600 hover:bg-green-700 text-white border-0">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          {eventItems.map((item) => {
                            const eventInfo = getEventInfo(item.event_id, item.event_label)
                            const cmsData = eventDataMap[item.event_id]
                            const resources = cmsData?.resources || []

                            return (
                              <div
                                key={item.id}
                                className="border rounded-lg p-5 bg-gradient-to-br from-background to-muted/30"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <Badge
                                    className={`text-xs font-semibold ${getBadgeColors("event", item.event_label, item.event_id).bg} ${getBadgeColors("event", item.event_label, item.event_id).text}`}
                                  >
                                    {eventInfo.type.toUpperCase()}
                                  </Badge>
                                  <span className="text-lg font-bold text-primary">
                                    {item.currency} {item.unit_price.toLocaleString("id-ID")}
                                  </span>
                                </div>

                                <h3 className="text-xl font-bold mb-2">{item.event_label}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{item.participant_type_label}</p>

                                {eventInfo.description && (
                                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {eventInfo.description}
                                  </p>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                                  <div className="flex items-start gap-2">
                                    <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-semibold text-base mb-1">Event Date</p>
                                      <p className="text-muted-foreground">{eventInfo.date}</p>
                                      {eventInfo.start_time && (
                                        <p className="text-muted-foreground text-xs mt-1">
                                          {eventInfo.start_time}
                                          {eventInfo.end_time ? ` - ${eventInfo.end_time}` : ""}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    {eventInfo.is_online ? (
                                      <Globe className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                    )}
                                    <div>
                                      <p className="font-semibold text-base mb-1">
                                        {eventInfo.is_online ? "Online Event" : "Location"}
                                      </p>
                                      <p className="text-muted-foreground">
                                        {eventInfo.is_online ? "Virtual / Online" : eventInfo.location}
                                      </p>
                                    </div>
                                  </div>
                                  {!eventInfo.is_online && (
                                    <div className="flex items-start gap-2 sm:col-span-2">
                                      <Building className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="font-semibold text-base mb-1">Venue</p>
                                        <p className="text-muted-foreground">{eventInfo.venue}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {resources.length > 0 && (
                                  <div className="mt-6 border-t pt-4">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                                      <Download className="w-4 h-4" />
                                      Event Resources
                                    </h4>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {resources.map((resource) => (
                                        <a
                                          key={resource.id}
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                                        >
                                          {getResourceIcon(resource.resource_type)}
                                          <span className="flex-1 truncate">{resource.title}</span>
                                          {resource.file_size && (
                                            <span className="text-xs text-muted-foreground">
                                              {(resource.file_size / 1024 / 1024).toFixed(1)} MB
                                            </span>
                                          )}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {eventInfo.is_online && eventInfo.online_url && (
                                  <div className="mt-4">
                                    <a
                                      href={eventInfo.online_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                    >
                                      <Video className="w-4 h-4" />
                                      Join Online Event
                                    </a>
                                  </div>
                                )}

                                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                  <div className="flex items-start gap-3 text-sm">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                        Registration Confirmed & Verified
                                      </p>
                                      <ul className="text-green-700 dark:text-green-300 space-y-1.5 list-disc list-inside">
                                        <li>Your payment has been verified by our team</li>
                                        <li>You are confirmed to attend this event</li>
                                        {!eventInfo.is_online && (
                                          <>
                                            <li>Please bring a valid ID on the event day</li>
                                            <li>Arrive 30 minutes early for check-in</li>
                                          </>
                                        )}
                                        {eventInfo.is_online && <li>Join link will be available before the event</li>}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          <div className="border-t pt-6">
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Participant Information
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm bg-muted/50 p-4 rounded-lg">
                              <div>
                                <span className="text-muted-foreground">Name:</span>
                                <p className="font-medium">{order.full_name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Email:</span>
                                <p className="font-medium break-all">{order.email}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Phone:</span>
                                <p className="font-medium">{order.phone}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Institution:</span>
                                <p className="font-medium">{order.institution || "Not specified"}</p>
                              </div>
                              {payment?.payment_method === "sponsored" && payment.sponsor_name && (
                                <div className="sm:col-span-2">
                                  <span className="text-muted-foreground">Sponsored by:</span>
                                  <p className="font-medium text-purple-700 flex items-center gap-1">
                                    <Gift className="w-4 h-4" />
                                    {payment.sponsor_name}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2 flex-wrap">
                            <Link href={`/payment/order/${order.id}`} className="flex-1 min-w-[200px]">
                              <Button variant="outline" className="w-full gap-2 bg-transparent" size="lg">
                                <Ticket className="w-4 h-4" />
                                View Confirmation
                              </Button>
                            </Link>
                            <Link href="/venue" className="flex-1 min-w-[200px]">
                              <Button variant="outline" className="w-full gap-2 bg-transparent" size="lg">
                                <MapPin className="w-4 h-4" />
                                Venue Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Info className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Important Information</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      This page shows only your verified event registrations. For pending payments or other
                      registrations, please visit "My Purchases". Need assistance? Contact our support team.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Link href="/my-purchases">
                        <Button variant="outline" size="sm">
                          View All Purchases
                        </Button>
                      </Link>
                      <Link href="/contact">
                        <Button variant="outline" size="sm">
                          Contact Support
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
