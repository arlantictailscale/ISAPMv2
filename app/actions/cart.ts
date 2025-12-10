"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CartItem } from "@/lib/cart/types"
import { isDuplicateCartItem, validateCartItem } from "@/lib/cart/utils"
import { isEventTypeSymposium, getActiveSymposiumPromotion, getBonusWebinarItems } from "@/lib/data/promotions"

/**
 * Get or create active cart for current user
 */
export async function getOrCreateCart() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Try to get existing active cart
  const { data: existingCart, error: fetchError } = await supabase
    .from("carts")
    .select("*, cart_items(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (fetchError) {
    console.error("[v0] Error fetching cart:", fetchError)
    return { error: fetchError.message }
  }

  if (existingCart) {
    return { data: existingCart }
  }

  // Create new cart
  const { data: newCart, error } = await supabase
    .from("carts")
    .insert({
      user_id: user.id,
      status: "active",
    })
    .select("*, cart_items(*)")
    .single()

  if (error) {
    console.error("[v0] Error creating cart:", error)
    return { error: error.message }
  }

  return { data: newCart }
}

/**
 * Add item to cart
 */
export async function addToCart(item: Omit<CartItem, "id" | "cart_id" | "created_at">) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Validate item
  if (!validateCartItem(item)) {
    return { error: "Invalid cart item data" }
  }

  // Get or create cart
  const cartResult = await getOrCreateCart()
  if (cartResult.error) {
    return { error: cartResult.error }
  }

  const cart = cartResult.data!

  // Check for duplicates
  const existingItems = cart.cart_items || []
  const duplicate = existingItems.find((existingItem) => isDuplicateCartItem(item, existingItem))

  if (duplicate) {
    return { error: "This item is already in your cart" }
  }

  // Insert cart item
  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      cart_id: cart.id,
      ...item,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error adding to cart:", error)
    return { error: error.message }
  }

  let bonusItemsAdded = 0
  if (isEventTypeSymposium(item.event_type)) {
    const promotion = getActiveSymposiumPromotion()
    if (promotion) {
      const bonusItems = getBonusWebinarItems(item.participant_type)

      for (const bonusItem of bonusItems) {
        // Check if bonus item is already in cart
        const bonusAlreadyInCart = existingItems.find(
          (existing) => existing.event_type === bonusItem.event_type && existing.event_label === bonusItem.event_label,
        )

        if (!bonusAlreadyInCart) {
          const { error: bonusError } = await supabase.from("cart_items").insert({
            cart_id: cart.id,
            event_type: bonusItem.event_type,
            event_label: bonusItem.event_label,
            event_name: bonusItem.event_name,
            participant_type: bonusItem.participant_type,
            participant_type_label: bonusItem.participant_type_label,
            unit_price: bonusItem.unit_price,
            currency: bonusItem.currency,
            is_bonus_item: true,
            bonus_source: bonusItem.bonus_source,
          })

          if (!bonusError) {
            bonusItemsAdded++
          }
        }
      }
    }
  }

  // Update cart timestamp
  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cart.id)

  revalidatePath("/cart")

  return {
    data,
    bonusItemsAdded,
    message:
      bonusItemsAdded > 0
        ? `Symposium added with ${bonusItemsAdded} FREE webinar${bonusItemsAdded > 1 ? "s" : ""}!`
        : undefined,
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Verify item belongs to user's cart
  const { data: item } = await supabase
    .from("cart_items")
    .select("cart_id, event_type, carts(user_id)")
    .eq("id", itemId)
    .single()

  if (!item || item.carts?.user_id !== user.id) {
    return { error: "Item not found or unauthorized" }
  }

  if (item.event_type === "symposium") {
    await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", item.cart_id)
      .eq("is_bonus_item", true)
      .eq("bonus_source", "symposium")
  }

  const { error } = await supabase.from("cart_items").delete().eq("id", itemId)

  if (error) {
    console.error("[v0] Error removing from cart:", error)
    return { error: error.message }
  }

  // Update cart timestamp
  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", item.cart_id)

  revalidatePath("/cart")
  return { success: true }
}

/**
 * Update cart item
 */
export async function updateCartItem(itemId: string, updates: Partial<CartItem>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Verify item belongs to user's cart
  const { data: item } = await supabase.from("cart_items").select("cart_id, carts(user_id)").eq("id", itemId).single()

  if (!item || item.carts?.user_id !== user.id) {
    return { error: "Item not found or unauthorized" }
  }

  const { data, error } = await supabase.from("cart_items").update(updates).eq("id", itemId).select().single()

  if (error) {
    console.error("[v0] Error updating cart item:", error)
    return { error: error.message }
  }

  // Update cart timestamp
  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", item.cart_id)

  revalidatePath("/cart")
  return { data }
}

/**
 * Clear entire cart
 */
export async function clearCart() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get active cart
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!cart) {
    return { success: true } // Nothing to clear
  }

  // Delete all cart items
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cart.id)

  if (error) {
    console.error("[v0] Error clearing cart:", error)
    return { error: error.message }
  }

  revalidatePath("/cart")
  return { success: true }
}

/**
 * Get cart item count for badge
 */
export async function getCartItemCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { data: 0 }
  }

  const { data: cart } = await supabase
    .from("carts")
    .select("cart_items(count)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  const count = cart?.cart_items?.[0]?.count || 0
  return { data: count }
}
