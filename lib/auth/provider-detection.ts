import { createClient } from "@/lib/supabase/client"

export type AuthProvider = "email" | "google" | "multiple" | "none"

export interface ProviderDetectionResult {
  providers: string[]
  hasPassword: boolean
  primaryProvider: AuthProvider
  canLoginWithPassword: boolean
  canLoginWithGoogle: boolean
}

/**
 * Detect which authentication providers are associated with an email address
 */
export async function detectAuthProviders(email: string): Promise<ProviderDetectionResult> {
  try {
    const supabase = createClient()

    // Check if user exists in profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (!profile) {
      return {
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
      }
    }

    // For client-side, we can't directly query auth.identities
    // Instead, we attempt a sign-in to detect the provider
    // This is a limitation - ideally we'd use an API route with admin access

    // Try to check via an API endpoint
    const response = await fetch("/api/auth/check-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (response.ok) {
      const data = await response.json()
      return data
    }

    // Fallback: assume email provider if profile exists
    return {
      providers: ["email"],
      hasPassword: true,
      primaryProvider: "email",
      canLoginWithPassword: true,
      canLoginWithGoogle: false,
    }
  } catch (error) {
    console.error("[v0] Provider detection error:", error)
    return {
      providers: [],
      hasPassword: false,
      primaryProvider: "none",
      canLoginWithPassword: false,
      canLoginWithGoogle: false,
    }
  }
}
