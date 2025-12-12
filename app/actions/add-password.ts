"use server"

import { neon } from "@neondatabase/serverless"
import { createClient } from "@supabase/supabase-js"

export async function addPasswordToAccount(email: string, password: string) {
  try {
    console.log("[v0] addPasswordToAccount: Starting for email:", email)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const databaseUrl = process.env.POSTGRES_URL

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

    if (!databaseUrl) {
      console.error("[v0] addPasswordToAccount: Missing database URL")
      return {
        success: false,
        error: "Server configuration error",
      }
    }

    const sql = neon(databaseUrl)

    // Get the user ID from auth.users table
    const users = await sql`
      SELECT id FROM auth.users WHERE email = ${email} LIMIT 1
    `

    if (!users || users.length === 0) {
      console.error("[v0] addPasswordToAccount: User not found")
      return {
        success: false,
        error: "User not found",
      }
    }

    const userId = users[0].id
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
