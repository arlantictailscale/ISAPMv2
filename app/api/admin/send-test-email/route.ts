import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWelcomeEmail, sendOrderConfirmationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { email, name, emailType = "order" } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name required" }, { status: 400 })
    }

    let result
    if (emailType === "welcome") {
      result = await sendWelcomeEmail(email, name)
    } else {
      // Send test order confirmation with sample data
      const testOrderItems = [
        {
          item_type: "workshop",
          event_label: "WS 3 (Pediatric Essential Pain Management)",
          participant_type_label: "Resident",
          unit_price: 1500000,
        },
        {
          item_type: "symposium",
          event_label: "Symposium",
          participant_type_label: "Resident",
          unit_price: 1500000,
        },
        {
          item_type: "hotel",
          hotel_room_type: "Premier",
          check_in_date: "16/4/2026",
          check_out_date: "18/4/2026",
          nights: 2,
          unit_price: 1350000,
        },
      ]

      result = await sendOrderConfirmationEmail({
        email,
        userName: name,
        orderId: "test-" + Date.now(),
        orderItems: testOrderItems,
        totalAmount: 4350000,
        currency: "IDR",
      })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test ${emailType === "welcome" ? "welcome" : "order confirmation"} email sent successfully!`,
      })
    } else {
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in send-test-email API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
