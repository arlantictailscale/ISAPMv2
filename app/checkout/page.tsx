import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { calculateCartTotal, formatCurrency } from "@/lib/cart/utils"
import { CheckoutForm } from "./checkout-form"
import { checkProfileCompleteness } from "@/lib/profile/validation"
import { ProfileIncompleteAlert } from "@/components/profile/profile-incomplete-alert"
import { getBadgeColors, getCategoryLabel } from "@/lib/badge-colors"
import { Gift } from "lucide-react"

export default async function CheckoutPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?redirect=/checkout")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const profileStatus = checkProfileCompleteness(profile)

  // Get active cart with items
  const { data: cart } = await supabase
    .from("carts")
    .select("*, cart_items(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  const items = cart?.cart_items || []

  // Check if user just came from a successful checkout by looking for recent orders
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  const hasRecentOrder =
    recentOrders &&
    recentOrders.length > 0 &&
    new Date().getTime() - new Date(recentOrders[0].created_at).getTime() < 5000 // Within last 5 seconds

  // Only redirect if cart is empty AND no recent order
  if (items.length === 0 && !hasRecentOrder) {
    redirect("/cart")
  }

  const cartSummary = calculateCartTotal(items)

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-muted/30 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Review your order and complete your purchase</p>
          </div>

          {!profileStatus.isComplete && (
            <div className="mb-6">
              <ProfileIncompleteAlert
                missingFields={profileStatus.missingFields}
                completionPercentage={profileStatus.completionPercentage}
              />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>We'll use this information for your order confirmation</CardDescription>
                </CardHeader>
                <CardContent>
                  <CheckoutForm
                    defaultValues={{
                      full_name:
                        profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
                      email: user.email || "",
                      phone: profile?.phone || "",
                      institution: profile?.institution || "",
                      position: profile?.position || "",
                    }}
                    profileComplete={profileStatus.isComplete}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="text-sm">
                        {item.item_type === "event" && (
                          <>
                            <div
                              className={`text-xs font-semibold mb-0.5 px-2 py-0.5 rounded w-fit ${getBadgeColors("event", item.event_label, item.event_id).solid}`}
                            >
                              {getCategoryLabel("event", item.event_label, item.event_id)}
                            </div>
                            <div className="font-medium">{item.event_label}</div>
                            <div className="text-xs text-muted-foreground">{item.participant_type_label}</div>
                            {item.event_id === "symposium" && (
                              <div className="flex items-center gap-1 mt-1 text-teal-600">
                                <Gift className="w-3 h-3" />
                                <span className="text-xs font-medium">+4 Bonus Webinars Included</span>
                              </div>
                            )}
                          </>
                        )}
                        {item.item_type === "hotel" && (
                          <>
                            <div
                              className={`text-xs font-semibold mb-0.5 px-2 py-0.5 rounded w-fit ${getBadgeColors("hotel").solid}`}
                            >
                              {getBadgeColors("hotel").label}
                            </div>
                            <div className="font-medium">{item.hotel_room_type}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.nights} night{item.nights !== 1 ? "s" : ""}
                            </div>
                          </>
                        )}
                        <div className="text-muted-foreground">{formatCurrency(item.unit_price, item.currency)}</div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(cartSummary.subtotal, cartSummary.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="font-medium">{cartSummary.itemCount}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(cartSummary.subtotal, cartSummary.currency)}</span>
                  </div>

                  <p className="text-xs text-center text-muted-foreground pt-2">
                    By placing this order, you agree to our terms and conditions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
