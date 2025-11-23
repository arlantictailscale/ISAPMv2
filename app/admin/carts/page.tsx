import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/cart/utils"
import { formatDistanceToNow } from "date-fns"
import { ShoppingCart, Users, TrendingUp, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdminCartsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get all carts with items
  const { data: carts } = await supabase
    .from("carts")
    .select(`
      *,
      cart_items(*)
    `)
    .order("updated_at", { ascending: false })

  // Get all profiles for users with carts
  const userIds = carts?.map((c) => c.user_id).filter(Boolean) || []
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone").in("id", userIds)

  // Create a map of user_id to profile for easy lookup
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

  // Merge profile data into carts
  const cartsWithProfiles = carts?.map((cart) => ({
    ...cart,
    profile: profileMap.get(cart.user_id),
  }))

  const activeCarts = cartsWithProfiles?.filter((c) => c.status === "active") || []
  const checkedOutCarts = cartsWithProfiles?.filter((c) => c.status === "checked_out") || []
  const abandonedCarts = activeCarts.filter((c) => {
    const daysSinceUpdate = (Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate > 1 && (c.cart_items?.length || 0) > 0
  })

  // Calculate metrics
  const totalCartValue = activeCarts.reduce((sum, cart) => {
    const cartTotal = (cart.cart_items || []).reduce((itemSum, item) => {
      const nights = item.nights || 1
      return itemSum + (item.unit_price || 0) * nights
    }, 0)
    return sum + cartTotal
  }, 0)

  const averageCartValue = activeCarts.length > 0 ? totalCartValue / activeCarts.length : 0

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(*),
      order_payments(*)
    `)
    .order("created_at", { ascending: false })

  console.log("[v0] Found orders:", orders?.length || 0)
  console.log("[v0] Found carts:", carts?.length || 0)

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-muted/30">
        <div className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Cart & Order Management</h1>
              <p className="text-muted-foreground">Monitor shopping carts and completed orders from cart checkout</p>
            </div>

            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Carts</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeCarts.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeCarts.filter((c) => (c.cart_items?.length || 0) > 0).length} with items
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abandoned Carts</CardTitle>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{abandonedCarts.length}</div>
                  <p className="text-xs text-muted-foreground">Inactive for 1+ days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cart Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalCartValue, "IDR")}</div>
                  <p className="text-xs text-muted-foreground">In active carts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Cart</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(averageCartValue, "IDR")}</div>
                  <p className="text-xs text-muted-foreground">Per active cart</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for better navigation between sections */}
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-auto overflow-x-auto">
                <TabsTrigger
                  value="orders"
                  className="text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap px-2 sm:px-4 py-2"
                >
                  <span className="hidden sm:inline">Completed Orders ({orders?.length || 0})</span>
                  <span className="sm:hidden">Orders ({orders?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="abandoned"
                  className="text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap px-2 sm:px-4 py-2"
                >
                  <span className="hidden sm:inline">Abandoned Carts ({abandonedCarts.length})</span>
                  <span className="sm:hidden">Abandoned ({abandonedCarts.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap px-2 sm:px-4 py-2"
                >
                  <span className="hidden sm:inline">Active Carts ({activeCarts.length})</span>
                  <span className="sm:hidden">Active ({activeCarts.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="space-y-4">
                {orders && orders.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Orders (From Cart)</CardTitle>
                      <CardDescription>Orders created through the cart checkout flow</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const items = order.order_items || []
                          const payment = order.order_payments?.[0]
                          const hasPaymentProof = payment?.payment_proof_url

                          return (
                            <div key={order.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold truncate">{order.full_name}</p>
                                  <p className="text-sm text-muted-foreground truncate">{order.email}</p>
                                  {order.phone && (
                                    <p className="text-sm text-muted-foreground break-all">{order.phone}</p>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge
                                    variant={
                                      order.status === "paid"
                                        ? "default"
                                        : order.status === "pending"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                    className="shrink-0"
                                  >
                                    {order.status}
                                  </Badge>
                                  {hasPaymentProof && (
                                    <Badge variant="outline" className="text-green-600 border-green-600 shrink-0">
                                      Payment Proof
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="shrink-0 text-xs">
                                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{items.length} items</span>
                                <span className="font-bold text-primary">
                                  {formatCurrency(
                                    items.reduce((sum, item) => {
                                      const nights = item.nights || 1
                                      return sum + (item.unit_price || 0) * nights
                                    }, 0),
                                    order.currency || "IDR",
                                  )}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Items:{" "}
                                {items
                                  .map((item) =>
                                    item.item_type === "event" ? item.event_label : `Hotel: ${item.hotel_room_type}`,
                                  )
                                  .join(", ")}
                              </div>
                              {payment && (
                                <div className="text-xs text-muted-foreground pt-2 border-t">
                                  Payment Status: {payment.payment_status || "No payment proof yet"}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-muted-foreground">
                        No completed orders from cart checkout yet
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="abandoned" className="space-y-4">
                {abandonedCarts.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Abandoned Carts</CardTitle>
                      <CardDescription>Carts with items that haven't been updated in over 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {abandonedCarts.map((cart) => {
                          const items = cart.cart_items || []
                          const total = items.reduce((sum, item) => {
                            const nights = item.nights || 1
                            return sum + (item.unit_price || 0) * nights
                          }, 0)
                          const cartProfile = cart.profile

                          return (
                            <div key={cart.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold truncate">{cartProfile?.full_name || "Unknown User"}</p>
                                  {cartProfile?.phone && (
                                    <p className="text-sm text-muted-foreground break-all">{cartProfile.phone}</p>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 border-amber-600 shrink-0 w-fit text-xs"
                                >
                                  {formatDistanceToNow(new Date(cart.updated_at), { addSuffix: true })}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{items.length} items</span>
                                <span className="font-bold text-primary">{formatCurrency(total, "IDR")}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Items:{" "}
                                {items
                                  .map((item) =>
                                    item.item_type === "event" ? item.event_label : `Hotel: ${item.hotel_room_type}`,
                                  )
                                  .join(", ")}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-muted-foreground">No abandoned carts at the moment</div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Active Carts</CardTitle>
                    <CardDescription>Current shopping sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeCarts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">No active carts at the moment</div>
                    ) : (
                      <div className="space-y-4">
                        {activeCarts.map((cart) => {
                          const items = cart.cart_items || []
                          const total = items.reduce((sum, item) => {
                            const nights = item.nights || 1
                            return sum + (item.unit_price || 0) * nights
                          }, 0)
                          const cartProfile = cart.profile
                          const isEmpty = items.length === 0

                          return (
                            <div key={cart.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold truncate">{cartProfile?.full_name || "Unknown User"}</p>
                                  {cartProfile?.phone && (
                                    <p className="text-sm text-muted-foreground break-all">{cartProfile.phone}</p>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {isEmpty && (
                                    <Badge variant="secondary" className="shrink-0">
                                      Empty
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="shrink-0 text-xs">
                                    {formatDistanceToNow(new Date(cart.updated_at), { addSuffix: true })}
                                  </Badge>
                                </div>
                              </div>
                              {!isEmpty && (
                                <>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{items.length} items</span>
                                    <span className="font-bold text-primary">{formatCurrency(total, "IDR")}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Items:{" "}
                                    {items
                                      .map((item) =>
                                        item.item_type === "event"
                                          ? item.event_label
                                          : `Hotel: ${item.hotel_room_type}`,
                                      )
                                      .join(", ")}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
