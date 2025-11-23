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

    console.log("[v0] Admin verified, fetching all poster submissions...")

    const { data: abstractsData, error: abstractsError } = await supabase
      .from("abstracts")
      .select("*")
      .order("created_at", { ascending: false })

    if (abstractsError) {
      console.error("[v0] Error fetching abstracts:", abstractsError)
      throw abstractsError
    }

    console.log("[v0] Fetched abstracts count:", abstractsData?.length || 0)

    // Fetch profiles for all abstract submitters
    const userIds = abstractsData?.map((a) => a.user_id).filter(Boolean) || []

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds)

    if (profilesError) {
      console.error("[v0] Error fetching profiles:", profilesError)
    }

    // Transform data to include user information
    const transformedData =
      abstractsData?.map((submission: any) => {
        const profile = profilesData?.find((p) => p.id === submission.user_id)
        const userName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : ""
        const userEmail = submission.email || ""

        let topic = ""
        let cleanKeywords = submission.keywords || ""

        const topicMatch = submission.keywords?.match(/^\[(.*?)\]\s*(.*)/)
        if (topicMatch) {
          topic = topicMatch[1]
          cleanKeywords = topicMatch[2]
        }

        return {
          ...submission,
          user_email: userEmail,
          user_name: userName,
          topic,
          keywords: cleanKeywords,
          university: submission.university || null,
        }
      }) || []

    return NextResponse.json({ submissions: transformedData })
  } catch (error) {
    console.error("[v0] Error in admin posters API:", error)
    return NextResponse.json({ error: "Failed to fetch poster submissions" }, { status: 500 })
  }
}
