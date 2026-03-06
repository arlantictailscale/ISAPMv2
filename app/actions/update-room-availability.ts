"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateRoomAvailability({ deluxe, premier }: { deluxe: number; premier: number }) {
  const supabase = await createClient()

  try {
    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return { success: false, error: "Not authorized" }
    }

    // Call database function with elevated privileges (SECURITY DEFINER)
    const { error: rpcError } = await supabase.rpc("update_room_availability_settings", {
      p_deluxe_rooms: deluxe,
      p_premier_rooms: premier,
    })

    if (rpcError) {
      console.error("[v0] Error calling update_room_availability_settings RPC:", rpcError)
      return { success: false, error: rpcError.message || "Failed to update room availability" }
    }

    // Revalidate all pages that show room availability
    revalidatePath("/venue")
    revalidatePath("/admin/room-availability")
    revalidatePath("/admin/hotel-management")
    revalidatePath("/hotel-booking")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateRoomAvailability:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
