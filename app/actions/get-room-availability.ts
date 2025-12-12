"use server"

import { createClient } from "@/lib/supabase/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const CACHE_KEY = "room_availability"
const CACHE_TTL = 60 // 60 seconds (very fast updates)

export async function getRoomAvailability() {
  const supabase = await createClient()

  try {
    const cachedData = await redis.get(CACHE_KEY)
    if (cachedData) {
      console.log("[v0] Room availability from cache")
      return JSON.parse(cachedData)
    }

    // Step 1: Get room settings
    const { data: settings, error: settingsError } = await supabase
      .from("room_availability_settings")
      .select("room_type, default_capacity")
      .in("room_type", ["deluxe", "premier"])

    if (settingsError) {
      console.error("Error fetching room settings:", settingsError)
      return {
        deluxe: { total: 120, booked: 0, available: 120 },
        premier: { total: 56, booked: 0, available: 56 },
      }
    }

    const { data: hotelBookings, error: bookingsError } = await supabase
      .from("order_items")
      .select(`
        id,
        hotel_room_type,
        order:orders!inner(status),
        payment:order_payments!inner(payment_status)
      `)
      .not("hotel_room_type", "is", null)
      .eq("orders.status", "pending")
      .eq("order_payments.payment_status", "verified")

    if (bookingsError) {
      console.error("Error fetching hotel bookings:", bookingsError)
      // Return cached data or defaults on error
      return {
        deluxe: { total: 120, booked: 0, available: 120 },
        premier: { total: 56, booked: 0, available: 56 },
      }
    }

    // Count bookings by room type
    const deluxeBookings = hotelBookings?.filter((b: any) => b.hotel_room_type === "deluxe").length || 0
    const premierBookings = hotelBookings?.filter((b: any) => b.hotel_room_type === "premier").length || 0

    // Get default capacities
    const deluxeCapacity = settings?.find((s) => s.room_type === "deluxe")?.default_capacity || 120
    const premierCapacity = settings?.find((s) => s.room_type === "premier")?.default_capacity || 56

    const result = {
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

    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result))

    return result
  } catch (error) {
    console.error("Error in getRoomAvailability:", error)
    return {
      deluxe: { total: 120, booked: 0, available: 120 },
      premier: { total: 56, booked: 0, available: 56 },
    }
  }
}
