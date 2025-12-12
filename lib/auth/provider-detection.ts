export type AuthProvider = "email" | "google" | "multiple" | "none"

export interface ProviderDetectionResult {
  providers: string[]
  hasPassword: boolean
  primaryProvider: AuthProvider
  canLoginWithPassword: boolean
  canLoginWithGoogle: boolean
  debug?: string
}

/**
 * Detect which authentication providers are associated with an email address
 * This calls the server API endpoint which has admin access to query auth.users
 */
export async function detectAuthProviders(email: string): Promise<ProviderDetectionResult> {
  const defaultResult: ProviderDetectionResult = {
    providers: [],
    hasPassword: false,
    primaryProvider: "none",
    canLoginWithPassword: false,
    canLoginWithGoogle: false,
  }

  try {
    console.log("[v0] detectAuthProviders: Starting for email:", email)

    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const apiUrl = `${baseUrl}/api/auth/check-providers`

    console.log("[v0] detectAuthProviders: Calling API at:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    console.log("[v0] detectAuthProviders: Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] detectAuthProviders: API error response:", errorText)
      return defaultResult
    }

    const data = await response.json()
    console.log("[v0] detectAuthProviders: API returned data:", data)

    return {
      providers: data.providers || [],
      hasPassword: data.hasPassword || false,
      primaryProvider: data.primaryProvider || "none",
      canLoginWithPassword: data.canLoginWithPassword || false,
      canLoginWithGoogle: data.canLoginWithGoogle || false,
      debug: data.debug,
    }
  } catch (error) {
    console.error("[v0] detectAuthProviders: Exception:", error)
    return defaultResult
  }
}
