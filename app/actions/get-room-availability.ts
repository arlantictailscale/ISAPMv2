"use server"

import { createClient } from "@/lib/supabase/server"

export async function getRoomAvailability() {
  const supabase = await createClient()

  try {
    // Get room availability settings
    const { data: settings, error: settingsError } = await supabase
      .from("room_availability_settings")
      .select("room_type, default_capacity")
      .in("room_type", ["deluxe", "premier"])

    if (settingsError) {
      console.error("[v0] Error fetching room settings:", settingsError)
      // Return default values if table doesn't exist yet
      return {
        deluxe: { total: 120, booked: 0, available: 120 },
        premier: { total: 56, booked: 0, available: 56 },
      }
    }

    // Step 1: Get all hotel room order items
    const { data: hotelItems, error: itemsError } = await supabase
      .from("order_items")
      .select("id, order_id, hotel_room_type")
      .in("hotel_room_type", ["deluxe", "premier"])

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
      }
    }

    // Step 2: Get order IDs from hotel items
    const orderIds = [...new Set(hotelItems.map((item) => item.order_id))]

    // Step 3: Get orders that are not cancelled
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status")
      .in("id", orderIds)
      .neq("status", "cancelled")

    if (ordersError) {
      console.error("[v0] Error fetching orders:", ordersError)
      throw ordersError
    }

    const validOrderIds = orders?.map((o) => o.id) || []

    // Step 4: Get verified payments for these orders
    const { data: payments, error: paymentsError } = await supabase
      .from("order_payments")
      .select("order_id, payment_status")
      .in("order_id", validOrderIds)
      .eq("payment_status", "verified")

    if (paymentsError) {
      console.error("[v0] Error fetching payments:", paymentsError)
      throw paymentsError
    }

    // Get order IDs with verified payments
    const verifiedOrderIds = new Set(payments?.map((p) => p.order_id) || [])

    // Step 5: Count bookings by room type for verified orders only
    const verifiedBookings = hotelItems.filter((item) => verifiedOrderIds.has(item.order_id))

    const deluxeBookings = verifiedBookings.filter((b) => b.hotel_room_type === "deluxe").length
    const premierBookings = verifiedBookings.filter((b) => b.hotel_room_type === "premier").length

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
    }
  } catch (error) {
    console.error("[v0] Error in getRoomAvailability:", error)
    throw error
  }
}
