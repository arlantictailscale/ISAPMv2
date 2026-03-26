import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, CheckCircle, XCircle, Clock, Package, Upload, AlertCircle, Gift, Video } from "lucide-react"
import Link from "next/link"
import { CancelOrderButton } from "@/components/cancel-order-button"
import { getBadgeColors, getCategoryLabel } from "@/lib/badge-colors"
import { DownloadInvoiceButton } from "@/components/download-invoice-button"

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
        verified_at,
        payment_method,
        sponsor_name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error loading purchases:", error.message)
  }

  if (orders) {
    console.log("[v0] Total orders loaded:", orders.length)
    orders.forEach((order) => {
      console.log(
        "[v0] Order:",
        order.id.slice(0, 8),
        "Status:",
        order.status,
        "Payments:",
        order.order_payments?.length || 0,
      )
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

  const getPaymentStatusBadge = (order: any) => {
    const payment = order.order_payments?.[0]

    // Check if order is cancelled first
    if (order.status === "cancelled") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit max-w-full whitespace-nowrap shrink-0 bg-gray-500 text-white hover:bg-gray-600">
          <XCircle className="w-3 h-3 shrink-0" />
          <span className="text-xs sm:text-sm">Order Cancelled</span>
        </Badge>
      )
    }

    if (!payment) {
      // No payment record yet - needs to submit proof
      return (
        <Badge variant="secondary" className="flex items-center gap-1 w-fit max-w-full whitespace-nowrap shrink-0">
          <Upload className="w-3 h-3 shrink-0" />
          <span className="text-xs sm:text-sm">Awaiting Payment Proof</span>
        </Badge>
      )
    }

    const isSponsored = payment.payment_method?.toLowerCase() === "sponsored"

    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: {
        label: isSponsored ? "Waiting Verification" : "Waiting Verification Payment",
        variant: "default",
        icon: Clock,
      },
      verified: {
        label: isSponsored ? "Registration Confirmed" : "Payment Approved",
        variant: "default",
        icon: CheckCircle,
      },
      rejected: {
        label: isSponsored ? "Registration Rejected" : "Payment Rejected",
        variant: "destructive",
        icon: XCircle,
      },
    }

    const config = statusConfig[payment.payment_status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge
        variant={config.variant}
        className={`flex items-center gap-1 w-fit max-w-full whitespace-nowrap shrink-0 ${
          payment.payment_status === "verified"
            ? isSponsored
              ? "bg-purple-500 hover:bg-purple-600"
              : "bg-green-500 hover:bg-green-600"
            : ""
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
                  const totalItems = order.order_items?.length || 0
                  const hasHotelItems = order.order_items?.some((item: any) => item.item_type === "hotel")
                  const hasEventItems = order.order_items?.some((item: any) => item.item_type === "event")
                  const hasWebinarItems = order.order_items?.some((item: any) => item.item_type === "webinar")
                  const payment = order.order_payments?.[0]
                  const actionButton = getActionButton(order)
                  const ActionIcon = actionButton.icon

                  const canCancel = !payment
                  const canDownloadInvoice = payment?.payment_status === "verified"

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
                            <div
                              className={`${
                                payment.payment_method?.toLowerCase() === "sponsored"
                                  ? "bg-purple-50 border-purple-200"
                                  : "bg-green-50 border-green-200"
                              } border rounded-lg p-4`}
                            >
                              <div className="flex gap-2">
                                <CheckCircle
                                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                    payment.payment_method?.toLowerCase() === "sponsored"
                                      ? "text-purple-600"
                                      : "text-green-600"
                                  }`}
                                />
                                <div>
                                  <h4
                                    className={`font-semibold text-sm mb-1 ${
                                      payment.payment_method?.toLowerCase() === "sponsored"
                                        ? "text-purple-900"
                                        : "text-green-900"
                                    }`}
                                  >
                                    {payment.payment_method?.toLowerCase() === "sponsored"
                                      ? "Registration Confirmed"
                                      : "Payment Approved"}
                                  </h4>
                                  <p
                                    className={`text-sm ${
                                      payment.payment_method?.toLowerCase() === "sponsored"
                                        ? "text-purple-700"
                                        : "text-green-700"
                                    }`}
                                  >
                                    {payment.payment_method?.toLowerCase() === "sponsored"
                                      ? `Your sponsored registration has been verified and confirmed on ${new Date(
                                          payment.verified_at,
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}. Your registration is now complete!`
                                      : `Your payment has been verified and approved on ${new Date(
                                          payment.verified_at,
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}. Your registration is now confirmed!`}
                                  </p>
                                  {payment.payment_method?.toLowerCase() === "sponsored" && payment.sponsor_name && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-purple-700">
                                      <Gift className="w-4 h-4" />
                                      <span>
                                        Sponsored by: <strong>{payment.sponsor_name}</strong>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Cancelled order notice */}
                          {order.status === "cancelled" && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex gap-2">
                                <XCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Order Cancelled</h4>
                                  <p className="text-sm text-gray-700">
                                    This order has been cancelled. If you believe this was a mistake, please contact support or place a new order.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {!payment && order.status !== "cancelled" && (
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
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Items:</span>
                                <span className="font-medium">
                                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">
                                  {hasWebinarItems && !hasEventItems && !hasHotelItems && "Webinar Registration"}
                                  {hasEventItems && hasHotelItems && !hasWebinarItems && "Event + Hotel"}
                                  {hasEventItems && !hasHotelItems && !hasWebinarItems && "Event Registration"}
                                  {!hasEventItems && hasHotelItems && !hasWebinarItems && "Hotel Booking"}
                                  {hasWebinarItems && hasEventItems && "Webinar + Event"}
                                  {hasWebinarItems && hasHotelItems && !hasEventItems && "Webinar + Hotel"}
                                  {hasWebinarItems && hasEventItems && hasHotelItems && "Webinar + Event + Hotel"}
                                </span>
                              </div>
                              {payment && (
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Payment:</span>
                                  <span className="font-medium">
                                    {payment.payment_method === "sponsored" ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-purple-100 text-purple-700 border-purple-200"
                                      >
                                        <Gift className="w-3 h-3 mr-1" />
                                        Sponsored
                                      </Badge>
                                    ) : (
                                      "Bank Transfer"
                                    )}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total:</span>
                                <span className="font-bold text-primary">
                                  {order.currency} {calculatedTotal.toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              {order.order_items?.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-center text-sm bg-muted/50 p-3 rounded-lg"
                                >
                                  <div>
                                    {item.item_type === "event" && (
                                      <>
                                        <div
                                          className={`text-xs font-semibold mb-0.5 px-2 py-0.5 rounded w-fit ${
                                            getBadgeColors("event", item.event_label, item.event_id).solid
                                          }`}
                                        >
                                          {getCategoryLabel("event", item.event_label, item.event_id)}
                                        </div>
                                        <p className="font-medium">{item.event_label || item.item_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {item.participant_type_label || "Conference Registration"}
                                        </p>
                                        {item.event_label?.toLowerCase().includes("symposium") && (
                                          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                            <Gift className="w-3 h-3" />
                                            +4 Bonus Webinars Included
                                          </p>
                                        )}
                                      </>
                                    )}
                                    {item.item_type === "hotel" && (
                                      <>
                                        <div
                                          className={`text-xs font-semibold mb-0.5 px-2 py-0.5 rounded w-fit ${
                                            getBadgeColors("hotel").solid
                                          }`}
                                        >
                                          {getBadgeColors("hotel").label}
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
                                        {item.extra_beds > 0 && (
                                          <p className="text-xs text-amber-600 font-medium mt-1">
                                            +{item.extra_beds} Extra Bed{item.extra_beds > 1 ? "s" : ""} (incl.
                                            breakfast)
                                          </p>
                                        )}
                                      </>
                                    )}
                                    {item.item_type === "webinar" && (
                                      <>
                                        <div
                                          className={`text-xs font-semibold mb-0.5 px-2 py-0.5 rounded w-fit ${
                                            getBadgeColors("webinar").solid
                                          }`}
                                        >
                                          <span className="flex items-center gap-1">
                                            <Video className="w-3 h-3" />
                                            {getBadgeColors("webinar").label}
                                          </span>
                                        </div>
                                        <p className="font-medium">
                                          {item.event_label || item.item_name || "Online Webinar"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          Friday, January 30, 2026, 13:00 WIB
                                        </p>
                                      </>
                                    )}
                                    {item.item_type === "gift" && (
                                      <>
                                        <div
                                          className={`text-xs font-semibold mb-0.5 px-2 py-0.5 rounded w-fit ${
                                            getBadgeColors("gift").solid
                                          }`}
                                        >
                                          {getBadgeColors("gift").label}
                                        </div>
                                        <p className="font-medium">{item.gift_label || item.item_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {item.gift_message || "No message provided"}
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

                          {/* Action buttons - only show for non-cancelled orders */}
                          {order.status !== "cancelled" && (
                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                              <Link href={`/payment/order/${order.id}`} className="flex-1">
                                <Button className="w-full flex items-center gap-2" variant={actionButton.variant}>
                                  <ActionIcon className="w-4 h-4" />
                                  {actionButton.text}
                                </Button>
                              </Link>
                              {canDownloadInvoice && (
                                <DownloadInvoiceButton
                                  orderId={order.id}
                                  variant="outline"
                                  className="shrink-0"
                                  isSponsored={payment?.payment_method?.toLowerCase() === "sponsored"}
                                />
                              )}
                              {canCancel && (
                                <div className="shrink-0">
                                  <CancelOrderButton orderId={order.id} />
                                </div>
                              )}
                            </div>
                          )}
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
