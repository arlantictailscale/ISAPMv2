import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log("[v0] Checking providers for email:", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] Environment check:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] Missing Supabase configuration")
      return NextResponse.json({
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
      })
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000, // Get all users to search
    })

    console.log("[v0] List users result:", {
      error: error?.message,
      userCount: data?.users?.length,
    })

    if (error) {
      console.error("[v0] Admin API error:", error)
      return NextResponse.json({
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
      })
    }

    // Find user by email (case-insensitive)
    const foundUser = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    console.log("[v0] Found user:", {
      found: !!foundUser,
      userId: foundUser?.id,
      identities: foundUser?.identities?.map((i) => ({
        provider: i.provider,
        id: i.id,
      })),
    })

    if (!foundUser) {
      console.log("[v0] No user found with email:", email)
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
