"use server"

import { createClient } from "@supabase/supabase-js"

export async function getAuthUserCount() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        success: false,
        count: 0,
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

    // Get all users from auth.users using admin API
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Get up to 1000 users
    })

    if (listError) {
      return {
        success: false,
        count: 0,
        error: listError.message,
      }
    }

    return {
      success: true,
      count: usersData.users.length,
    }
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
