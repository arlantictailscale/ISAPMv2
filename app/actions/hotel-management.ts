"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type HotelBooking = {
  id: string
  order_id: string
  user_id: string
  room_type: string
  check_in_date: string
  check_out_date: string
  nights: number
  quantity: number
  unit_price: number
  total_price: number
  status: string
  payment_status: string
  created_at: string
  guest_name: string
  guest_email: string
  order_status: string
}

export type RoomTypeSettings = {
  id: string
  room_type: string
  total_rooms: number
  price_per_night: number
  features: string[]
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type BookingStats = {
  totalBookings: number
  confirmedBookings: number
  pendingBookings: number
  cancelledBookings: number
  totalRevenue: number
  occupancyRate: {
    deluxe: { booked: number; total: number; percentage: number }
    premier: { booked: number; total: number; percentage: number }
  }
}

// Get all hotel bookings with guest details
export async function getHotelBookings(filters?: {
  roomType?: string
  status?: string
  searchQuery?: string
  dateFrom?: string
  dateTo?: string
}): Promise<{ bookings: HotelBooking[]; error: string | null }> {
  const supabase = await createClient()

  try {
    // Get all orders with hotel room items
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        status,
        created_at,
        order_items!inner (
          id,
          item_type,
          event_id,
          hotel_room_type,
          check_in_date,
          check_out_date,
          nights,
          quantity,
          unit_price,
          total_price
        ),
        order_payments (
          payment_status
        )
      `)
      .not("status", "eq", "cancelled")

    if (ordersError) throw ordersError

    // Get user profiles for guest details
    const userIds = [...new Set(orders?.map((o) => o.user_id) || [])]
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds)

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

    // Transform to bookings
    let bookings: HotelBooking[] = []

    for (const order of orders || []) {
      const hotelItems = order.order_items.filter((item: any) => item.item_type === "hotel" && item.hotel_room_type)

      for (const item of hotelItems) {
        const profile = profileMap.get(order.user_id)
        const paymentStatus = order.order_payments?.[0]?.payment_status || "pending"

        bookings.push({
          id: item.id,
          order_id: order.id,
          user_id: order.user_id,
          room_type: item.hotel_room_type,
          check_in_date: item.check_in_date,
          check_out_date: item.check_out_date,
          nights: item.nights || 1,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          status: paymentStatus === "verified" ? "confirmed" : "pending",
          payment_status: paymentStatus,
          created_at: order.created_at,
          guest_name: profile?.full_name || "Unknown Guest",
          guest_email: profile?.email || "",
          order_status: order.status,
        })
      }
    }

    // Apply filters
    if (filters?.roomType && filters.roomType !== "all") {
      bookings = bookings.filter((b) => b.room_type === filters.roomType)
    }

    if (filters?.status && filters.status !== "all") {
      bookings = bookings.filter((b) => b.status === filters.status)
    }

    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      bookings = bookings.filter(
        (b) =>
          b.guest_name.toLowerCase().includes(query) ||
          b.guest_email.toLowerCase().includes(query) ||
          b.order_id.toLowerCase().includes(query),
      )
    }

    if (filters?.dateFrom) {
      bookings = bookings.filter((b) => b.check_in_date >= filters.dateFrom!)
    }

    if (filters?.dateTo) {
      bookings = bookings.filter((b) => b.check_in_date <= filters.dateTo!)
    }

    // Sort by created_at descending
    bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { bookings, error: null }
  } catch (error) {
    console.error("Error fetching hotel bookings:", error)
    return { bookings: [], error: "Failed to fetch bookings" }
  }
}

// Get booking statistics
export async function getBookingStats(): Promise<{
  stats: BookingStats
  error: string | null
}> {
  const supabase = await createClient()

  try {
    // Get room availability settings
    const { data: settings } = await supabase.from("room_availability_settings").select("*").single()

    const deluxeTotal = settings?.deluxe_rooms || 50
    const premierTotal = settings?.premier_rooms || 20

    // Get all hotel bookings
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        order_items!inner (
          hotel_room_type,
          quantity,
          total_price
        ),
        order_payments (
          payment_status
        )
      `)
      .not("status", "eq", "cancelled")

    if (error) throw error

    let totalBookings = 0
    let confirmedBookings = 0
    let pendingBookings = 0
    let cancelledBookings = 0
    let totalRevenue = 0
    let deluxeBooked = 0
    let premierBooked = 0

    for (const order of orders || []) {
      const hotelItems = order.order_items.filter((item: any) => item.hotel_room_type)
      const paymentStatus = order.order_payments?.[0]?.payment_status || "pending"

      for (const item of hotelItems) {
        totalBookings++

        if (paymentStatus === "verified") {
          confirmedBookings++
          totalRevenue += item.total_price || 0

          if (item.hotel_room_type === "deluxe") {
            deluxeBooked += item.quantity || 1
          } else if (item.hotel_room_type === "premier") {
            premierBooked += item.quantity || 1
          }
        } else if (paymentStatus === "pending") {
          pendingBookings++
        } else if (paymentStatus === "rejected") {
          cancelledBookings++
        }
      }
    }

    return {
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue,
        occupancyRate: {
          deluxe: {
            booked: deluxeBooked,
            total: deluxeTotal,
            percentage: Math.round((deluxeBooked / deluxeTotal) * 100),
          },
          premier: {
            booked: premierBooked,
            total: premierTotal,
            percentage: Math.round((premierBooked / premierTotal) * 100),
          },
        },
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching booking stats:", error)
    return {
      stats: {
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        occupancyRate: {
          deluxe: { booked: 0, total: 50, percentage: 0 },
          premier: { booked: 0, total: 20, percentage: 0 },
        },
      },
      error: "Failed to fetch stats",
    }
  }
}

// Update room availability settings
export async function updateRoomSettings(settings: {
  deluxe_rooms: number
  premier_rooms: number
  deluxe_price?: number
  premier_price?: number
}): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("room_availability_settings")
      .update({
        deluxe_rooms: settings.deluxe_rooms,
        premier_rooms: settings.premier_rooms,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)

    if (error) throw error

    revalidatePath("/admin/hotel-management")
    revalidatePath("/venue")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error updating room settings:", error)
    return { success: false, error: "Failed to update settings" }
  }
}

// Get room availability settings
export async function getRoomSettings(): Promise<{
  settings: {
    deluxe_rooms: number
    premier_rooms: number
  } | null
  error: string | null
}> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from("room_availability_settings").select("*").single()

    if (error) throw error

    return {
      settings: {
        deluxe_rooms: data?.deluxe_rooms || 50,
        premier_rooms: data?.premier_rooms || 20,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error fetching room settings:", error)
    return { settings: null, error: "Failed to fetch settings" }
  }
}

// Cancel a booking (mark order as cancelled)
export async function cancelBooking(orderId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId)

    if (error) throw error

    revalidatePath("/admin/hotel-management")
    revalidatePath("/venue")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return { success: false, error: "Failed to cancel booking" }
  }
}
