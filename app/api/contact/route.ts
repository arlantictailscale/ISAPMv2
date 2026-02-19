import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { filterXSS } from "xss"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sanitizedName = filterXSS(name)
    const sanitizedEmail = filterXSS(email) 
    const sanitizedPhone = filterXSS(phone || "") 
    const sanitizedSubject = filterXSS(subject)
    const sanitizedMessage = filterXSS(message)

    const supabase = await createClient()

    const { data, error } = await supabase.from("contact_messages").insert({
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone || null, 
      subject: sanitizedSubject,
      message: sanitizedMessage,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    try {
      console.log('[v0] Sending contact form email notification');
      
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/send-contact-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          subject: sanitizedSubject,
          message: sanitizedMessage,
        }),
      });

      console.log('[v0] Contact email API response status:', emailResponse.status);

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        console.error('[v0] Failed to send contact email notification:', errorData);
      } else {
        console.log('[v0] Contact email notification sent successfully');
      }
    } catch (emailError) {
      console.error('[v0] Error sending contact email:', emailError);
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error("[v0] Contact API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
