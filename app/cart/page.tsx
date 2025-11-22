import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CartItemCard } from "@/components/cart/cart-item-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { calculateCartTotal, formatCurrency } from "@/lib/cart/utils"
import { ShoppingBag, ArrowRight, Lock } from "lucide-react"
import Link from "next/link"
import { checkProfileCompleteness } from "@/lib/profile/validation"
import { ProfileIncompleteAlert } from "@/components/profile/profile-incomplete-alert"

export default async function CartPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?redirect=/cart")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const profileStatus = checkProfileCompleteness(profile)

  // Get active cart with items
  const { data: cart } = await supabase
    .from("carts")
    .select("*, cart_items(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  const items = cart?.cart_items || []
  const cartSummary = calculateCartTotal(items)

  return (
    <div className="min-h-screen bg-muted/30 py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">Review your items before checkout</p>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
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
        ) : (
          /* Cart with Items */
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

                  {profileStatus.isComplete ? (
                    <Link href="/checkout" className="block">
                      <Button size="lg" className="w-full">
                        Proceed to Checkout
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/profile" className="block">
                      <Button size="lg" variant="destructive" className="w-full flex items-center justify-center gap-2">
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
        )}
      </div>
    </div>
  )
}
