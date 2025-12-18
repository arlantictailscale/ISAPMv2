import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { calculateCartTotal } from "@/lib/cart/utils"
import { checkProfileCompleteness } from "@/lib/profile/validation"
import { CheckoutPageClient } from "./checkout-page-client"

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
    <CheckoutPageClient
      profileStatus={profileStatus}
      profile={profile}
      userEmail={user.email || ""}
      items={items}
      cartSummary={cartSummary}
    />
  )
}
