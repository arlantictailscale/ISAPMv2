import { type NextRequest, NextResponse } from "next/server"
import { sendPaymentVerificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] send-payment-verification-email API called');
    
    const body = await request.json()
    console.log('[v0] Request body:', JSON.stringify(body, null, 2));
    
    const { email, firstName, lastName, status, rejectionReason, registrationType, amount, currency } = body

    if (!email || !firstName || !status) {
      console.error('[v0] Missing required fields:', { email: !!email, firstName: !!firstName, status: !!status });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log('[v0] Calling sendPaymentVerificationEmail...');
    
    await sendPaymentVerificationEmail({
      email,
      firstName,
      lastName,
      status,
      rejectionReason,
      registrationType,
      amount,
      currency,
    })

    console.log('[v0] Payment verification email sent successfully');
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0] Payment verification email error:", error)
    return NextResponse.json({ error: "Failed to send payment verification email", details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
