"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, CheckCircle, XCircle, Clock, Ticket, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

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

export default function MyEventsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        console.log("[v0] Not authenticated, redirecting to login")
        router.push("/auth/login")
        return
      }

      // Fetch orders with event items only
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items!inner (*),
          order_payments (
            payment_status,
            payment_proof_url,
            verified_at
          )
        `,
        )
        .eq("user_id", user.id)
        .eq("order_items.item_type", "event")
        .order("created_at", { ascending: false })

      if (ordersError) {
        console.error("[v0] Error loading events:", ordersError.message)
        toast.error("Failed to load your events")
        return
      }

      setOrders(ordersData || [])
    } catch (err) {
      console.error("[v0] Error in loadUserEvents:", err)
      toast.error("An error occurred while loading your events")
    } finally {
      setIsLoading(false)
    }
  }

  // Event details mapping
  const eventDetails: Record<
    string,
    { date: string; location: string; venue: string; type: "CPD" | "Workshop" | "Symposium" }
  > = {
    "cpd-day-1": {
      date: "Thursday, April 16, 2026",
      location: "Malang, East Java",
      venue: "Harris Hotel & Conventions Malang",
      type: "CPD",
    },
    "cpd-day-2": {
      date: "Friday, April 17, 2026",
      location: "Malang, East Java",
      venue: "Harris Hotel & Conventions Malang",
      type: "CPD",
    },
    "cpd-both": {
      date: "April 16-17, 2026",
      location: "Malang, East Java",
      venue: "Harris Hotel & Conventions Malang",
      type: "CPD",
    },
    workshop: {
      date: "Friday, April 17, 2026",
      location: "Malang, East Java",
      venue: "Harris Hotel & Conventions Malang",
      type: "Workshop",
    },
    symposium: {
      date: "Friday, April 17, 2026",
      location: "Malang, East Java",
      venue: "Harris Hotel & Conventions Malang",
      type: "Symposium",
    },
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Pending Payment", variant: "secondary", icon: Clock },
      paid: { label: "Confirmed", variant: "default", icon: CheckCircle },
      cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getEventType = (eventId: string, eventLabel: string): "CPD" | "Workshop" | "Symposium" => {
    const lowerLabel = eventLabel?.toLowerCase() || ""
    const lowerId = eventId?.toLowerCase() || ""

    // Check if it's a workshop (WS prefix or contains "workshop")
    if (lowerLabel.startsWith("ws ") || lowerLabel.includes("workshop") || lowerId.includes("workshop")) {
      return "Workshop"
    }

    // Check if it's a symposium
    if (lowerLabel.includes("symposium") || lowerId.includes("symposium")) {
      return "Symposium"
    }

    // Default to CPD for courses
    return "CPD"
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
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Ticket className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold">My Events</h1>
                  <p className="text-muted-foreground">Your registered CPD courses, workshops, and symposium</p>
                </div>
              </div>
            </div>

            {!orders || orders.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                    <Calendar className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">No Events Registered</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    You haven't registered for any events yet. Browse our CPD courses, workshops, and symposium to get
                    started.
                  </p>
                  <Link href="/events">
                    <Button size="lg" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      Browse Events
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const eventItems = order.order_items?.filter((item) => item.item_type === "event") || []
                  const payment = order.order_payments?.[0]
                  const isPaid = order.status === "paid" || payment?.payment_status === "verified"

                  return (
                    <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 mb-2">
                              <Ticket className="w-5 h-5 text-primary" />
                              Registration #{order.id.slice(0, 8).toUpperCase()}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Registered on{" "}
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </CardDescription>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          {/* Event Items */}
                          {eventItems.map((item) => {
                            const eventInfo = eventDetails[item.event_id] || {
                              date: "April 16-17, 2026",
                              location: "Malang, East Java",
                              venue: "Harris Hotel & Conventions Malang",
                              type: getEventType(item.event_id, item.event_label),
                            }

                            return (
                              <div
                                key={item.id}
                                className="border rounded-lg p-5 bg-gradient-to-br from-background to-muted/30"
                              >
                                {/* Event Type Badge */}
                                <div className="flex items-start justify-between mb-4">
                                  <Badge className="text-xs font-semibold" variant="outline">
                                    {eventInfo.type}
                                  </Badge>
                                  <span className="text-lg font-bold text-primary">
                                    {item.currency} {item.unit_price.toLocaleString("id-ID")}
                                  </span>
                                </div>

                                {/* Event Name */}
                                <h3 className="text-xl font-bold mb-2">{item.event_label}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{item.participant_type_label}</p>

                                {/* Event Details Grid */}
                                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                                  <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium">Date</p>
                                      <p className="text-muted-foreground">{eventInfo.date}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium">Location</p>
                                      <p className="text-muted-foreground">{eventInfo.location}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2 sm:col-span-2">
                                    <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium">Venue</p>
                                      <p className="text-muted-foreground">{eventInfo.venue}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Access Information */}
                                {isPaid && (
                                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                    <div className="flex items-start gap-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                          Registration Confirmed
                                        </p>
                                        <p className="text-green-700 dark:text-green-300">
                                          Your registration has been confirmed. Please bring a valid ID on the event
                                          day.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Participant Information */}
                          <div className="border-t pt-6">
                            <h4 className="font-semibold mb-4 flex items-center gap-2">
                              <Users className="w-4 h-4" />
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
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 pt-2 flex-wrap">
                            {!isPaid && (
                              <Link href={`/payment/order/${order.id}`} className="flex-1 min-w-[200px]">
                                <Button className="w-full gap-2" size="lg">
                                  <CheckCircle className="w-4 h-4" />
                                  Complete Payment
                                </Button>
                              </Link>
                            )}
                            {isPaid && (
                              <Link href={`/payment/order/${order.id}`} className="flex-1 min-w-[200px]">
                                <Button variant="outline" className="w-full gap-2 bg-transparent" size="lg">
                                  <Ticket className="w-4 h-4" />
                                  View Receipt
                                </Button>
                              </Link>
                            )}
                            <Link href="/venue" className="flex-1 min-w-[200px]">
                              <Button variant="outline" className="w-full gap-2 bg-transparent" size="lg">
                                <MapPin className="w-4 h-4" />
                                View Venue Details
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

            {/* Help Section */}
            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Need Help?</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      If you have questions about your registration or need assistance, please contact us.
                    </p>
                    <Link href="/contact">
                      <Button variant="outline" size="sm">
                        Contact Support
                      </Button>
                    </Link>
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
