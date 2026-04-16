import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, category, message } = body

    // Validate required fields
    if (!name || !message) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 })
    }

    // Get IP for rate limiting/spam detection (optional)
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : "unknown"

    // Insert feedback into database
    const { data: feedback, error: dbError } = await supabaseAdmin
      .from("feedback")
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        category: category || "general",
        message: message.trim(),
        ip_address: ip,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 })
    }

    // Send confirmation email if email is provided
    if (email && email.trim()) {
      try {
        await resend.emails.send({
          from: "ISAPM 2026 <noreply@isapm2026.org>",
          to: email.trim(),
          subject: "Terima Kasih atas Masukan Anda - ISAPM 2026",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Terima Kasih!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">ISAPM 2026</p>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="margin-top: 0;">Halo <strong>${name}</strong>,</p>
                
                <p>Kami telah menerima masukan Anda dengan baik. Terima kasih telah meluangkan waktu untuk memberikan kritik dan saran kepada kami.</p>
                
                <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0; font-weight: 600; color: #374151;">Ringkasan Masukan:</p>
                  <p style="margin: 0 0 8px 0;"><strong>Kategori:</strong> ${getCategoryLabel(category)}</p>
                  <p style="margin: 0; color: #6b7280; font-style: italic;">"${message.length > 200 ? message.substring(0, 200) + "..." : message}"</p>
                </div>
                
                <p>Setiap masukan yang Anda berikan sangat berharga bagi kami untuk terus meningkatkan kualitas acara ISAPM 2026.</p>
                
                <p style="margin-bottom: 0;">Salam hangat,<br><strong>Panitia ISAPM 2026</strong></p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p style="margin: 0;">Indonesian Society of Anesthesiology for Pain Management</p>
                <p style="margin: 5px 0 0 0;">The Singhasari Hotel, Batu, Malang | 16-18 April 2026</p>
              </div>
            </body>
            </html>
          `,
        })
      } catch (emailError) {
        // Log email error but don't fail the request
        console.error("Email error:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      id: feedback.id,
    })
  } catch (error) {
    console.error("Feedback submission error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    general: "Umum",
    registration: "Pendaftaran",
    event: "Acara / Program",
    venue: "Venue / Lokasi",
    website: "Website / Aplikasi",
    other: "Lainnya",
  }
  return labels[category] || "Umum"
}
