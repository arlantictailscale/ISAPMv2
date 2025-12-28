"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { invalidateUserProfile } from "@/lib/auth/require-auth"

export async function updateUserRole(userId: string, newRole: "user" | "admin") {
  console.log("[v0] updateUserRole called", { userId, newRole })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] Environment check:", {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!serviceRoleKey,
      url: supabaseUrl,
    })

    if (!supabaseAnonKey) {
      console.error("[v0] Missing SUPABASE_ANON_KEY")
      return { success: false, error: "Server configuration error: Missing anon key" }
    }

    if (!serviceRoleKey) {
      console.error("[v0] Missing SUPABASE_SERVICE_ROLE_KEY")
      return { success: false, error: "Server configuration error: Missing service role key" }
    }

    // First, verify the current user is an admin
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

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

    await invalidateUserProfile(userId)

    console.log("[v0] Role updated successfully:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}
