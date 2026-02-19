"use server"

import { createClient } from "@supabase/supabase-js"

export async function addPasswordToAccount(email: string, password: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
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
      return {
        success: false,
        error: "Failed to find user",
      }
    }

    const user = usersData.users.find((u) => u.email === email)

    if (!user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    const userId = user.id

    const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: password,
      user_metadata: {
        ...user.user_metadata,
        has_password: true,
      },
    })

    if (updateError) {
      return {
        success: false,
        error: updateError.message || "Failed to add password",
      }
    }

    return {
      success: true,
      message: "Password added successfully",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
