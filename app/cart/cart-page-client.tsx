"use client"

import { useState, useEffect } from "react"
import { CartItemCard } from "@/components/cart/cart-item-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/cart/utils"
import { ShoppingBag, ArrowRight, Lock, Tag } from "lucide-react"
import Link from "next/link"
import { ProfileIncompleteAlert } from "@/components/profile/profile-incomplete-alert"
import { PromoCodeInput } from "@/components/promo-code-input"
import type { PromoValidationResult } from "@/app/actions/promo-code"

interface CartItem {
  id: string
  item_type: string
  event_id: string | null
  event_label: string | null
  participant_type_id: string | null
  participant_type_label: string | null
  hotel_room_type: string | null
  check_in_date: string | null
  check_out_date: string | null
  nights: number | null
  unit_price: number
  currency: string
  extra_beds?: number
}

interface CartSummary {
  subtotal: number
  itemCount: number
  currency: string
}

interface ProfileStatus {
  isComplete: boolean
  missingFields: string[]
  completionPercentage: number
}

interface CartPageClientProps {
  items: CartItem[]
  cartSummary: CartSummary
  profileStatus: ProfileStatus
}

// Key for localStorage
const PROMO_STORAGE_KEY = "isapm_applied_promo"

export function CartPageClient({ items, cartSummary, profileStatus }: CartPageClientProps) {
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null)

  // Load saved promo from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROMO_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Re-validate the promo when cart changes
        if (parsed && parsed.valid) {
          setAppliedPromo(parsed)
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [])

  // Save promo to localStorage when applied
  const handlePromoApplied = (result: PromoValidationResult | null) => {
    setAppliedPromo(result)
    if (result && result.valid) {
      localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(result))
    } else {
      localStorage.removeItem(PROMO_STORAGE_KEY)
    }
  }

  // Calculate totals with discount
  const totalDiscount = appliedPromo?.total_discount || 0
  const finalTotal = cartSummary.subtotal - totalDiscount

  // Prepare cart items for promo validation
  const cartItemsForPromo = items.map((item) => ({
    id: item.id,
    event_slug: item.event_id || item.item_type,
    event_type: item.item_type,
    price: item.item_type === "hotel" ? item.unit_price * (item.nights || 1) : item.unit_price,
    participant_type: item.participant_type_id,
  }))

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add items to your cart to get started</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/pricing">
              <Button>Browse Event Registration</Button>
            </Link>
            <Link href="/hotel-booking">
              <Button variant="outline">Browse Hotels</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Items ({cartSummary.itemCount})</h2>
          <Link href="/pricing" className="text-sm text-primary hover:underline">
            Continue Shopping
          </Link>
        </div>

        {items.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1 space-y-4">
        {!profileStatus.isComplete && (
          <ProfileIncompleteAlert
            missingFields={profileStatus.missingFields}
            completionPercentage={profileStatus.completionPercentage}
            variant="destructive"
            showButton={true}
          />
        )}

        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(cartSummary.subtotal, cartSummary.currency)}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Promo Discount</span>
                  <span className="font-medium">
                    -{formatCurrency(totalDiscount, cartSummary.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">{cartSummary.itemCount}</span>
              </div>
            </div>

            <Separator />

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

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total</span>
              <div className="text-right">
                {totalDiscount > 0 && (
                  <div className="text-sm text-muted-foreground line-through">
                    {formatCurrency(cartSummary.subtotal, cartSummary.currency)}
                  </div>
                )}
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(finalTotal, cartSummary.currency)}
                </span>
              </div>
            </div>

            {profileStatus.isComplete ? (
              <Link href="/checkout" className="block">
                <Button size="lg" className="w-full">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/profile" className="block">
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Complete Profile to Checkout</span>
                </Button>
              </Link>
            )}

            <p className="text-xs text-center text-muted-foreground">You'll review your order before payment</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
