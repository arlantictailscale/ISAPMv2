import { type NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] send-welcome-email API called');
    
    const body = await request.json()
    console.log('[v0] Request body:', JSON.stringify(body, null, 2));
    
    const { email, userId } = body

    if (!email) {
      console.error('[v0] Email is required');
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log('[v0] Calling sendWelcomeEmail for:', email);
    
    await sendWelcomeEmail(email)

    console.log('[v0] Welcome email sent successfully');
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Welcome email error:", error)
    return NextResponse.json({ error: "Failed to send welcome email", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
