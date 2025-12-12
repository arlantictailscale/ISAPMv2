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
        error: "Server configuration error - missing Supabase credentials",
      }
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // List users and find by email (Supabase admin API method)
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error("[v0] addPasswordToAccount: Failed to list users:", listError)
      return {
        success: false,
        error: "Failed to find user",
      }
    }

    const user = usersData.users.find((u) => u.email === email)

    if (!user) {
      console.error("[v0] addPasswordToAccount: User not found with email:", email)
      return {
        success: false,
        error: "User not found",
      }
    }

    const userId = user.id
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

    console.log("[v0] addPasswordToAccount: Password updated successfully for user:", userId)

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
