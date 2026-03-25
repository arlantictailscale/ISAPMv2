import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { calculateCartTotal } from "@/lib/cart/utils"
import { checkProfileCompleteness } from "@/lib/profile/validation"
import { CartPageClient } from "./cart-page-client"

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
    <>
      <Navigation />
      <div className="min-h-screen bg-muted/30 py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Shopping Cart</h1>
            <p className="text-muted-foreground">Review your items before checkout</p>
          </div>

          <CartPageClient 
            items={items} 
            cartSummary={cartSummary} 
            profileStatus={profileStatus} 
          />
        </div>
      </div>
      <Footer />
    </>
  )
}
