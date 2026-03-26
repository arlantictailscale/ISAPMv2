"use server"

import { createClient } from "@/lib/supabase/server"
import { getCached, invalidateCache, CACHE_TTL, CACHE_PREFIX } from "@/lib/cache"

// Cache key for room availability
const ROOM_AVAILABILITY_KEY = `${CACHE_PREFIX.ROOM}availability`

export async function invalidateRoomAvailabilityCache() {
  await invalidateCache(ROOM_AVAILABILITY_KEY)
}

export async function getRoomAvailability() {
  return getCached(
    ROOM_AVAILABILITY_KEY,
    async () => {
      const supabase = await createClient()

      try {
        // Get room availability settings
        const { data: settings, error: settingsError } = await supabase
          .from("room_availability_settings")
          .select("room_type, default_capacity")
          .in("room_type", ["deluxe", "premier"])

        if (settingsError) {
          console.error("Error fetching room settings:", settingsError)
          return {
            deluxe: { total: 120, booked: 0, available: 120 },
            premier: { total: 23, booked: 0, available: 23 },
          }
        }

        // Step 1: Get all hotel room order items
        const { data: hotelItems, error: itemsError } = await supabase
          .from("order_items")
          .select("id, order_id, hotel_room_type")
          .not("hotel_room_type", "is", null)

        if (itemsError) {
          console.error("Error fetching hotel items:", itemsError)
          throw itemsError
        }

        if (!hotelItems || hotelItems.length === 0) {
          const deluxeCapacity = settings?.find((s) => s.room_type === "deluxe")?.default_capacity || 120
          const premierCapacity = settings?.find((s) => s.room_type === "premier")?.default_capacity || 23
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
          console.error("Error fetching orders:", ordersError)
          throw ordersError
        }

        const validOrderIds = orders?.map((o) => o.id) || []

        // Step 4: Count ALL bookings for these non-cancelled orders (including pending)
        // This matches the admin dashboard logic which counts all bookings
        const deluxeBookings = hotelItems.filter((item) => validOrderIds.includes(item.order_id) && item.hotel_room_type === "deluxe").length
        const premierBookings = hotelItems.filter((item) => validOrderIds.includes(item.order_id) && item.hotel_room_type === "premier").length

        // Get default capacities (Premier has 23 rooms, not 56)
        const deluxeCapacity = settings?.find((s) => s.room_type === "deluxe")?.default_capacity || 120
        const premierCapacity = settings?.find((s) => s.room_type === "premier")?.default_capacity || 23

        const deluxeAvailable = deluxeCapacity - deluxeBookings
        const premierAvailable = premierCapacity - premierBookings

        // Log if rooms are overbooked for monitoring
        if (deluxeAvailable < 0) {
          console.warn(`[Room Availability] Deluxe rooms overbooked: ${deluxeBookings}/${deluxeCapacity}`)
        }
        if (premierAvailable < 0) {
          console.warn(`[Room Availability] Premier rooms overbooked: ${premierBookings}/${premierCapacity}`)
        }

        return {
          deluxe: {
            total: deluxeCapacity,
            booked: deluxeBookings,
            available: Math.max(0, deluxeAvailable),
          },
          premier: {
            total: premierCapacity,
            booked: premierBookings,
            available: Math.max(0, premierAvailable),
          },
        }
      } catch (error) {
        console.error("Error in getRoomAvailability:", error)
        return {
          deluxe: { total: 120, booked: 0, available: 120 },
          premier: { total: 23, booked: 0, available: 23 },
        }
      }
    },
    10, // 10 seconds cache - room availability is critical data that changes rapidly
  )
}
