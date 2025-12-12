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
 * This calls the server API endpoint which has admin access to query auth.users
 */
export async function detectAuthProviders(email: string): Promise<ProviderDetectionResult> {
  try {
    console.log("[v0] detectAuthProviders called for:", email)

    // Call API endpoint directly which has admin access
    const response = await fetch("/api/auth/check-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    console.log("[v0] API response status:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] API returned:", data)
      return data
    }

    console.log("[v0] API call failed, returning default")
    // If API fails, return unknown state
    return {
      providers: [],
      hasPassword: false,
      primaryProvider: "none",
      canLoginWithPassword: false,
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
