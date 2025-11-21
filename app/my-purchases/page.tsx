import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, CheckCircle, XCircle, Clock, Package } from "lucide-react"
import Link from "next/link"

export default async function MyPurchasesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error loading purchases:", error.message)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Pending Payment", variant: "secondary", icon: Clock },
      paid: { label: "Paid", variant: "default", icon: CheckCircle },
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

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen">
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="font-display text-4xl font-bold mb-2">My Purchases</h1>
              <p className="text-muted-foreground">View all your orders and purchase history</p>
            </div>

            {!orders || orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                  <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/pricing">
                      <Button>Browse Events</Button>
                    </Link>
                    <Link href="/hotel-booking">
                      <Button variant="outline">Book Hotel</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const totalItems = order.order_items?.length || 0
                  const hasHotelItems = order.order_items?.some((item: any) => item.item_type === "hotel")
                  const hasEventItems = order.order_items?.some((item: any) => item.item_type === "event")

                  return (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Package className="w-5 h-5" />
                              Order #{order.id.slice(0, 8)}
                            </CardTitle>
                            <CardDescription>
                              Placed on{" "}
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
                      <CardContent>
                        <div className="space-y-4">
                          {/* Order summary */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Customer:</span>
                                <span className="font-medium">{order.full_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium text-right break-all">{order.email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Phone:</span>
                                <span className="font-medium">{order.phone}</span>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Items:</span>
                                <span className="font-medium">
                                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">
                                  {hasEventItems && hasHotelItems && "Event + Hotel"}
                                  {hasEventItems && !hasHotelItems && "Event Registration"}
                                  {!hasEventItems && hasHotelItems && "Hotel Booking"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total:</span>
                                <span className="font-bold text-primary">
                                  {order.currency} {order.total_amount.toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Order items list */}
                          <div className="border-t pt-4">
                            <h4 className="font-semibold text-sm mb-3">Order Items:</h4>
                            <div className="space-y-2">
                              {order.order_items?.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded-lg"
                                >
                                  <div>
                                    {item.item_type === "event" && (
                                      <>
                                        <div className="text-xs font-semibold text-primary mb-0.5">CPD COURSE</div>
                                        <p className="font-medium">{item.event_label || item.item_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {item.participant_type_label || "Conference Registration"}
                                        </p>
                                      </>
                                    )}
                                    {item.item_type === "hotel" && (
                                      <>
                                        <div className="text-xs font-semibold text-primary mb-0.5">HOTEL</div>
                                        <p className="font-medium">{item.hotel_room_type || item.item_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {item.check_in_date && (
                                            <>
                                              {new Date(item.check_in_date).toLocaleDateString("id-ID")} -{" "}
                                              {new Date(item.check_out_date).toLocaleDateString("id-ID")} ({item.nights}{" "}
                                              night{item.nights !== 1 ? "s" : ""})
                                            </>
                                          )}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">
                                      {item.currency} {item.unit_price.toLocaleString("id-ID")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Link href={`/payment/order/${order.id}`} className="flex-1">
                              <Button className="w-full" variant={order.status === "pending" ? "default" : "outline"}>
                                {order.status === "pending" && "Complete Payment"}
                                {order.status === "paid" && "View Receipt"}
                                {order.status === "cancelled" && "View Details"}
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
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
