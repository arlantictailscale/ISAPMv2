"use server"

import { createClient } from "@supabase/supabase-js"

export async function addPasswordToAccount(email: string, password: string) {
  try {
    console.log("[v0] addPasswordToAccount: Starting for email:", email)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] addPasswordToAccount: Missing Supabase configuration")
      return {
        success: false,
        error: "Server configuration error",
      }
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: userData, error: userError } = await adminClient.auth.admin.getUserByEmail(email)

    if (userError || !userData?.user) {
      console.error("[v0] addPasswordToAccount: User lookup failed:", userError?.message)
      return {
        success: false,
        error: userError?.message || "User not found",
      }
    }

    const userId = userData.user.id
    console.log("[v0] addPasswordToAccount: Found user ID:", userId)

    const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: password,
    })

    if (updateError) {
      console.error("[v0] addPasswordToAccount: Failed to update password:", updateError)
      return {
        success: false,
        error: updateError.message || "Failed to add password",
      }
    }

    console.log("[v0] addPasswordToAccount: Password added successfully")

    return {
      success: true,
      message: "Password added successfully",
    }
  } catch (error) {
    console.error("[v0] addPasswordToAccount: Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
