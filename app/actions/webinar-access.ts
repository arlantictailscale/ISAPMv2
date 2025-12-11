"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  SYMPOSIUM_BONUS_WEBINAR_IDS,
  isSymposiumEvent,
  type WebinarGrant,
  type WebinarAccessResult,
} from "@/lib/webinar-access"

/**
 * Check if a user has access to a specific webinar
 * Checks both direct purchases and bonus grants
 */
export async function checkWebinarAccess(userId: string, webinarId: string): Promise<WebinarAccessResult> {
  const supabase = await createClient()

  // Check 1: Direct purchase via order_items
  const { data: purchasedWebinar } = await supabase
    .from("order_items")
    .select(`
      id,
      order_id,
      orders!inner (
        id,
        user_id,
        order_payments!inner (
          payment_status
        )
      )
    `)
    .eq("item_type", "webinar")
    .eq("event_id", webinarId)
    .eq("orders.user_id", userId)
    .eq("orders.order_payments.payment_status", "verified")
    .limit(1)
    .single()

  if (purchasedWebinar) {
    return {
      hasAccess: true,
      accessType: "purchased",
      orderId: purchasedWebinar.order_id,
    }
  }

  // Check 2: Symposium bonus grant
  const { data: grant } = await supabase
    .from("symposium_webinar_grants")
    .select("*")
    .eq("user_id", userId)
    .eq("webinar_id", webinarId)
    .eq("status", "active")
    .limit(1)
    .single()

  if (grant) {
    // Check if expired
    if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
      return {
        hasAccess: false,
        accessType: null,
      }
    }

    return {
      hasAccess: true,
      accessType: grant.grant_type as WebinarAccessResult["accessType"],
      grant: grant as WebinarGrant,
      orderId: grant.order_id,
    }
  }

  return {
    hasAccess: false,
    accessType: null,
  }
}

/**
 * Get all webinar access for a user (both purchased and granted)
 */
export async function getUserWebinarAccess(userId: string): Promise<{
  purchased: Array<{ webinarId: string; orderId: string; verifiedAt: string }>
  granted: WebinarGrant[]
}> {
  const supabase = await createClient()

  // Get purchased webinars
  const { data: purchasedItems } = await supabase
    .from("order_items")
    .select(`
      event_id,
      order_id,
      orders!inner (
        user_id,
        order_payments!inner (
          payment_status,
          verified_at
        )
      )
    `)
    .eq("item_type", "webinar")
    .eq("orders.user_id", userId)
    .eq("orders.order_payments.payment_status", "verified")

  const purchased = (purchasedItems || []).map((item: any) => ({
    webinarId: item.event_id,
    orderId: item.order_id,
    verifiedAt: item.orders?.order_payments?.[0]?.verified_at || "",
  }))

  // Get granted webinars
  const { data: grants } = await supabase
    .from("symposium_webinar_grants")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")

  return {
    purchased,
    granted: (grants || []) as WebinarGrant[],
  }
}

/**
 * Grant symposium bonus webinar access to a user
 * Called automatically when a Symposium payment is verified
 */
export async function grantSymposiumWebinarAccess(
  userId: string,
  orderId: string,
  grantedBy?: string,
): Promise<{ success: boolean; granted: number; error?: string }> {
  const supabase = await createClient()

  try {
    // Check if grants already exist for this order
    const { data: existingGrants } = await supabase
      .from("symposium_webinar_grants")
      .select("webinar_id")
      .eq("user_id", userId)
      .eq("order_id", orderId)

    const existingWebinarIds = new Set((existingGrants || []).map((g) => g.webinar_id))

    // Filter out webinars that are already granted
    const webinarsToGrant = SYMPOSIUM_BONUS_WEBINAR_IDS.filter((id) => !existingWebinarIds.has(id))

    if (webinarsToGrant.length === 0) {
      console.log("[v0] All symposium bonus webinars already granted for order:", orderId)
      return { success: true, granted: 0 }
    }

    // Create grant records for each webinar
    const grantRecords = webinarsToGrant.map((webinarId) => ({
      user_id: userId,
      order_id: orderId,
      webinar_id: webinarId,
      granted_by: grantedBy || null,
      grant_type: "symposium_bonus",
      status: "active",
    }))

    const { error } = await supabase.from("symposium_webinar_grants").insert(grantRecords)

    if (error) {
      console.error("[v0] Error granting symposium webinar access:", error)
      return { success: false, granted: 0, error: error.message }
    }

    console.log(
      `[v0] Granted ${webinarsToGrant.length} symposium bonus webinars to user ${userId} for order ${orderId}`,
    )

    revalidatePath("/my-webinars")
    return { success: true, granted: webinarsToGrant.length }
  } catch (error) {
    console.error("[v0] Error in grantSymposiumWebinarAccess:", error)
    return { success: false, granted: 0, error: "An unexpected error occurred" }
  }
}

