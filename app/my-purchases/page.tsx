import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, CheckCircle, XCircle, Clock, Package, Upload, AlertCircle } from "lucide-react"
import Link from "next/link"
import { CancelOrderButton } from "@/components/cancel-order-button"

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
      order_items (*),
      order_payments (
        id,
        payment_status,
        payment_proof_url,
        rejection_reason,
        verified_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error loading purchases:", error.message)
  }

  if (orders) {
    orders.forEach((order) => {
      console.log("[v0] Order ID:", order.id.slice(0, 8))
      console.log("[v0] Order payments array:", order.order_payments)
      console.log("[v0] First payment:", order.order_payments?.[0])
      console.log("[v0] Payment status:", order.order_payments?.[0]?.payment_status)
    })
  }

  const getEventType = (eventId: string, eventLabel: string): string => {
    const lowerLabel = eventLabel?.toLowerCase() || ""
    const lowerId = eventId?.toLowerCase() || ""

    if (lowerLabel.startsWith("ws ") || lowerLabel.includes("workshop") || lowerId.includes("workshop")) {
      return "WORKSHOP"
    }

    if (lowerLabel.includes("symposium") || lowerId.includes("symposium")) {
      return "SYMPOSIUM"
    }

    return "CPD COURSE"
  }

  const getItemTypeBadgeColor = (itemType: string): string => {
    switch (itemType) {
      case "WORKSHOP":
        return "bg-cyan-500 text-white"
      case "SYMPOSIUM":
        return "bg-purple-500 text-white"
      case "HOTEL":
        return "bg-orange-500 text-white"
      case "CPD COURSE":
        return "bg-blue-500 text-white"
      default:
        return "bg-primary text-primary-foreground"
    }
  }

  const getPaymentStatusBadge = (order: any) => {
    const payment = order.order_payments?.[0]

    if (!payment) {
      // No payment record yet - needs to submit proof
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit max-w-full whitespace-nowrap shrink-0">
          <Upload className="w-3 h-3 shrink-0" />
          <span className="text-xs sm:text-sm">Awaiting Payment Proof</span>
        </Badge>
      )
    }

    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Waiting Verification Payment", variant: "default", icon: Clock },
      verified: { label: "Payment Approved", variant: "default", icon: CheckCircle },
      rejected: { label: "Payment Rejected", variant: "destructive", icon: XCircle },
    }

    const config = statusConfig[payment.payment_status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge
        variant={config.variant}
        className={`flex items-center gap-1 w-fit max-w-full whitespace-nowrap shrink-0 ${
          payment.payment_status === "verified" ? "bg-green-500 hover:bg-green-600" : ""
        } ${payment.payment_status === "pending" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
      >
        <Icon className="w-3 h-3 shrink-0" />
        <span className="text-xs sm:text-sm">{config.label}</span>
      </Badge>
    )
  }

  const getActionButton = (order: any) => {
    const payment = order.order_payments?.[0]

    if (!payment) {
      return {
        text: "Submit Payment Proof",
        variant: "default" as const,
        icon: Upload,
      }
    }

    if (payment.payment_status === "pending") {
      return {
        text: "View Payment Status",
        variant: "outline" as const,
        icon: Clock,
      }
    }

    if (payment.payment_status === "verified") {
      return {
        text: "View Order Details",
        variant: "outline" as const,
        icon: CheckCircle,
      }
    }

    if (payment.payment_status === "rejected") {
      return {
        text: "Resubmit Payment Proof",
        variant: "default" as const,
        icon: AlertCircle,
      }
    }

    return {
      text: "Submit Payment Proof",
      variant: "default" as const,
      icon: Upload,
    }
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
                  if (order.status === "cancelled") {
                    return null
                  }

                  const totalItems = order.order_items?.length || 0
                  const hasHotelItems = order.order_items?.some((item: any) => item.item_type === "hotel")
                  const hasEventItems = order.order_items?.some((item: any) => item.item_type === "event")
                  const payment = order.order_payments?.[0]
                  const actionButton = getActionButton(order)
                  const ActionIcon = actionButton.icon

                  const canCancel = !payment

                  const calculatedTotal =
                    order.order_items?.reduce((sum: number, item: any) => {
                      const nights = item.nights || 1
                      return sum + (item.unit_price || 0) * nights
                    }, 0) || 0

                  return (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <Package className="w-5 h-5 shrink-0" />
                              <span className="truncate">Order #{order.id.slice(0, 8)}</span>
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
                          <div className="shrink-0">{getPaymentStatusBadge(order)}</div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {payment?.payment_status === "rejected" && payment.rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-red-900 text-sm mb-1">Payment Rejected</h4>
                                  <p className="text-sm text-red-700">{payment.rejection_reason}</p>
                                  <p className="text-xs text-red-600 mt-2">
                                    Please resubmit your payment proof with the correct information.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {payment?.payment_status === "pending" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <div className="flex gap-2">
                                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-amber-900 text-sm mb-1">Payment Under Review</h4>
                                  <p className="text-sm text-amber-700">
                                    Your payment proof has been submitted and is currently being verified by our admin
                                    team. This process typically takes 1-2 business days.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {payment?.payment_status === "verified" && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-green-900 text-sm mb-1">Payment Approved</h4>
                                  <p className="text-sm text-green-700">
                                    Your payment has been verified and approved on{" "}
                                    {new Date(payment.verified_at).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                    . Your registration is now confirmed!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {!payment && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex gap-2">
                                <Upload className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-blue-900 text-sm mb-1">Action Required</h4>
                                  <p className="text-sm text-blue-700">
                                    Please submit your payment proof to complete your order. Click the button below to
                                    upload your payment confirmation.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

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
                                  {order.currency} {calculatedTotal.toLocaleString("id-ID")}
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
                                        <div
                                          className={`text-xs font-semibold mb-0.5 px-2 py-0.5 rounded w-fit ${getItemTypeBadgeColor(getEventType(item.event_id || "", item.event_label || item.item_name))}`}
                                        >
                                          {getEventType(item.event_id || "", item.event_label || item.item_name)}
                                        </div>
                                        <p className="font-medium">{item.event_label || item.item_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {item.participant_type_label || "Conference Registration"}
                                        </p>
                                      </>
                                    )}
                                    {item.item_type === "hotel" && (
                                      <>
                                        <div
                                          className={`text-xs font-semibold mb-0.5 px-2 py-0.5 rounded w-fit ${getItemTypeBadgeColor("HOTEL")}`}
                                        >
                                          HOTEL
                                        </div>
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
                                      {item.currency}{" "}
                                      {item.item_type === "hotel" && item.nights
                                        ? (item.unit_price * item.nights).toLocaleString("id-ID")
                                        : item.unit_price.toLocaleString("id-ID")}
                                    </p>
                                    {item.item_type === "hotel" && item.nights && item.nights > 1 && (
                                      <p className="text-xs text-muted-foreground">
                                        {item.currency} {item.unit_price.toLocaleString("id-ID")} × {item.nights} nights
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Link href={`/payment/order/${order.id}`} className="flex-1">
                              <Button className="w-full flex items-center gap-2" variant={actionButton.variant}>
                                <ActionIcon className="w-4 h-4" />
                                {actionButton.text}
                              </Button>
                            </Link>
                            {canCancel && <CancelOrderButton orderId={order.id} />}
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
