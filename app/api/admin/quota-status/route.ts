import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getTodayQuotaStatus } from "@/lib/email/quota-manager"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get quota status
    const quota = await getTodayQuotaStatus(user.id)
    
    console.log(`[v0] Quota status requested - sent: ${quota.sent_today}/${quota.daily_limit}`)

    return NextResponse.json({ quota }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error getting quota status:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
