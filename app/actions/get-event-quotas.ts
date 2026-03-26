"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"

export interface EventQuota {
  id: string
  event_id: string
  event_name: string
  max_capacity: number
  created_at: string
  updated_at: string
}

export interface QuotaStatus {
  event_id: string
  event_name: string
  max_capacity: number
  registered_count: number
  available_seats: number
  is_sold_out: boolean
  is_low_stock: boolean
  percentage_filled: number
}

/**
 * Get all event quotas with real-time registration counts
 * Counts registrations from orders with verified OR pending payments
 * (to reserve slots while payments are being processed)
 */
export async function getAllEventQuotasWithStatus(): Promise<QuotaStatus[]> {
  try {
    const adminClient = createAdminClient()

    // Fetch all active quotas
    const { data: quotas, error: quotasError } = await adminClient
      .from("event_quotas")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true })

    if (quotasError) {
      console.error("[v0] Error fetching quotas:", quotasError)
      throw quotasError
    }

    if (!quotas || quotas.length === 0) {
      return []
    }

    // Fetch registration counts for each event from orders with verified OR pending payments
    const quotaStatuses = await Promise.all(
      quotas.map(async (quota) => {
        // Count items from orders with verified payments
        const { count: verifiedCount, error: verifiedError } = await adminClient
          .from("order_items")
          .select(`
            id,
            order_id!inner(
              id,
              order_payments!inner(payment_status)
            )
          `, { count: "exact", head: true })
          .eq("item_type", "event")
          .eq("event_id", quota.event_id)
          .eq("order_id.order_payments.payment_status", "verified")

        if (verifiedError) {
          console.error(`[v0] Error counting verified registrations for ${quota.event_id}:`, verifiedError)
        }

        // Count items from orders with pending payments (waiting for approval)
        const { count: pendingCount, error: pendingError } = await adminClient
          .from("order_items")
          .select(`
            id,
            order_id!inner(
              id,
              order_payments!inner(payment_status)
            )
          `, { count: "exact", head: true })
          .eq("item_type", "event")
          .eq("event_id", quota.event_id)
          .eq("order_id.order_payments.payment_status", "pending")

        if (pendingError) {
          console.error(`[v0] Error counting pending registrations for ${quota.event_id}:`, pendingError)
        }

        // Total registered = verified + pending (to reserve slots while payments are processed)
        const registered_count = (verifiedCount ?? 0) + (pendingCount ?? 0)
        const available_seats = Math.max(0, quota.max_capacity - registered_count)
        const is_sold_out = available_seats === 0
        const is_low_stock = available_seats > 0 && available_seats <= 5
        const percentage_filled = quota.max_capacity > 0 
          ? Math.round((registered_count / quota.max_capacity) * 100) 
          : 0

        return {
          event_id: quota.event_id,
          event_name: quota.event_name,
          max_capacity: quota.max_capacity,
          registered_count,
          available_seats,
          is_sold_out,
          is_low_stock,
          percentage_filled,
        }
      })
    )

    return quotaStatuses
  } catch (err) {
    console.error("[v0] Error in getAllEventQuotasWithStatus:", err)
    return []
  }
}

/**
 * Get quota status for a specific event
 */
export async function getEventQuotaStatus(eventId: string): Promise<QuotaStatus | null> {
  try {
    const adminClient = createAdminClient()

    // Fetch the specific quota
    const { data: quota, error: quotaError } = await adminClient
      .from("event_quotas")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .single()

    if (quotaError) {
      // Not found is not an error - event may not have quota
      if (quotaError.code === "PGRST116") {
        return null
      }
      console.error(`[v0] Error fetching quota for ${eventId}:`, quotaError)
      return null
    }

    if (!quota) {
      return null
    }

    // Count verified registrations from orders with verified payments
    const { count: verifiedCount, error: verifiedError } = await adminClient
      .from("order_items")
      .select(`
        id,
        order_id!inner(
          id,
          order_payments!inner(payment_status)
        )
      `, { count: "exact", head: true })
      .eq("item_type", "event")
      .eq("event_id", eventId)
      .eq("order_id.order_payments.payment_status", "verified")

    if (verifiedError) {
      console.error(`[v0] Error counting verified registrations for ${eventId}:`, verifiedError)
    }

    // Count pending registrations from orders with pending payments
    const { count: pendingCount, error: pendingError } = await adminClient
      .from("order_items")
      .select(`
        id,
        order_id!inner(
          id,
          order_payments!inner(payment_status)
        )
      `, { count: "exact", head: true })
      .eq("item_type", "event")
      .eq("event_id", eventId)
      .eq("order_id.order_payments.payment_status", "pending")

    if (pendingError) {
      console.error(`[v0] Error counting pending registrations for ${eventId}:`, pendingError)
    }

    // Total registered = verified + pending (to reserve slots while payments are processed)
    const registered_count = (verifiedCount ?? 0) + (pendingCount ?? 0)
    const available_seats = Math.max(0, quota.max_capacity - registered_count)
    const is_sold_out = available_seats === 0
    const is_low_stock = available_seats > 0 && available_seats <= 5
    const percentage_filled = quota.max_capacity > 0 
      ? Math.round((registered_count / quota.max_capacity) * 100) 
      : 0

    return {
      event_id: quota.event_id,
      event_name: quota.event_name,
      max_capacity: quota.max_capacity,
      registered_count,
      available_seats,
      is_sold_out,
      is_low_stock,
      percentage_filled,
    }
  } catch (err) {
    console.error("[v0] Error in getEventQuotaStatus:", err)
    return null
  }
}

/**
 * Check if an event has available quota (for validation before adding to cart)
 */
export async function checkEventQuotaAvailable(eventId: string): Promise<boolean> {
  try {
    const status = await getEventQuotaStatus(eventId)
    return status ? !status.is_sold_out : true
  } catch (err) {
    console.error("[v0] Error in checkEventQuotaAvailable:", err)
    return true // Allow purchase if we can't check (fail open)
  }
}

/**
 * Update quota for an event (admin only)
 */
export async function updateEventQuota(eventId: string, newCapacity: number): Promise<boolean> {
  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("event_quotas")
      .update({
        max_capacity: newCapacity,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId)

    if (error) {
      console.error(`[v0] Error updating quota for ${eventId}:`, error)
      return false
    }

    return true
  } catch (err) {
    console.error("[v0] Error in updateEventQuota:", err)
    return false
  }
}
