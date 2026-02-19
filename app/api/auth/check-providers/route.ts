import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log("[v0] check-providers: Starting for email:", email)

    if (!email) {
      console.log("[v0] check-providers: No email provided")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] check-providers: Env check:", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlValue: supabaseUrl?.substring(0, 30) + "...",
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] check-providers: Missing Supabase configuration")
      return NextResponse.json({
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
        debug: "missing_config",
      })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] check-providers: Calling getUserByEmail...")

    const { data: userData, error: userError } = await adminClient.auth.admin.getUserByEmail(email)

    console.log("[v0] check-providers: getUserByEmail result:", {
      hasData: !!userData,
      hasUser: !!userData?.user,
      error: userError?.message,
      errorCode: userError?.code,
    })

    if (userError) {
      console.log("[v0] check-providers: User lookup error:", userError.message)
      // User not found is expected for non-existent users
      if (userError.message?.includes("User not found") || userError.code === "user_not_found") {
        return NextResponse.json({
          providers: [],
          hasPassword: false,
          primaryProvider: "none",
          canLoginWithPassword: false,
          canLoginWithGoogle: false,
          debug: "user_not_found",
        })
      }
      // Other errors
      return NextResponse.json({
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
        debug: `error: ${userError.message}`,
      })
    }

    const foundUser = userData?.user

    if (!foundUser) {
      console.log("[v0] check-providers: No user data returned")
      return NextResponse.json({
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
        debug: "no_user_data",
      })
    }

    console.log("[v0] check-providers: Found user:", {
      id: foundUser.id,
      email: foundUser.email,
      identitiesCount: foundUser.identities?.length,
      identities: foundUser.identities?.map((i) => ({
        provider: i.provider,
        identity_id: i.identity_id,
      })),
      app_metadata: foundUser.app_metadata,
    })

    // Extract providers from identities
    const providers = foundUser.identities?.map((identity) => identity.provider) || []
    const hasEmailProvider = providers.includes("email")
    const hasGoogleProvider = providers.includes("google")

    console.log("[v0] check-providers: Provider analysis:", {
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
      debug: "success",
    }

    console.log("[v0] check-providers: Returning result:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] check-providers: Unexpected error:", error)
    return NextResponse.json(
      {
        providers: [],
        hasPassword: false,
        primaryProvider: "none",
        canLoginWithPassword: false,
        canLoginWithGoogle: false,
        debug: `exception: ${error instanceof Error ? error.message : "unknown"}`,
      },
      { status: 500 },
    )
  }
}
