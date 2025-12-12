import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log("[v0] Checking providers for email:", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.admin.listUsers()

    console.log("[v0] List users result:", { error, userCount: user?.users?.length })

    // Find user by email
    const foundUser = user?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    console.log("[v0] Found user:", {
      found: !!foundUser,
      identities: foundUser?.identities?.map((i) => i.provider),
    })

    if (error || !foundUser) {
      console.log("[v0] No user found or error:", error?.message)
      return NextResponse.json({
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
      })
    }

    // Extract providers from identities
    const providers = foundUser.identities?.map((identity) => identity.provider) || []
    const hasEmailProvider = providers.includes("email")
    const hasGoogleProvider = providers.includes("google")

    console.log("[v0] Provider analysis:", {
      providers,
      hasEmailProvider,
      hasGoogleProvider,
    })

    let primaryProvider: "email" | "google" | "multiple" | "none" = "none"
    if (hasEmailProvider && hasGoogleProvider) {
      primaryProvider = "multiple"
    } else if (hasEmailProvider) {
      primaryProvider = "email"
    } else if (hasGoogleProvider) {
      primaryProvider = "google"
    }

    const result = {
      providers,
      hasPassword: hasEmailProvider,
      primaryProvider,
      canLoginWithPassword: hasEmailProvider,
      canLoginWithGoogle: hasGoogleProvider,
    }

    console.log("[v0] Returning provider detection result:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Check providers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
