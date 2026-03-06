import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  User,
  FileText,
  ShoppingBag,
  Users,
  Presentation,
  Hotel,
  ShoppingCart,
  Video,
  Calendar,
  CreditCard,
  Receipt,
  BarChart3,
  Mail,
  Ticket,
  CalendarDays,
  DollarSign,
  Clock,
  Building,
  FileCheck,
  UserCheck,
} from "lucide-react"
import Link from "next/link"
import { checkProfileCompleteness } from "@/lib/profile/validation"
import { ProfileIncompleteAlert } from "@/components/profile/profile-incomplete-alert"
import { getAuthUserCount } from "@/app/actions/get-user-count"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, full_name")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
    : profile?.full_name
      ? profile.full_name
      : user.email
          ?.split("@")[0]
          ?.split(/[._-]/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ") || "User"

  const { data: fullProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const profileStatus = checkProfileCompleteness(fullProfile)

  let stats = {
    posterCount: 0,
    orderCount: 0,
    pendingPayments: 0,
    activeCart: 0,
    webinarCount: 0,
    eventCount: 0,
    hotelBookingCount: 0,
    upcomingEvents: [] as Array<{ title: string; date: string; type: string }>,
  }

  if (!isAdmin) {
    // User statistics
    const [postersResult, ordersResult, cartResult] = await Promise.all([
      supabase.from("abstracts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("carts").select("*, cart_items(id)").eq("user_id", user.id).eq("status", "active").maybeSingle(),
    ])

    // Count pending payments
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        order_payments(payment_status)
      `)
      .eq("user_id", user.id)

    const pendingCount =
      orders?.filter((order) => {
        const payment = order.order_payments?.[0]
        return !payment || payment.payment_status === "pending"
      }).length || 0

    // Get webinar count
    const { data: webinarOrders } = await supabase
      .from("orders")
      .select(`
        id,
        order_items!inner(item_type),
        order_payments(payment_status)
      `)
      .eq("user_id", user.id)
      .eq("order_items.item_type", "webinar")

    const approvedWebinarCount =
      webinarOrders?.filter((order: any) => {
        const payment = order.order_payments?.[0]
        return payment?.payment_status === "verified"
      }).length || 0

    // Get event registrations count
    const { data: eventOrders } = await supabase
      .from("orders")
      .select(`
        id,
        order_items(item_type, event_label),
        order_payments(payment_status)
      `)
      .eq("user_id", user.id)
      .in("order_items.item_type", ["event", "workshop", "symposium"])

    const approvedEventCount =
      eventOrders?.filter((order: any) => {
        const payment = order.order_payments?.[0]
        return payment?.payment_status === "verified"
      }).length || 0

    // Get hotel bookings count
    const { data: hotelOrders } = await supabase
      .from("orders")
      .select(`
        id,
        order_items(hotel_room_type),
        order_payments(payment_status)
      `)
      .eq("user_id", user.id)
      .not("order_items.hotel_room_type", "is", null)

    const hotelBookingCount =
      hotelOrders?.filter((order: any) => {
        const payment = order.order_payments?.[0]
        return payment?.payment_status === "verified"
      }).length || 0

    // Get upcoming events for user
    const { data: upcomingEventData } = await supabase
      .from("orders")
      .select(`
        id,
        order_items(item_type, event_label, check_in_date),
        order_payments(payment_status)
      `)
      .eq("user_id", user.id)
      .limit(5)

    const upcomingEvents: Array<{ title: string; date: string; type: string }> = []
    upcomingEventData?.forEach((order: any) => {
      const payment = order.order_payments?.[0]
      if (payment?.payment_status === "verified") {
        order.order_items?.forEach((item: any) => {
          if (item.event_label) {
            upcomingEvents.push({
              title: item.event_label,
              date: item.check_in_date || "April 16-18, 2026",
              type: item.item_type,
            })
          }
        })
      }
    })

    stats = {
      posterCount: postersResult.count || 0,
      orderCount: ordersResult.count || 0,
      pendingPayments: pendingCount,
      activeCart: cartResult?.cart_items?.length || 0,
      webinarCount: approvedWebinarCount,
      eventCount: approvedEventCount,
      hotelBookingCount: hotelBookingCount,
      upcomingEvents: upcomingEvents.slice(0, 3),
    }
  }

  let adminStats = {
    totalUsers: 0,
    totalPosters: 0,
    pendingPosters: 0,
    pendingPayments: 0,
    totalOrders: 0,
    totalRevenue: 0,
    verifiedPayments: 0,
    totalEvents: 0,
    totalWebinars: 0,
    hotelBookings: 0,
    confirmedAttendees: 0,
  }

  if (isAdmin) {
    const authUserCountResult = await getAuthUserCount()
    
    // Use admin client for abstracts queries to bypass RLS
    const adminClient = createAdminClient()

    const [
      postersResult,
      pendingPostersResult,
      paymentsResult,
      ordersResult,
      verifiedPaymentsResult,
      eventsResult,
      hotelBookingsResult,
    ] = await Promise.all([
      adminClient.from("abstracts").select("id", { count: "exact", head: true }),
      adminClient.from("abstracts").select("id", { count: "exact", head: true }).eq("submission_status", "pending"),
      supabase.from("order_payments").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("order_payments").select("id, amount", { count: "exact" }).eq("payment_status", "verified"),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .in("hotel_room_type", ["deluxe", "premier"]),
    ])

    // Calculate total revenue
    const totalRevenue = verifiedPaymentsResult.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

    // Get confirmed attendees (verified payments)
    const { count: confirmedAttendeesCount } = await supabase
      .from("order_payments")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "verified")

    adminStats = {
      totalUsers: authUserCountResult.count || 0,
      totalPosters: postersResult.count || 0,
      pendingPosters: pendingPostersResult.count || 0,
      pendingPayments: paymentsResult.count || 0,
      totalOrders: ordersResult.count || 0,
      totalRevenue: totalRevenue,
      verifiedPayments: verifiedPaymentsResult.count || 0,
      totalEvents: eventsResult.count || 0,
      totalWebinars: 0,
      hotelBookings: hotelBookingsResult.count || 0,
      confirmedAttendees: confirmedAttendeesCount || 0,
    }
  }

  const userCards = [
    {
      title: "My Profile",
      description: "View and update your personal information",
      icon: User,
      href: "/profile",
      color: "bg-blue-500",
      stats: null,
    },
    {
      title: "My Events",
      description: "View your registered events and workshops",
      icon: CalendarDays,
      href: "/my-events",
      color: "bg-teal-500",
      stats: stats.eventCount > 0 ? `${stats.eventCount} registration${stats.eventCount !== 1 ? "s" : ""}` : null,
      badge: stats.eventCount > 0 ? { text: "Registered", variant: "default" as const } : null,
    },
    {
      title: "My Hotel Bookings",
      description: "Manage your hotel reservations",
      icon: Hotel,
      href: "/my-hotel-bookings",
      color: "bg-amber-500",
      stats:
        stats.hotelBookingCount > 0
          ? `${stats.hotelBookingCount} booking${stats.hotelBookingCount !== 1 ? "s" : ""}`
          : null,
      badge: stats.hotelBookingCount > 0 ? { text: "Booked", variant: "default" as const } : null,
    },
    {
      title: "My Webinars",
      description: "Access your purchased webinars",
      icon: Video,
      href: "/my-webinars",
      color: "bg-indigo-500",
      stats: stats.webinarCount > 0 ? `${stats.webinarCount} webinar${stats.webinarCount !== 1 ? "s" : ""}` : null,
      badge: stats.webinarCount > 0 ? { text: "Active", variant: "default" as const } : null,
    },
    {
      title: "My E-Posters",
      description: "Manage your poster submissions",
      icon: FileText,
      href: "/my-posters",
      color: "bg-purple-500",
      stats: stats.posterCount > 0 ? `${stats.posterCount} submission${stats.posterCount !== 1 ? "s" : ""}` : null,
    },
    {
      title: "My Purchases",
      description: "View orders and payment status",
      icon: ShoppingBag,
      href: "/my-purchases",
      color: "bg-green-500",
      stats: stats.orderCount > 0 ? `${stats.orderCount} order${stats.orderCount !== 1 ? "s" : ""}` : null,
      badge:
        stats.pendingPayments > 0 ? { text: `${stats.pendingPayments} pending`, variant: "secondary" as const } : null,
    },
    {
      title: "Shopping Cart",
      description: "Review items before checkout",
      icon: ShoppingCart,
      href: "/cart",
      color: "bg-cyan-500",
      stats: stats.activeCart > 0 ? `${stats.activeCart} item${stats.activeCart !== 1 ? "s" : ""}` : null,
    },
  ]

  const adminCards = [
    {
      title: "User Management",
      description: "View and manage user roles",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500",
      stats: `${adminStats.totalUsers} users`,
    },
    {
      title: "Confirmed Attendees",
      description: "View all confirmed registrations",
      icon: UserCheck,
      href: "/admin/confirmed-attendees",
      color: "bg-green-500",
      stats: `${adminStats.confirmedAttendees} confirmed`,
    },
    {
      title: "Payment Validation",
      description: "Review and approve payments",
      icon: CreditCard,
      href: "/admin/payment-validation",
      color: "bg-emerald-500",
      stats: `${adminStats.totalOrders} orders`,
      badge:
        adminStats.pendingPayments > 0
          ? { text: `${adminStats.pendingPayments} pending`, variant: "destructive" as const }
          : null,
    },
    {
      title: "Invoices",
      description: "Manage and generate invoices",
      icon: Receipt,
      href: "/admin/invoices",
      color: "bg-slate-500",
      stats: `${adminStats.verifiedPayments} issued`,
    },
    {
      title: "E-Poster Submissions",
      description: "Review poster submissions",
      icon: Presentation,
      href: "/admin/posters",
      color: "bg-purple-500",
      stats: `${adminStats.totalPosters} total`,
      badge:
        adminStats.pendingPosters > 0
          ? { text: `${adminStats.pendingPosters} pending`, variant: "secondary" as const }
          : null,
    },
    {
      title: "Events Dashboard",
      description: "View all events and monitor registrations",
      icon: BarChart3,
      href: "/admin/events",
      color: "bg-teal-500",
      stats: `${adminStats.totalEvents} events`,
    },
    {
      title: "Event CMS",
      description: "Manage events and workshops",
      icon: Calendar,
      href: "/admin/event-cms",
      color: "bg-orange-500",
      stats: `${adminStats.totalEvents} events`,
    },
    {
      title: "Webinar CMS",
      description: "Manage webinar content",
      icon: Video,
      href: "/admin/webinar-cms",
      color: "bg-indigo-500",
      stats: null,
    },
    {
      title: "Webinar Access",
      description: "Grant symposium webinar access",
      icon: Ticket,
      href: "/admin/symposium-webinar-access",
      color: "bg-pink-500",
      stats: null,
    },
    {
      title: "Hotel Management",
      description: "Manage room bookings and inventory",
      icon: Building,
      href: "/admin/hotel-management",
      color: "bg-amber-500",
      stats: `${adminStats.hotelBookings} bookings`,
    },
    {
      title: "Room Availability",
      description: "Configure room capacity settings",
      icon: Hotel,
      href: "/admin/room-availability",
      color: "bg-cyan-500",
      stats: null,
    },
    {
      title: "Cart Management",
      description: "View all shopping carts",
      icon: ShoppingCart,
      href: "/admin/carts",
      color: "bg-rose-500",
      stats: null,
    },
  ]

  const cards = isAdmin ? adminCards : userCards

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-muted/30">
        {/* Header Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2 text-balance">
                  Welcome back, {displayName}!
                </h1>
                <p className="text-lg text-muted-foreground">
                  {isAdmin ? "Admin Dashboard - Manage the conference" : "Your ISAPM 2026 conference hub"}
                </p>
              </div>
              {!isAdmin && (
                <div className="flex flex-wrap gap-3">
                  <Link href="/pricing">
                    <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white">
                      Browse Events
                    </Button>
                  </Link>
                  <Link href="/webinar">
                    <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white">
                      Browse Webinars
                    </Button>
                  </Link>
                  <Link href="/submit-poster">
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white">
                      Submit Poster
                    </Button>
                  </Link>
                  <Link href="/hotel-booking">
                    <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      Book a Hotel
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {isAdmin && (
          <section className="py-6 px-4 border-b bg-background">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-xl font-bold">{formatCurrency(adminStats.totalRevenue)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Confirmed Attendees</p>
                        <p className="text-xl font-bold">{adminStats.confirmedAttendees}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Payments</p>
                        <p className="text-xl font-bold">{adminStats.pendingPayments}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileCheck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Posters</p>
                        <p className="text-xl font-bold">{adminStats.pendingPosters}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Profile Incomplete Alert */}
        {!isAdmin && !profileStatus.isComplete && (
          <section className="py-6 px-4">
            <div className="max-w-7xl mx-auto">
              <ProfileIncompleteAlert
                missingFields={profileStatus.missingFields}
                completionPercentage={profileStatus.completionPercentage}
                variant="destructive"
                showButton={true}
              />
            </div>
          </section>
        )}

        {!isAdmin && (
          <section className="py-6 px-4 border-b bg-background">
            <div className="max-w-7xl mx-auto">
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Stats Summary */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Your Registration Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <CalendarDays className="w-8 h-8 text-teal-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.eventCount}</p>
                          <p className="text-xs text-muted-foreground">Events</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Video className="w-8 h-8 text-indigo-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.webinarCount}</p>
                          <p className="text-xs text-muted-foreground">Webinars</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Hotel className="w-8 h-8 text-amber-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.hotelBookingCount}</p>
                          <p className="text-xs text-muted-foreground">Hotel Bookings</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <FileText className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.posterCount}</p>
                          <p className="text-xs text-muted-foreground">E-Posters</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Events Widget */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.upcomingEvents.length > 0 ? (
                      <div className="space-y-3">
                        {stats.upcomingEvents.map((event, index) => (
                          <div key={index} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                            <div className="w-2 h-2 mt-2 rounded-full bg-teal-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">{event.date}</p>
                            </div>
                          </div>
                        ))}
                        <Link href="/my-events">
                          <Button variant="ghost" size="sm" className="w-full mt-2">
                            View all events
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No registered events yet</p>
                        <Link href="/pricing">
                          <Button variant="link" size="sm">
                            Browse events
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions Grid */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Quick Actions</h2>
              <p className="text-muted-foreground">
                {isAdmin ? "Manage conference operations" : "Access your frequently used features"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((card) => {
                const Icon = card.icon
                return (
                  <Link key={card.href} href={card.href}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group border hover:border-primary/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          {card.badge && (
                            <Badge variant={card.badge.variant} className="shrink-0 text-xs">
                              {card.badge.text}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="text-sm">{card.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {card.stats && (
                          <div className="text-sm font-medium text-muted-foreground mb-2">{card.stats}</div>
                        )}
                        <div className="flex items-center text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
                          View details
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Help Section for Users */}
        {!isAdmin && (
          <section className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                  <CardDescription>Explore more conference resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                    <Link href="/events">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Calendar className="w-4 h-4 mr-2" />
                        Browse Events
                      </Button>
                    </Link>
                    <Link href="/webinar">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Video className="w-4 h-4 mr-2" />
                        Webinars
                      </Button>
                    </Link>
                    <Link href="/hotel-booking">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Hotel className="w-4 h-4 mr-2" />
                        Hotel Booking
                      </Button>
                    </Link>
                    <Link href="/venue">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Building className="w-4 h-4 mr-2" />
                        Venue Info
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
