"use server"

import { createClient } from "@supabase/supabase-js"

export type AuthProviderResult = {
  exists: boolean
  isOAuthOnly: boolean
  provider: "google" | "email" | "both" | "none"
  hasPassword: boolean
  error?: string
}

export async function checkAuthProvider(email: string): Promise<AuthProviderResult> {
  const defaultResult: AuthProviderResult = {
    exists: false,
    isOAuthOnly: false,
    provider: "none",
    hasPassword: false,
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[checkAuthProvider] Missing Supabase credentials")
      return { ...defaultResult, error: "Server configuration error" }
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get user by email using admin API
    const { data, error } = await adminClient.auth.admin.getUserByEmail(email)

    if (error) {
      console.error("[checkAuthProvider] Admin API error:", error.message)
      // User not found is expected for non-existent emails
      if (error.message.includes("not found") || error.message.includes("User not found")) {
        return defaultResult
      }
      return { ...defaultResult, error: error.message }
    }

    if (!data?.user) {
      return defaultResult
    }

    const user = data.user
    const identities = user.identities || []

    // Check for providers
    const hasGoogleIdentity = identities.some((id) => id.provider === "google")
    const hasEmailIdentity = identities.some((id) => id.provider === "email")

    // Determine provider type
    let provider: "google" | "email" | "both" | "none" = "none"
    if (hasGoogleIdentity && hasEmailIdentity) {
      provider = "both"
    } else if (hasGoogleIdentity) {
      provider = "google"
    } else if (hasEmailIdentity) {
      provider = "email"
    }

    const isOAuthOnly = hasGoogleIdentity && !hasEmailIdentity

    return {
      exists: true,
      isOAuthOnly,
      provider,
      hasPassword: hasEmailIdentity,
    }
  } catch (err) {
    console.error("[checkAuthProvider] Unexpected error:", err)
    return { ...defaultResult, error: "Failed to check auth provider" }
  }
}
