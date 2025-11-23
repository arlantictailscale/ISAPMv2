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

    // Update deluxe room capacity
    const { error: deluxeError } = await supabase.from("room_availability_settings").upsert(
      {
        room_type: "deluxe",
        default_capacity: deluxe,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_type" },
    )

    if (deluxeError) {
      console.error("[v0] Error updating deluxe capacity:", deluxeError)
      return { success: false, error: "Failed to update deluxe room capacity" }
    }

    // Update premier room capacity
    const { error: premierError } = await supabase.from("room_availability_settings").upsert(
      {
        room_type: "premier",
        default_capacity: premier,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_type" },
    )

    if (premierError) {
      console.error("[v0] Error updating premier capacity:", premierError)
      return { success: false, error: "Failed to update premier room capacity" }
    }

    // Revalidate the venue page to show updated availability
    revalidatePath("/venue")
    revalidatePath("/admin/room-availability")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateRoomAvailability:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
