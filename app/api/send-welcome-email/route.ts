import { type NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] send-welcome-email API called")

    const body = await request.json()
    const { email, userId, userName } = body

    if (!email) {
      console.error("[v0] Email is required")
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // If userName is not provided, try to fetch from database
    let displayName = userName
    if (!displayName && userId) {
      try {
        const supabase = await createClient()
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single()

        displayName = profile?.full_name || email.split("@")[0]
      } catch (error) {
        console.log("[v0] Could not fetch user profile, using email as fallback")
        displayName = email.split("@")[0]
      }
    }

    console.log("[v0] Sending welcome email to:", email, "with name:", displayName)

    const result = await sendWelcomeEmail(email, displayName)

    if (!result.success) {
      throw new Error("Failed to send email")
    }

    console.log("[v0] Welcome email sent successfully")

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Welcome email error:", error)
    return NextResponse.json(
      {
        error: "Failed to send welcome email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
