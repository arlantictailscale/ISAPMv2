"use server"

import { createClient } from "@/lib/supabase/server"

export async function getRoomAvailability() {
  const supabase = await createClient()

  // Debug info to trace the issue
  const debug: Record<string, unknown> = {}

  try {
    // Get room availability settings
    const { data: settings, error: settingsError } = await supabase
      .from("room_availability_settings")
      .select("room_type, default_capacity")
      .in("room_type", ["deluxe", "premier"])

    debug.settings = settings
    debug.settingsError = settingsError?.message

    if (settingsError) {
      console.error("[v0] Error fetching room settings:", settingsError)
      return {
        deluxe: { total: 120, booked: 0, available: 120 },
        premier: { total: 56, booked: 0, available: 56 },
        debug,
      }
    }

    // Step 1: Get all hotel room order items
    const { data: hotelItems, error: itemsError } = await supabase
      .from("order_items")
      .select("id, order_id, hotel_room_type")
      .not("hotel_room_type", "is", null)

    debug.hotelItems = hotelItems
    debug.itemsError = itemsError?.message

    if (itemsError) {
      console.error("[v0] Error fetching hotel items:", itemsError)
      throw itemsError
    }

    if (!hotelItems || hotelItems.length === 0) {
      const deluxeCapacity = settings?.find((s) => s.room_type === "deluxe")?.default_capacity || 120
      const premierCapacity = settings?.find((s) => s.room_type === "premier")?.default_capacity || 56
      return {
        deluxe: { total: deluxeCapacity, booked: 0, available: deluxeCapacity },
        premier: { total: premierCapacity, booked: 0, available: premierCapacity },
        debug,
      }
    }

    // Step 2: Get order IDs from hotel items
    const orderIds = [...new Set(hotelItems.map((item) => item.order_id))]
    debug.orderIds = orderIds

    // Step 3: Get orders that are not cancelled
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status")
      .in("id", orderIds)
      .neq("status", "cancelled")

    debug.validOrders = orders
    debug.ordersError = ordersError?.message

    if (ordersError) {
      console.error("[v0] Error fetching orders:", ordersError)
      throw ordersError
    }

    const validOrderIds = orders?.map((o) => o.id) || []
    debug.validOrderIds = validOrderIds

    // Step 4: Get verified payments for these orders
    const { data: payments, error: paymentsError } = await supabase
      .from("order_payments")
      .select("order_id, payment_status")
      .in("order_id", validOrderIds)
      .eq("payment_status", "verified")

    debug.payments = payments
    debug.paymentsError = paymentsError?.message

    if (paymentsError) {
      console.error("[v0] Error fetching payments:", paymentsError)
      throw paymentsError
    }

    // Get order IDs with verified payments
    const verifiedOrderIds = new Set(payments?.map((p) => p.order_id) || [])
    debug.verifiedOrderIds = Array.from(verifiedOrderIds)

    // Step 5: Count bookings by room type for verified orders only
    const verifiedBookings = hotelItems.filter((item) => verifiedOrderIds.has(item.order_id))
    debug.verifiedBookings = verifiedBookings

    const deluxeBookings = verifiedBookings.filter((b) => b.hotel_room_type === "deluxe").length
    const premierBookings = verifiedBookings.filter((b) => b.hotel_room_type === "premier").length

    debug.deluxeBookings = deluxeBookings
    debug.premierBookings = premierBookings

    // Get default capacities
    const deluxeCapacity = settings?.find((s) => s.room_type === "deluxe")?.default_capacity || 120
    const premierCapacity = settings?.find((s) => s.room_type === "premier")?.default_capacity || 56

    return {
      deluxe: {
        total: deluxeCapacity,
        booked: deluxeBookings,
        available: Math.max(0, deluxeCapacity - deluxeBookings),
      },
      premier: {
        total: premierCapacity,
        booked: premierBookings,
        available: Math.max(0, premierCapacity - premierBookings),
      },
      debug,
    }
  } catch (error) {
    console.error("[v0] Error in getRoomAvailability:", error)
    debug.error = error instanceof Error ? error.message : String(error)
    return {
      deluxe: { total: 120, booked: 0, available: 120 },
      premier: { total: 56, booked: 0, available: 56 },
      debug,
    }
  }
}
