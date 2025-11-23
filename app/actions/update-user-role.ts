"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function updateUserRole(userId: string, newRole: "user" | "admin") {
  console.log("[v0] updateUserRole called", { userId, newRole })

  try {
    // First, verify the current user is an admin
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return { success: false, error: "Not authenticated" }
    }

    // Check if current user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      console.error("[v0] Not authorized - user role:", profile?.role)
      return { success: false, error: "Not authorized" }
    }

    // Use service role to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] Environment check:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] Missing environment variables")
      return { success: false, error: "Server configuration error" }
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Updating role for user:", userId, "to:", newRole)

    const { data, error } = await adminClient.from("profiles").update({ role: newRole }).eq("id", userId).select()

    if (error) {
      console.error("[v0] Database error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Role updated successfully:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}
