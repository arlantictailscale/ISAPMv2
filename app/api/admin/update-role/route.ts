import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Update role API called")

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.log("[v0] No authorization header")
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Create a client with the user's access token to verify they're logged in
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    // Check if the current user is an admin
    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (adminError || !adminProfile || adminProfile.role !== "admin") {
      console.log("[v0] Admin check failed:", adminError, adminProfile)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("[v0] Admin verified")

    // Get the request body
    const body = await request.json()
    const { userId, newRole } = body

    console.log("[v0] Update request:", { userId, newRole })

    if (!userId || !newRole) {
      return NextResponse.json({ error: "Missing userId or newRole" }, { status: 400 })
    }

    if (newRole !== "admin" && newRole !== "user") {
      return NextResponse.json({ error: 'Invalid role. Must be "admin" or "user"' }, { status: 400 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Attempting to update role in database")

    // Update the user's role
    const { data, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select()

    if (updateError) {
      console.error("[v0] Error updating role:", updateError)
      return NextResponse.json(
        {
          error: "Failed to update user role",
          details: updateError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Role updated successfully:", data)

    return NextResponse.json({
      success: true,
      message: `User role updated to ${newRole} successfully`,
    })
  } catch (error) {
    console.error("[v0] Error in update-role API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
