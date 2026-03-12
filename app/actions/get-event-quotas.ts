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
 */
export async function getAllEventQuotasWithStatus(): Promise<QuotaStatus[]> {
  try {
    const adminClient = createAdminClient()

    // Fetch all quotas
    const { data: quotas, error: quotasError } = await adminClient
      .from("event_quotas")
      .select("*")
      .order("created_at", { ascending: true })

    if (quotasError) {
      console.error("[v0] Error fetching quotas:", quotasError)
      throw quotasError
    }

    if (!quotas || quotas.length === 0) {
      return []
    }

    // Fetch registration counts for each event
    const quotaStatuses = await Promise.all(
      quotas.map(async (quota) => {
        const { data: orderItems, error: countError } = await adminClient
          .from("order_items")
          .select("id", { count: "exact", head: true })
          .eq("item_type", "workshops")
          .eq("item_id", quota.event_id)

        if (countError) {
          console.error(`[v0] Error counting registrations for ${quota.event_id}:`, countError)
        }

        const registered_count = orderItems ? orderItems.length : 0
        const available_seats = Math.max(0, quota.max_capacity - registered_count)
        const is_sold_out = available_seats === 0
        const is_low_stock = available_seats > 0 && available_seats <= 5
        const percentage_filled = Math.round((registered_count / quota.max_capacity) * 100)

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
      .single()

    if (quotaError) {
      console.error(`[v0] Error fetching quota for ${eventId}:`, quotaError)
      return null
    }

    if (!quota) {
      return null
    }

    // Fetch registration count
    const { data: orderItems, error: countError } = await adminClient
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("item_type", "workshops")
      .eq("item_id", eventId)

    if (countError) {
      console.error(`[v0] Error counting registrations for ${eventId}:`, countError)
    }

    const registered_count = orderItems ? orderItems.length : 0
    const available_seats = Math.max(0, quota.max_capacity - registered_count)
    const is_sold_out = available_seats === 0
    const is_low_stock = available_seats > 0 && available_seats <= 5
    const percentage_filled = Math.round((registered_count / quota.max_capacity) * 100)

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
