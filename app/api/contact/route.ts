import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { filterXSS } from "xss"
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/security/rate-limit"
import { contactFormSchema, validateInput, sanitizeString } from "@/lib/security/validation"

export async function POST(request: NextRequest) {
  try {
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
    const rateLimitResult = checkRateLimit(`contact:${clientIP}`, RATE_LIMITS.contact)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many contact submissions. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        },
      )
    }

    const body = await request.json()

    const validationResult = validateInput(contactFormSchema, body)

    if (!validationResult.success) {
      const errors = validationResult.errors.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { name, email, phone, subject, message } = validationResult.data

    const sanitizedName = sanitizeString(filterXSS(name))
    const sanitizedEmail = sanitizeString(filterXSS(email))
    const sanitizedPhone = phone ? sanitizeString(filterXSS(phone)) : null
    const sanitizedSubject = sanitizeString(filterXSS(subject))
    const sanitizedMessage = sanitizeString(filterXSS(message))

    const supabase = await createClient()

    const { data, error } = await supabase.from("contact_messages").insert({
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      subject: sanitizedSubject,
      message: sanitizedMessage,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    try {
      console.log("[v0] Sending contact form email notification")

      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-contact-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          subject: sanitizedSubject,
          message: sanitizedMessage,
        }),
      })

      console.log("[v0] Contact email API response status:", emailResponse.status)

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}))
        console.error("[v0] Failed to send contact email notification:", errorData)
      } else {
        console.log("[v0] Contact email notification sent successfully")
      }
    } catch (emailError) {
      console.error("[v0] Error sending contact email:", emailError)
    }

    return NextResponse.json(
      { success: true, data },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      },
    )
  } catch (error) {
    console.error("[v0] Contact API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
