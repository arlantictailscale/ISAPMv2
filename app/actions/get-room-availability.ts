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

    // Query order_items with hotel_room_type, joining orders and order_payments
    const { data: allHotelItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        id,
        hotel_room_type,
        order_id,
        orders!inner (
          id,
          status,
          order_payments (
            payment_status
          )
        )
      `)
      .in("hotel_room_type", ["deluxe", "premier"])

    if (itemsError) {
      console.error("[v0] Error fetching hotel items:", itemsError)
      throw itemsError
    }

    // Filter for verified bookings where order is not cancelled
    const verifiedBookings =
      allHotelItems?.filter((item) => {
        const order = item.orders as any
        if (!order || order.status === "cancelled") return false

        // Check if any payment is verified
        const payments = order.order_payments as any[]
        return payments?.some((p) => p.payment_status === "verified")
      }) || []

    // Count bookings by room type
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
