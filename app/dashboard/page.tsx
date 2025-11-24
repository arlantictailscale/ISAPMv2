import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, FileText, ShoppingBag, Users, Presentation, Hotel, ShoppingCart, CheckCircle } from "lucide-react"
import Link from "next/link"

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
    .select("id, role, first_name, last_name")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  let stats = {
    posterCount: 0,
    orderCount: 0,
    pendingPayments: 0,
    activeCart: 0,
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

    stats = {
      posterCount: postersResult.count || 0,
      orderCount: ordersResult.count || 0,
      pendingPayments: pendingCount,
      activeCart: cartResult?.cart_items?.length || 0,
    }
  }

  // Admin statistics
  let adminStats = {
    totalUsers: 0,
    totalPosters: 0,
    pendingPosters: 0,
    pendingPayments: 0,
    totalOrders: 0,
  }

  if (isAdmin) {
    const [usersResult, postersResult, pendingPostersResult, paymentsResult, ordersResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("abstracts").select("id", { count: "exact", head: true }),
      supabase.from("abstracts").select("id", { count: "exact", head: true }).eq("submission_status", "pending"),
      supabase.from("order_payments").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
    ])

    adminStats = {
      totalUsers: usersResult.count || 0,
      totalPosters: postersResult.count || 0,
      pendingPosters: pendingPostersResult.count || 0,
      pendingPayments: paymentsResult.count || 0,
      totalOrders: ordersResult.count || 0,
    }
  }

  const userCards = [
    {
      title: "My Profile",
      description: "View and update your personal information",
      icon: User,
      href: "/profile",
      color: "from-blue-500 to-blue-600",
      stats: null,
    },
    {
      title: "My E-Posters",
      description: "Manage your poster submissions",
      icon: FileText,
      href: "/my-posters",
      color: "from-purple-500 to-purple-600",
      stats: stats.posterCount > 0 ? `${stats.posterCount} submission${stats.posterCount !== 1 ? "s" : ""}` : null,
    },
    {
      title: "My Purchases",
      description: "View orders and payment status",
      icon: ShoppingBag,
      href: "/my-purchases",
      color: "from-green-500 to-green-600",
      stats: stats.orderCount > 0 ? `${stats.orderCount} order${stats.orderCount !== 1 ? "s" : ""}` : null,
      badge:
        stats.pendingPayments > 0 ? { text: `${stats.pendingPayments} pending`, variant: "default" as const } : null,
    },
    {
      title: "Shopping Cart",
      description: "Review items before checkout",
      icon: ShoppingCart,
      href: "/cart",
      color: "from-cyan-500 to-cyan-600",
      stats: stats.activeCart > 0 ? `${stats.activeCart} item${stats.activeCart !== 1 ? "s" : ""}` : null,
    },
  ]

  const adminCards = [
    {
      title: "User Management",
      description: "View and manage user roles",
      icon: Users,
      href: "/admin/users",
      color: "from-blue-500 to-blue-600",
      stats: `${adminStats.totalUsers} users`,
    },
    {
      title: "E-Poster Submissions",
      description: "Review poster submissions",
      icon: Presentation,
      href: "/admin/posters",
      color: "from-purple-500 to-purple-600",
      stats: `${adminStats.totalPosters} total`,
      badge:
        adminStats.pendingPosters > 0
          ? { text: `${adminStats.pendingPosters} pending review`, variant: "secondary" as const }
          : null,
    },
    {
      title: "Payment Validation",
      description: "Review and approve payments",
      icon: CheckCircle,
      href: "/admin/payment-validation",
      color: "from-green-500 to-green-600",
      stats: `${adminStats.totalOrders} orders`,
      badge:
        adminStats.pendingPayments > 0
          ? { text: `${adminStats.pendingPayments} awaiting review`, variant: "default" as const }
          : null,
    },
    {
      title: "Cart Management",
      description: "View all shopping carts",
      icon: ShoppingCart,
      href: "/admin/carts",
      color: "from-orange-500 to-orange-600",
      stats: null,
    },
    {
      title: "Room Availability",
      description: "Manage hotel room capacity",
      icon: Hotel,
      href: "/admin/room-availability",
      color: "from-cyan-500 to-cyan-600",
      stats: null,
    },
  ]

  const cards = isAdmin ? adminCards : userCards

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-muted/30">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2 text-balance">
                  Welcome back, {profile?.first_name || "User"}!
                </h1>
                <p className="text-lg text-muted-foreground">
                  {isAdmin ? "Admin Dashboard - Manage the conference" : "Your conference hub"}
                </p>
              </div>
              {!isAdmin && (
                <div className="flex gap-3">
                  <Link href="/pricing">
                    <Button size="lg">Browse Events</Button>
                  </Link>
                  <Link href="/submit-poster">
                    <Button size="lg" variant="outline">
                      Submit Poster
                    </Button>
                  </Link>
                  <Link href="/hotel-booking">
                    <Button size="lg" variant="outline">
                      Book a Hotel
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Quick Actions</h2>
              <p className="text-muted-foreground">Access your frequently used features</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon
                return (
                  <Link key={card.href} href={card.href}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group border-2 hover:border-primary/20">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {card.badge && (
                            <Badge variant={card.badge.variant} className="shrink-0">
                              {card.badge.text}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="text-base">{card.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {card.stats && (
                          <div className="mb-3 text-sm font-medium text-muted-foreground">{card.stats}</div>
                        )}
                        <div className="flex items-center text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
                          View details
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {!isAdmin && (
          <section className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                  <CardDescription>Explore more conference resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <Link href="/program">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <FileText className="w-4 h-4 mr-2" />
                        Program
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
                        <Hotel className="w-4 h-4 mr-2" />
                        Venue Info
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Users className="w-4 h-4 mr-2" />
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
