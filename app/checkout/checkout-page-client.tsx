"use client"

import { useRef, useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/cart/utils"
import { ProfileIncompleteAlert } from "@/components/profile/profile-incomplete-alert"
import { getBadgeColors, getCategoryLabel } from "@/lib/badge-colors"
import { Bed, Coffee, Gift, Loader2, Lock, ShoppingBag, Tag } from "lucide-react"
import { CheckoutForm, type CheckoutFormHandle } from "./checkout-form"
import { PromoCodeInput } from "@/components/promo-code-input"
import type { PromoValidationResult } from "@/app/actions/promo-code"

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

// Key for localStorage - must match cart page
const PROMO_STORAGE_KEY = "isapm_applied_promo"

export function CheckoutPageClient({ profileStatus, profile, userEmail, items, cartSummary }: CheckoutPageClientProps) {
  const formRef = useRef<CheckoutFormHandle>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null)

  // Load saved promo from localStorage on mount (carried over from cart)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROMO_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.valid) {
          setAppliedPromo(parsed)
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [])

  // Save/clear promo in localStorage when changed
  const handlePromoApplied = (result: PromoValidationResult | null) => {
    setAppliedPromo(result)
    if (result && result.valid) {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(result))
    } else {
      localStorage.removeItem(PROMO_STORAGE_KEY)
    }
  }

  // Calculate final total with discount
  const totalDiscount = appliedPromo?.total_discount || 0
  const finalTotal = cartSummary.subtotal - totalDiscount

  // Prepare cart items for promo validation
  const cartItemsForPromo = items.map((item) => ({
    id: item.id,
    event_slug: item.event_id || item.item_type,
    event_type: item.item_type,
    price: item.item_type === "hotel" ? item.unit_price * (item.nights || 1) : item.unit_price,
    participant_type: item.participant_type_id, // Use participant_type_id for promo rule matching
  }))

  const handlePlaceOrder = async () => {
    if (formRef.current) {
      setIsSubmitting(true)
      await formRef.current.submit()
      // Reset after a delay in case of error
      setTimeout(() => setIsSubmitting(false), 2000)
    }
  }

  const itemsWithTotals = items.map((item) => {
    let itemTotal = 0
    if (item.item_type === "hotel") {
      itemTotal = item.unit_price * item.nights
    } else {
      itemTotal = item.unit_price
    }
    return { ...item, itemTotal }
  })

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
                  appliedPromo={appliedPromo}
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
                <div className="space-y-3">
                  {itemsWithTotals.map((item) => (
                    <div key={item.id} className="p-4 bg-muted/50 rounded-lg space-y-2 border border-muted">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          {item.item_type === "event" && (
                            <>
                              <div
                                className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${getBadgeColors("event", item.event_label, item.event_id).solid}`}
                              >
                                {getCategoryLabel("event", item.event_label, item.event_id)}
                              </div>
                              <div className="font-semibold text-base">{item.event_label}</div>
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
                              <div className="font-semibold text-base">{item.hotel_room_type}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.nights} night{item.nights !== 1 ? "s" : ""} ×{" "}
                                {formatCurrency(item.unit_price, item.currency)}/night
                              </div>
                              {item.extra_beds > 0 && (
                                <div className="flex items-center gap-2 mt-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium">
                                  <Bed className="w-3 h-3" />+{item.extra_beds} Extra Bed
                                  {item.extra_beds > 1 ? "s" : ""}
                                  <Coffee className="w-3 h-3 ml-1" />
                                  Breakfast included
                                </div>
                              )}
                            </>
                          )}
                          {item.item_type === "webinar" && (
                            <>
                              <div
                                className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${getBadgeColors("webinar").solid}`}
                              >
                                {getBadgeColors("webinar").label}
                              </div>
                              <div className="font-semibold text-base">{item.event_label}</div>
                            </>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-primary">
                            {formatCurrency(item.itemTotal, item.currency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Promo Code Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Have a promo code?</span>
                  </div>
                  <PromoCodeInput
                    cartItems={cartItemsForPromo}
                    onPromoApplied={handlePromoApplied}
                    appliedPromo={appliedPromo}
                  />
                </div>

                <Separator className="my-4" />

                <div className="bg-background rounded-lg p-4 space-y-3 border border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(cartSummary.subtotal, cartSummary.currency)}
                    </span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm font-medium">Promo Discount</span>
                      <span className="font-semibold">
                        -{formatCurrency(totalDiscount, cartSummary.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Items ({cartSummary.itemCount})</span>
                    <span className="text-sm text-muted-foreground">{cartSummary.itemCount}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-5 border-2 border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <div className="text-right">
                      {totalDiscount > 0 && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatCurrency(cartSummary.subtotal, cartSummary.currency)}
                        </div>
                      )}
                      <span className="text-3xl font-bold text-primary">
                        {formatCurrency(finalTotal, cartSummary.currency)}
                      </span>
                    </div>
                  </div>
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
                    <>Place Order - {formatCurrency(finalTotal, cartSummary.currency)}</>
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
