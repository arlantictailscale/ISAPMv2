import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseServiceKey) {
      console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Create Supabase admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the requesting user is an admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 })
    }

    // Fetch all auth users using admin API
    const { data: authUsers, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error("Error fetching auth users:", usersError)
      throw usersError
    }

    // Fetch profiles data
    const { data: profiles } = await supabase.from("profiles").select("*")

    // Fetch registrations count
    const { data: registrations } = await supabase.from("registrations").select("user_id")

    // Fetch posters count
    const { data: abstracts } = await supabase.from("abstracts").select("user_id")

    // Combine all data
    const usersWithData = authUsers.users.map((authUser) => {
      const profile = profiles?.find((p) => p.id === authUser.id)
      const regCount = registrations?.filter((r) => r.user_id === authUser.id).length || 0
      const postCount = abstracts?.filter((a) => a.user_id === authUser.id).length || 0

      return {
        id: authUser.id,
        email: authUser.email || "",
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        phone: profile?.phone || null,
        institution: profile?.institution || null,
        position: profile?.position || null,
        role: profile?.role || "user",
        created_at: authUser.created_at,
        registrationCount: regCount,
        posterCount: postCount,
        email_confirmed_at: authUser.email_confirmed_at,
        last_sign_in_at: authUser.last_sign_in_at,
      }
    })

    return NextResponse.json({ users: usersWithData })
  } catch (error) {
    console.error("Error in admin users API:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
