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

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting Google Sheets sync...")

    // Authenticate user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: postersData, error: postersError } = await supabaseAdmin
      .from("abstracts")
      .select(`
        *,
        profiles!abstracts_user_id_fkey (
          full_name,
          email,
          institution,
          phone
        )
      `)
      .order("created_at", { ascending: false })

    if (postersError) {
      console.error("[v0] Error fetching posters:", postersError)
    }

    console.log("[v0] Found poster submissions:", postersData?.length || 0)

    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from("order_payments")
      .select(`
        *,
        orders!order_payments_order_id_fkey (
          *,
          order_items (*),
          profiles (
            title_degree,
            full_name,
            satu_sehat_name,
            satu_sehat_email,
            nik,
            institution,
            phone
          )
        )
      `)
      .eq("payment_status", "verified")
      .order("verified_at", { ascending: false })

    if (paymentsError) {
      throw paymentsError
    }

    console.log("[v0] Found verified payments:", paymentsData?.length || 0)

    const comprehensiveAttendees: any[] = []

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

      const profile = order.profiles || {}

      order.order_items.forEach((item: any) => {
        if (item.item_type === "event") {
          const eventId = item.event_id
          const matchedEventId = Object.keys(grouped).find((id) => id === eventId) || eventId

          if (!grouped[matchedEventId]) {
            grouped[matchedEventId] = []
          }

          const attendeeData = {
            ...order,
            ...profile,
            participant_type_label: item.participant_type_label,
            event_label: item.event_label,
            verified_at: payment.verified_at,
          }

          grouped[matchedEventId].push(attendeeData)

          if (!comprehensiveAttendees.find((a) => a.user_id === order.user_id && a.event_label === item.event_label)) {
            comprehensiveAttendees.push(attendeeData)
          }
        } else if (item.item_type === "hotel") {
          hotelList.push({
            ...order,
            ...profile,
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
      return NextResponse.json({ error: "Google Sheets Spreadsheet ID not configured" }, { status: 500 })
    }

    console.log("[v0] Syncing to spreadsheet:", spreadsheetId)

    // Clear existing sheets and create new ones
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const existingSheets = spreadsheet.data.sheets || []

    // Delete all sheets except the first one (we'll keep it to avoid errors)
    const requests: any[] = []
    for (let i = 1; i < existingSheets.length; i++) {
      requests.push({
        deleteSheet: {
          sheetId: existingSheets[i].properties?.sheetId,
        },
      })
    }

    // Execute deletions first
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      })
    }

    const updateRequests: any[] = []

    // Update first sheet to be Comprehensive Attendees
    updateRequests.push({
      updateSheetProperties: {
        properties: {
          sheetId: existingSheets[0].properties?.sheetId,
          title: "All Attendees - Comprehensive",
        },
        fields: "title",
      },
    })

    // Create sheets for each event
    for (let i = 0; i < EVENT_OPTIONS.length; i++) {
      const event = EVENT_OPTIONS[i]
      updateRequests.push({
        addSheet: {
          properties: {
            sheetId: i + 1,
            title: event.label.substring(0, 100),
          },
        },
      })
    }

    // Add hotel bookings sheet
    updateRequests.push({
      addSheet: {
        properties: {
          sheetId: EVENT_OPTIONS.length + 1,
          title: "Hotel Bookings",
        },
      },
    })

    updateRequests.push({
      addSheet: {
        properties: {
          sheetId: EVENT_OPTIONS.length + 2,
          title: "E-Poster Submissions",
        },
      },
    })

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: updateRequests },
    })

    const comprehensiveHeaders = [
      "Full Name with Titles/Degrees",
      "Name on Satu Sehat Account",
      "Email Registered on Satu Sehat Account",
      "National ID Number (NIK)",
      "Institution/Organization",
      "Mobile Phone Number",
      "Validated Event Purchased",
      "Participant Type",
      "Verified Date",
    ]

    const comprehensiveRows = comprehensiveAttendees.map((attendee) => [
      attendee.title_degree ? `${attendee.title_degree} ${attendee.full_name || ""}`.trim() : attendee.full_name || "",
      attendee.satu_sehat_name || "",
      attendee.satu_sehat_email || attendee.email || "",
      attendee.nik || "",
      attendee.institution || "",
      attendee.phone || "",
      attendee.event_label || "",
      attendee.participant_type_label || "",
      attendee.verified_at ? new Date(attendee.verified_at).toLocaleDateString() : "",
    ])

    const comprehensiveValues = [comprehensiveHeaders, ...comprehensiveRows]

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'All Attendees - Comprehensive'!A1",
      valueInputOption: "RAW",
      requestBody: { values: comprehensiveValues },
    })

    // Now populate data for individual event sheets
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

    const hotelHeaders = [
      "Full Name with Titles/Degrees",
      "Email",
      "Phone",
      "Institution",
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
        booking.title_degree ? `${booking.title_degree} ${booking.full_name || ""}`.trim() : booking.full_name || "",
        booking.email || "",
        booking.phone || "",
        booking.institution || "",
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

    const posterHeaders = [
      "Poster Title",
      "Presenter Name",
      "Contact Email",
      "Institution",
      "Authors",
      "Category",
      "Topic",
      "Submission Status",
      "Submission Date",
      "Updated Date",
      "Abstract File URL",
      "Poster File URL",
    ]

    const posterRows = (postersData || []).map((poster) => {
      const profile = poster.profiles || {}
      return [
        poster.title || "",
        profile.full_name || "",
        poster.email || profile.email || "",
        profile.institution || "",
        poster.authors || "",
        poster.category || "",
        poster.keywords || "",
        poster.submission_status || "Pending",
        poster.created_at ? new Date(poster.created_at).toLocaleDateString() : "",
        poster.updated_at ? new Date(poster.updated_at).toLocaleDateString() : "",
        poster.content || "",
        poster.file_url || "",
      ]
    })

    const posterValues = [posterHeaders, ...posterRows]

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'E-Poster Submissions'!A1",
      valueInputOption: "RAW",
      requestBody: { values: posterValues },
    })

    console.log("[v0] Successfully synced to Google Sheets")

    return NextResponse.json({
      success: true,
      message: "Successfully synced to Google Sheets",
      stats: {
        events: Object.keys(grouped).length,
        totalAttendees: comprehensiveAttendees.length,
        hotelBookings: hotelList.length,
        posterSubmissions: postersData?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("[v0] Google Sheets sync error:", error)
    return NextResponse.json({ error: error.message || "Failed to sync to Google Sheets" }, { status: 500 })
  }
}
