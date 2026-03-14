"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CartItem } from "@/lib/cart/types"
import { isDuplicateCartItem, validateCartItem } from "@/lib/cart/utils"
import { getCachedCart, invalidateCartCache } from "@/lib/cache"
import { checkEventQuotaAvailable } from "@/app/actions/get-event-quotas"

/**
 * Get or create active cart for current user
 * Now uses Redis caching for cart retrieval
 */
export async function getOrCreateCart() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not authenticated" }
  }

  return getCachedCart(user.id, async () => {
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
  })
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

  // Check quota availability for workshop items
  if (item.item_type === "event") {
    const quotaAvailable = await checkEventQuotaAvailable(item.event_id)
    if (!quotaAvailable) {
      return { error: "Sorry, this event is sold out. No more seats available." }
    }
  }

  // Get or create cart (uses cache)
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

  await invalidateCartCache(user.id)

  revalidatePath("/cart")
  revalidatePath("/pricing")

  return { data }
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
  const { data: item } = await supabase.from("cart_items").select("cart_id, carts(user_id)").eq("id", itemId).single()

  if (!item || item.carts?.user_id !== user.id) {
    return { error: "Item not found or unauthorized" }
  }

  const { error } = await supabase.from("cart_items").delete().eq("id", itemId)

  if (error) {
    console.error("[v0] Error removing from cart:", error)
    return { error: error.message }
  }

  await invalidateCartCache(user.id)

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

  await invalidateCartCache(user.id)

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

  await invalidateCartCache(user.id)

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
