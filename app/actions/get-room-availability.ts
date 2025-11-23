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

    const { data: bookings, error: bookingsError } = await supabase
      .from("order_items")
      .select("hotel_room_type, orders!inner(status)")
      .in("hotel_room_type", ["deluxe", "premier"])
      .not("hotel_room_type", "is", null)
      .not("orders.status", "eq", "cancelled")

    if (bookingsError) {
      console.error("[v0] Error fetching bookings:", bookingsError)
      throw bookingsError
    }

    // Count bookings by room type
    const deluxeBookings = bookings?.filter((b) => b.hotel_room_type === "deluxe").length || 0
    const premierBookings = bookings?.filter((b) => b.hotel_room_type === "premier").length || 0

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
