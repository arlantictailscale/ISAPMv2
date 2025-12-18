"use client"

import { useRef, useState } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/cart/utils"
import { ProfileIncompleteAlert } from "@/components/profile/profile-incomplete-alert"
import { getBadgeColors, getCategoryLabel } from "@/lib/badge-colors"
import { Gift, Loader2, Lock, ShoppingBag } from "lucide-react"
import { CheckoutForm, type CheckoutFormHandle } from "./checkout-form"

interface CheckoutPageClientProps {
  profileStatus: {
    isComplete: boolean
    missingFields: string[]
    completionPercentage: number
  }
  profile: any
  userEmail: string
  items: any[]
  cartSummary: {
    subtotal: number
    itemCount: number
    currency: string
  }
}

export function CheckoutPageClient({ profileStatus, profile, userEmail, items, cartSummary }: CheckoutPageClientProps) {
  const formRef = useRef<CheckoutFormHandle>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePlaceOrder = async () => {
    if (formRef.current) {
      setIsSubmitting(true)
      await formRef.current.submit()
      // Reset after a delay in case of error
      setTimeout(() => setIsSubmitting(false), 2000)
    }
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-muted/30 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>We'll use this information for your order confirmation</CardDescription>
              </CardHeader>
              <CardContent>
                <CheckoutForm
                  ref={formRef}
                  defaultValues={{
                    full_name: profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
                    email: userEmail,
                    phone: profile?.phone || "",
                    institution: profile?.institution || "",
                    position: profile?.position || "",
                  }}
                  profileComplete={profileStatus.isComplete}
                />
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>
                  {cartSummary.itemCount} item{cartSummary.itemCount !== 1 ? "s" : ""} in your order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        {item.item_type === "event" && (
                          <>
                            <div
                              className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${getBadgeColors("event", item.event_label, item.event_id).solid}`}
                            >
                              {getCategoryLabel("event", item.event_label, item.event_id)}
                            </div>
                            <div className="font-medium">{item.event_label}</div>
                            <div className="text-sm text-muted-foreground">{item.participant_type_label}</div>
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
                              className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${getBadgeColors("hotel").solid}`}
                            >
                              {getBadgeColors("hotel").label}
                            </div>
                            <div className="font-medium">{item.hotel_room_type}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.nights} night{item.nights !== 1 ? "s" : ""}
                            </div>
                          </>
                        )}
                        {item.item_type === "webinar" && (
                          <>
                            <div
                              className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${getBadgeColors("webinar").solid}`}
                            >
                              {getBadgeColors("webinar").label}
                            </div>
                            <div className="font-medium">{item.event_label}</div>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(item.unit_price, item.currency)}</div>
                      </div>
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

                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(cartSummary.subtotal, cartSummary.currency)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-semibold"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || !profileStatus.isComplete}
                >
                  {!profileStatus.isComplete ? (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Complete Profile to Continue
                    </>
                  ) : isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    <>Place Order - {formatCurrency(cartSummary.subtotal, cartSummary.currency)}</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
