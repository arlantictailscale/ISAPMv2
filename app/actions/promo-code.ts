"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export interface PromoCodeRule {
  id: string
  event_slug: string | null
  event_type: string | null
  discount_type: "percentage" | "fixed_amount" | "fixed_price"
  discount_value: number
  participant_type: string | null
  description: string | null
}

export interface PromoCode {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: string
  discount_value: number | null
  max_uses: number | null
  current_uses: number
  min_order_amount: number | null
  max_discount_amount: number | null
  starts_at: string
  expires_at: string | null
  is_active: boolean
  rules: PromoCodeRule[]
}

export interface CartItemDiscount {
  item_id: string
  event_slug: string
  event_type: string
  original_price: number
  discounted_price: number
  discount_amount: number
  discount_type: string
  discount_value: number
  rule_id: string | null
  rule_description: string | null
}

export interface PromoValidationResult {
  valid: boolean
  promo_code?: PromoCode
  item_discounts?: CartItemDiscount[]
  total_discount?: number
  original_total?: number
  final_total?: number
  error?: string
}

export async function validatePromoCode(
  code: string,
  cartItems: Array<{
    id: string
    event_slug: string
    event_type: string
    price: number
    participant_type?: string
  }>
): Promise<PromoValidationResult> {
  const supabase = await createClient()

  try {
    // Get the promo code with its rules
    const { data: promoCode, error: promoError } = await supabase
      .from("promo_codes")
      .select(`
        *,
        rules:promo_code_rules(*)
      `)
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single()

    if (promoError || !promoCode) {
      return { valid: false, error: "Invalid promo code" }
    }

    // Check if promo code has expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return { valid: false, error: "Promo code has expired" }
    }

    // Check if promo code hasn't started yet
    if (promoCode.starts_at && new Date(promoCode.starts_at) > new Date()) {
      return { valid: false, error: "Promo code is not yet active" }
    }

    // Check max uses
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return { valid: false, error: "Promo code usage limit reached" }
    }

    // Check if user has already used this code
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existingUse } = await supabase
        .from("promo_code_uses")
        .select("id")
        .eq("promo_code_id", promoCode.id)
        .eq("user_id", user.id)
        .single()

      if (existingUse) {
        return { valid: false, error: "You have already used this promo code" }
      }
    }

    // Calculate discounts for each cart item
    const itemDiscounts: CartItemDiscount[] = []
    let totalDiscount = 0
    let originalTotal = 0

    console.log("[v0] Promo validation - Cart items:", JSON.stringify(cartItems, null, 2))

    for (const item of cartItems) {
      originalTotal += item.price

      // Find matching rule for this item (most specific first)
      const rules = promoCode.rules as PromoCodeRule[]
      
      console.log("[v0] Checking item:", item.event_slug, "type:", item.event_type, "participant:", item.participant_type)
      console.log("[v0] Available rules:", JSON.stringify(rules.map(r => ({ 
        event_slug: r.event_slug, 
        event_type: r.event_type, 
        participant_type: r.participant_type,
        discount_type: r.discount_type,
        discount_value: r.discount_value,
        is_active: r.is_active 
      })), null, 2))
      
      // Priority: exact event_slug match > event_type match > general rule
      let matchingRule: PromoCodeRule | null = null

      // First try to find rule with exact event_slug and participant_type match
      if (item.participant_type) {
        matchingRule = rules.find(
          (r) => r.event_slug === item.event_slug && 
                 r.participant_type === item.participant_type &&
                 (r as any).is_active !== false
        ) || null
        console.log("[v0] Trying slug+participant match:", matchingRule ? "FOUND" : "not found")
      }

      // Then try exact event_slug match without participant type
      if (!matchingRule) {
        matchingRule = rules.find(
          (r) => r.event_slug === item.event_slug && 
                 !r.participant_type &&
                 (r as any).is_active !== false
        ) || null
        console.log("[v0] Trying slug-only match:", matchingRule ? "FOUND" : "not found")
      }

      // Then try event_type match
      if (!matchingRule) {
        matchingRule = rules.find(
          (r) => !r.event_slug && 
                 r.event_type === item.event_type &&
                 (r as any).is_active !== false
        ) || null
        console.log("[v0] Trying type-only match:", matchingRule ? "FOUND" : "not found")
      }
      
      console.log("[v0] Final matching rule:", matchingRule)

      // Calculate discount based on rule
      let discountedPrice = item.price
      let discountAmount = 0
      let discountType = "none"
      let discountValue = 0

      if (matchingRule) {
        discountType = matchingRule.discount_type
        discountValue = matchingRule.discount_value

        switch (matchingRule.discount_type) {
          case "percentage":
            discountAmount = Math.round((item.price * matchingRule.discount_value) / 100)
            discountedPrice = item.price - discountAmount
            break
          case "fixed_amount":
            discountAmount = Math.min(matchingRule.discount_value, item.price)
            discountedPrice = item.price - discountAmount
            break
          case "fixed_price":
            discountedPrice = matchingRule.discount_value
            discountAmount = item.price - discountedPrice
            break
        }

        // Ensure discount doesn't go negative
        if (discountedPrice < 0) discountedPrice = 0
        if (discountAmount < 0) discountAmount = 0
      }

      totalDiscount += discountAmount

      itemDiscounts.push({
        item_id: item.id,
        event_slug: item.event_slug,
        event_type: item.event_type,
        original_price: item.price,
        discounted_price: discountedPrice,
        discount_amount: discountAmount,
        discount_type: discountType,
        discount_value: discountValue,
        rule_id: matchingRule?.id || null,
        rule_description: matchingRule?.description || null,
      })
    }

    // Check minimum order amount
    if (promoCode.min_order_amount && originalTotal < promoCode.min_order_amount) {
      return { 
        valid: false, 
        error: `Minimum order amount is Rp ${promoCode.min_order_amount.toLocaleString("id-ID")}` 
      }
    }

    // Apply max discount cap if set
    if (promoCode.max_discount_amount && totalDiscount > promoCode.max_discount_amount) {
      const ratio = promoCode.max_discount_amount / totalDiscount
      totalDiscount = promoCode.max_discount_amount
      // Proportionally reduce each item's discount
      itemDiscounts.forEach((item) => {
        item.discount_amount = Math.round(item.discount_amount * ratio)
        item.discounted_price = item.original_price - item.discount_amount
      })
    }

    return {
      valid: true,
      promo_code: promoCode as PromoCode,
      item_discounts: itemDiscounts,
      total_discount: totalDiscount,
      original_total: originalTotal,
      final_total: originalTotal - totalDiscount,
    }
  } catch (error: any) {
    console.error("Error validating promo code:", error)
    return { valid: false, error: "Failed to validate promo code" }
  }
}

