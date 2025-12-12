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

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // First, get the user by email to get their user ID
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserByEmail(email)

    if (userError || !userData?.user) {
      console.error("[v0] addPasswordToAccount: Failed to get user:", userError)
      return {
        success: false,
        error: "User not found",
      }
    }

    const userId = userData.user.id

    console.log("[v0] addPasswordToAccount: Found user ID:", userId)

    // Update the user's password using admin API
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
