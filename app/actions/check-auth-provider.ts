"use server"

import { createClient } from "@supabase/supabase-js"

export type AuthProviderResult = {
  exists: boolean
  isOAuthOnly: boolean
  provider: "google" | "email" | "both" | "none"
  hasPassword: boolean
  error?: string
  debug?: string
}

export async function checkAuthProvider(email: string): Promise<AuthProviderResult> {
  const defaultResult: AuthProviderResult = {
    exists: false,
    isOAuthOnly: false,
    provider: "none",
    hasPassword: false,
  }

  const debugInfo: string[] = []

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    debugInfo.push(`URL: ${supabaseUrl ? "set" : "missing"}`)
    debugInfo.push(`Key: ${serviceRoleKey ? "set (length: " + serviceRoleKey.length + ")" : "missing"}`)

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[checkAuthProvider] Missing Supabase credentials")
      return { ...defaultResult, error: "Server configuration error", debug: debugInfo.join(" | ") }
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    debugInfo.push("Admin client created")

    // This is more reliable as we know it works from our earlier test
    const { data: identityData, error: sqlError } = await adminClient
      .from("auth.users")
      .select("id, email")
      .eq("email", email)
      .single()

    // If direct query fails, try using RPC or raw query
    if (sqlError) {
      debugInfo.push(`Direct query failed: ${sqlError.message}`)

      // Try admin API as fallback
      try {
        debugInfo.push("Trying admin.getUserByEmail...")
        const { data, error } = await adminClient.auth.admin.getUserByEmail(email)

        if (error) {
          debugInfo.push(`Admin API error: ${error.message}`)
          if (error.message.includes("not found") || error.message.includes("User not found")) {
            return { ...defaultResult, debug: debugInfo.join(" | ") }
          }
          return { ...defaultResult, error: error.message, debug: debugInfo.join(" | ") }
        }

        if (!data?.user) {
          debugInfo.push("No user in response")
          return { ...defaultResult, debug: debugInfo.join(" | ") }
        }

        const user = data.user
        const identities = user.identities || []
        debugInfo.push(`Found user with ${identities.length} identities`)

        const hasGoogleIdentity = identities.some((id) => id.provider === "google")
        const hasEmailIdentity = identities.some((id) => id.provider === "email")

        let provider: "google" | "email" | "both" | "none" = "none"
        if (hasGoogleIdentity && hasEmailIdentity) {
          provider = "both"
        } else if (hasGoogleIdentity) {
          provider = "google"
        } else if (hasEmailIdentity) {
          provider = "email"
        }

        debugInfo.push(`Provider: ${provider}`)

        return {
          exists: true,
          isOAuthOnly: hasGoogleIdentity && !hasEmailIdentity,
          provider,
          hasPassword: hasEmailIdentity,
          debug: debugInfo.join(" | "),
        }
      } catch (adminError: any) {
        debugInfo.push(`Admin API exception: ${adminError?.message || "unknown"}`)
        return { ...defaultResult, error: adminError?.message || "Admin API failed", debug: debugInfo.join(" | ") }
      }
    }

    // If we get here, direct query worked
    debugInfo.push(`Found user: ${identityData?.id}`)

    // Now get identities for this user
    const { data: identities, error: identitiesError } = await adminClient.rpc("get_user_identities", {
      user_email: email,
    })

    if (identitiesError) {
      debugInfo.push(`Identities query failed: ${identitiesError.message}`)
    }

    return {
      exists: true,
      isOAuthOnly: false,
      provider: "email",
      hasPassword: true,
      debug: debugInfo.join(" | "),
    }
  } catch (err: any) {
    debugInfo.push(`Exception: ${err?.message || "unknown"}`)
    console.error("[checkAuthProvider] Unexpected error:", err)
    return { ...defaultResult, error: "Failed to check auth provider", debug: debugInfo.join(" | ") }
  }
}
