import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { google } from "googleapis"

const EVENT_OPTIONS = [
  { id: "cpd", label: "CPD (Continuing Professional Development) Courses" },
  { id: "ws1", label: "WS 1 (Regenerative Pain Therapy)" },
  { id: "ws2", label: "WS 2 (Basic Interventional Pain Management)" },
  { id: "ws3", label: "WS 3 (Pediatric Essential Pain Management)" },
  { id: "ws4", label: "WS 4 (Adjunct Therapy for Pain Management)" },
  { id: "ws5", label: "WS 5 (Developing a Pain Clinic)" },
  { id: "ws6", label: "WS 6 (Cancer Pain)" },
  { id: "ws7", label: "WS 7 (Advanced Intervention of Pain Management)" },
  { id: "symposium", label: "Symposium" },
]

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.log("[v0] Unauthorized cron attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Starting automated Google Sheets sync...")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

    // Fetch confirmed attendees data
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from("order_payments")
      .select(`
        *,
        orders (
          *,
          order_items (*)
        )
      `)
      .eq("payment_status", "verified")
      .order("verified_at", { ascending: false })

    if (paymentsError) {
      throw paymentsError
    }

    console.log("[v0] Found verified payments:", paymentsData?.length || 0)

    // Process Event Attendees
    const grouped: Record<string, any[]> = {}
    EVENT_OPTIONS.forEach((event) => {
      grouped[event.id] = []
    })

    // Process Hotel Bookings
    const hotelList: any[] = []

    paymentsData?.forEach((payment) => {
      const order = payment.orders
      if (!order || !order.order_items) return

      order.order_items.forEach((item: any) => {
        if (item.item_type === "event") {
          const eventId = item.event_id
          const matchedEventId = Object.keys(grouped).find((id) => id === eventId) || eventId

          if (!grouped[matchedEventId]) {
            grouped[matchedEventId] = []
          }

          grouped[matchedEventId].push({
            ...order,
            participant_type_label: item.participant_type_label,
            verified_at: payment.verified_at,
          })
        } else if (item.item_type === "hotel") {
          hotelList.push({
            ...order,
            order_items: [item],
            verified_at: payment.verified_at,
          })
        }
      })
    })

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!spreadsheetId) {
      throw new Error("Google Sheets Spreadsheet ID not configured")
    }

    console.log("[v0] Syncing to spreadsheet:", spreadsheetId)

    // Get existing sheets
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const existingSheets = spreadsheet.data.sheets || []

    // Delete all sheets except the first one
    const requests: any[] = []
    for (let i = 1; i < existingSheets.length; i++) {
      requests.push({
        deleteSheet: {
          sheetId: existingSheets[i].properties?.sheetId,
        },
      })
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      })
    }

    // Create new sheets
    const updateRequests: any[] = []

    // Update first sheet
    const firstEvent = EVENT_OPTIONS[0]
    updateRequests.push({
      updateSheetProperties: {
        properties: {
          sheetId: existingSheets[0].properties?.sheetId,
          title: firstEvent.label.substring(0, 100),
        },
        fields: "title",
      },
    })

    // Create sheets for remaining events
    for (let i = 1; i < EVENT_OPTIONS.length; i++) {
      const event = EVENT_OPTIONS[i]
      updateRequests.push({
        addSheet: {
          properties: {
            sheetId: i,
            title: event.label.substring(0, 100),
          },
        },
      })
    }

    // Add hotel bookings sheet
    updateRequests.push({
      addSheet: {
        properties: {
          sheetId: EVENT_OPTIONS.length,
          title: "Hotel Bookings",
        },
      },
    })

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: updateRequests },
    })

    // Populate event data
    for (const event of EVENT_OPTIONS) {
      const list = grouped[event.id] || []
      const sheetName = event.label.substring(0, 100)

      const headers = ["Full Name", "Email", "Phone", "Institution", "Position", "Participant Type", "Verified At"]
      const rows = list.map((a) => [
        a.full_name || "",
        a.email || "",
        a.phone || "",
        a.institution || "",
        a.position || "",
        a.participant_type_label || "",
        a.verified_at ? new Date(a.verified_at).toLocaleDateString() : "",
      ])

      const values = [headers, ...rows]

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A1`,
        valueInputOption: "RAW",
        requestBody: { values },
      })
    }

    // Populate hotel bookings
    const hotelHeaders = [
      "Guest Name",
      "Email",
      "Phone",
      "Room Type",
      "Check-in",
      "Check-out",
      "Nights",
      "Total Paid",
      "Verified At",
    ]
    const hotelRows = hotelList.map((booking) => {
      const item = booking.order_items[0]
      return [
        booking.full_name || "",
        booking.email || "",
        booking.phone || "",
        item?.hotel_room_type || "",
        item?.check_in_date ? new Date(item.check_in_date).toLocaleDateString() : "",
        item?.check_out_date ? new Date(item.check_out_date).toLocaleDateString() : "",
        item?.nights || 0,
        booking.total_amount || 0,
        booking.verified_at ? new Date(booking.verified_at).toLocaleDateString() : "",
      ]
    })

    const hotelValues = [hotelHeaders, ...hotelRows]

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'Hotel Bookings'!A1",
      valueInputOption: "RAW",
      requestBody: { values: hotelValues },
    })

    const stats = {
      events: Object.keys(grouped).length,
      totalAttendees: Object.values(grouped).reduce((sum, list) => sum + list.length, 0),
      hotelBookings: hotelList.length,
      syncedAt: new Date().toISOString(),
    }

    console.log("[v0] Successfully synced to Google Sheets:", stats)

    return NextResponse.json({
      success: true,
      message: "Successfully synced to Google Sheets",
      stats,
    })
  } catch (error: any) {
    console.error("[v0] Automated sync error:", error)
    return NextResponse.json({ error: error.message || "Failed to sync to Google Sheets" }, { status: 500 })
  }
}
