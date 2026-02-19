import { type NextRequest, NextResponse } from "next/server"
import { sendContactFormEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] send-contact-email API called');
    
    const body = await request.json()
    console.log('[v0] Request body:', JSON.stringify(body, null, 2));
    
    const { name, email, phone, subject, message } = body

    if (!name || !email || !subject || !message) {
      console.error('[v0] Missing required fields:', { name: !!name, email: !!email, subject: !!subject, message: !!message });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log('[v0] Calling sendContactFormEmail...');
    
    await sendContactFormEmail({
      name,
      email,
      phone,
      subject,
      message,
    })

    console.log('[v0] Contact form email sent successfully');
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Contact form email error:", error)
    return NextResponse.json({ error: "Failed to send contact form email", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