export async function recordPromoCodeUse(
  promoCodeId: string,
  orderId: string,
  discountAmount: number,
  originalAmount: number
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    // Record the usage
    const { error: useError } = await adminClient
      .from("promo_code_uses")
      .insert({
        promo_code_id: promoCodeId,
        user_id: user.id,
        order_id: orderId,
        discount_amount: discountAmount,
        original_amount: originalAmount,
      })

    if (useError) {
      console.error("Error recording promo use:", useError)
      return { success: false, error: "Failed to record promo code usage" }
    }

    // Increment current_uses counter
    const { error: updateError } = await adminClient
      .from("promo_codes")
      .update({ current_uses: adminClient.rpc("increment", { x: 1 }) })
      .eq("id", promoCodeId)

    // Alternative: Use raw SQL increment if rpc doesn't work
    if (updateError) {
      await adminClient
        .from("promo_codes")
        .update({ 
          current_uses: adminClient.sql`current_uses + 1`
        })
        .eq("id", promoCodeId)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error recording promo code use:", error)
    return { success: false, error: "Failed to record promo code usage" }
  }
}

export async function getAvailablePromoCodes(): Promise<PromoCode[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("promo_codes")
    .select(`
      *,
      rules:promo_code_rules(*)
    `)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching promo codes:", error)
    return []
  }

  return data as PromoCode[]
}
