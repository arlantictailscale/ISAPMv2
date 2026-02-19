import { type NextRequest, NextResponse } from "next/server"
import { sendRegistrationConfirmation } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] send-registration-email API called');
    
    const body = await request.json()
    console.log('[v0] Request body:', JSON.stringify(body, null, 2));
    
    const { email, firstName, lastName, registrationType, amount, currency, registrationId } = body

    if (!email || !firstName || !registrationType) {
      console.error('[v0] Missing required fields:', { email: !!email, firstName: !!firstName, registrationType: !!registrationType });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log('[v0] Calling sendRegistrationConfirmation...');
    
    await sendRegistrationConfirmation({
      email,
      firstName,
      lastName,
      registrationType,
      amount,
      currency,
      registrationId,
    })

    console.log('[v0] Registration email sent successfully');
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Registration email error:", error)
    return NextResponse.json({ error: "Failed to send registration email", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
