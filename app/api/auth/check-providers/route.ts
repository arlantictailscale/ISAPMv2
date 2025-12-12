import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get user by email using service role to access auth schema
    const {
      data: { user },
      error,
    } = await supabase.auth.admin.getUserByEmail(email)

    if (error || !user) {
      return NextResponse.json({
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
      })
    }

    // Extract providers from identities
    const providers = user.identities?.map((identity) => identity.provider) || []
    const hasEmailProvider = providers.includes("email")
    const hasGoogleProvider = providers.includes("google")

    let primaryProvider: "email" | "google" | "multiple" | "none" = "none"
    if (hasEmailProvider && hasGoogleProvider) {
      primaryProvider = "multiple"
    } else if (hasEmailProvider) {
      primaryProvider = "email"
    } else if (hasGoogleProvider) {
      primaryProvider = "google"
    }

    return NextResponse.json({
      providers,
      hasPassword: hasEmailProvider,
      primaryProvider,
      canLoginWithPassword: hasEmailProvider,
      canLoginWithGoogle: hasGoogleProvider,
    })
  } catch (error) {
    console.error("[v0] Check providers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