/**
 * Manually grant webinar access (for admin use)
 */
export async function manualGrantWebinarAccess(
  userId: string,
  webinarIds: string[],
  grantType: "manual" | "promotional" = "manual",
  notes?: string,
  expiresAt?: string,
): Promise<{ success: boolean; granted: number; error?: string }> {
  const supabase = await createClient()

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, granted: 0, error: "Unauthorized" }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { success: false, granted: 0, error: "Admin access required" }
  }

  try {
    // We need an order_id for the grant - create a dummy order or use null
    // For manual grants, we'll need to either:
    // 1. Find an existing order for this user
    // 2. Create a special "manual grant" order
    // For simplicity, we'll find any verified order for the user

    const { data: existingOrder } = await supabase.from("orders").select("id").eq("user_id", userId).limit(1).single()

    if (!existingOrder) {
      return {
        success: false,
        granted: 0,
        error: "User has no orders. Cannot grant access without an order reference.",
      }
    }

    const grantRecords = webinarIds.map((webinarId) => ({
      user_id: userId,
      order_id: existingOrder.id,
      webinar_id: webinarId,
      granted_by: user.id,
      grant_type: grantType,
      status: "active",
      notes,
      expires_at: expiresAt || null,
    }))

    const { error } = await supabase.from("symposium_webinar_grants").upsert(grantRecords, {
      onConflict: "user_id,webinar_id,order_id",
    })

    if (error) {
      console.error("[v0] Error in manual grant:", error)
      return { success: false, granted: 0, error: error.message }
    }

    revalidatePath("/my-webinars")
    revalidatePath("/admin/symposium-webinar-access")
    return { success: true, granted: webinarIds.length }
  } catch (error) {
    console.error("[v0] Error in manualGrantWebinarAccess:", error)
    return { success: false, granted: 0, error: "An unexpected error occurred" }
  }
}

/**
 * Revoke webinar access
 */
export async function revokeWebinarAccess(grantId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { success: false, error: "Admin access required" }
  }

  const { error } = await supabase.from("symposium_webinar_grants").update({ status: "revoked" }).eq("id", grantId)

  if (error) {
    console.error("[v0] Error revoking webinar access:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/my-webinars")
  revalidatePath("/admin/symposium-webinar-access")
  return { success: true }
}

/**
 * Backfill webinar grants for existing Symposium buyers
 * Returns count of users processed and grants created
 */
export async function backfillSymposiumWebinarGrants(): Promise<{
  success: boolean
  usersProcessed: number
  grantsCreated: number
  errors: string[]
}> {
  const supabase = await createClient()

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, usersProcessed: 0, grantsCreated: 0, errors: ["Unauthorized"] }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { success: false, usersProcessed: 0, grantsCreated: 0, errors: ["Admin access required"] }
  }

  try {
    // Find all verified Symposium orders
    const { data: symposiumOrders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        order_items!inner (
          event_id,
          event_label,
          item_type
        ),
        order_payments!inner (
          payment_status
        )
      `)
      .eq("order_payments.payment_status", "verified")
      .eq("order_items.item_type", "event")

    if (ordersError) {
      return { success: false, usersProcessed: 0, grantsCreated: 0, errors: [ordersError.message] }
    }

    // Filter for Symposium events
    const symposiumUserOrders = (symposiumOrders || []).filter((order: any) => {
      return order.order_items.some((item: any) => isSymposiumEvent(item.event_id || "", item.event_label || ""))
    })

    console.log(`[v0] Found ${symposiumUserOrders.length} verified Symposium orders`)

    let usersProcessed = 0
    let grantsCreated = 0
    const errors: string[] = []

    for (const order of symposiumUserOrders) {
      const result = await grantSymposiumWebinarAccess(order.user_id, order.id, user.id)

      usersProcessed++
      if (result.success) {
        grantsCreated += result.granted
      } else if (result.error) {
        errors.push(`Order ${order.id}: ${result.error}`)
      }
    }

    revalidatePath("/admin/symposium-webinar-access")
    return { success: true, usersProcessed, grantsCreated, errors }
  } catch (error) {
    console.error("[v0] Error in backfillSymposiumWebinarGrants:", error)
    return {
      success: false,
      usersProcessed: 0,
      grantsCreated: 0,
      errors: ["An unexpected error occurred"],
    }
  }
}

/**
 * Check if an order contains a Symposium event
 */
export async function orderContainsSymposium(orderId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from("order_items")
    .select("event_id, event_label, item_type")
    .eq("order_id", orderId)
    .eq("item_type", "event")

  if (!items || items.length === 0) return false

  return items.some((item) => isSymposiumEvent(item.event_id || "", item.event_label || ""))
}
