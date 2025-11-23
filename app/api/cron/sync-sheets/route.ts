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

    const { data: postersData, error: postersError } = await supabaseAdmin
      .from("abstracts")
      .select("*")
      .order("created_at", { ascending: false })

    if (postersError) {
      console.error("[v0] Error fetching posters:", postersError)
      throw postersError
    }

    console.log("[v0] Found poster submissions:", postersData?.length || 0)

    const posterUserIds = postersData?.map((p) => p.user_id).filter(Boolean) as string[]

    const { data: posterProfilesData, error: posterProfilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("id", posterUserIds)

    if (posterProfilesError) {
      console.error("[v0] Error fetching poster profiles:", posterProfilesError)
    }

    const posterProfilesMap = new Map(posterProfilesData?.map((p) => [p.id, p]) || [])

    if (postersData && postersData.length > 0) {
      console.log("[v0] First poster sample:", {
        id: postersData[0].id,
        title: postersData[0].title,
        user_id: postersData[0].user_id,
        hasProfile: posterProfilesMap.has(postersData[0].user_id),
        profileEmail: posterProfilesMap.get(postersData[0].user_id)?.email,
      })
    } else {
      console.log("[v0] No poster submissions found in database")
    }

    // Fetch confirmed attendees data
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from("order_payments")
      .select(`
        *,
        orders!order_payments_order_id_fkey (
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

    // Fetch all profiles for the users in the orders
    const userIds = paymentsData?.map((p) => p.orders?.user_id).filter(Boolean) as string[]

    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("id", userIds)

    if (profilesError) {
      console.error("[v0] Error fetching profiles:", profilesError)
    }

    // Create a map of user_id to profile for quick lookup
    const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || [])

    // Process Event Attendees
    const grouped: Record<string, any[]> = {}
    EVENT_OPTIONS.forEach((event) => {
      grouped[event.id] = []
    })

    // Process Hotel Bookings
    const hotelList: any[] = []

    const comprehensiveAttendees: any[] = []

    paymentsData?.forEach((payment) => {
      const order = payment.orders
      if (!order || !order.order_items) return

      const profile = profilesMap.get(order.user_id) || {}

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
      const hotelTotal = item ? (item.unit_price || 0) * (item.nights || 1) : 0
      return [
        booking.title_degree ? `${booking.title_degree} ${booking.full_name || ""}`.trim() : booking.full_name || "",
        booking.email || "",
        booking.phone || "",
        booking.institution || "",
        item?.hotel_room_type || "",
        item?.check_in_date ? new Date(item.check_in_date).toLocaleDateString() : "",
        item?.check_out_date ? new Date(item.check_out_date).toLocaleDateString() : "",
        item?.nights || 0,
        hotelTotal,
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
      "Category", // Case Report or Research
      "Topic", // Medical specialty (Emergencies/Pain Management/ICU/Anesthesia)
      "Submission Status",
      "Submission Date",
      "Updated Date",
      "Abstract File URL",
      "Poster File URL",
    ]

    const posterRows = (postersData || []).map((poster) => {
      const profile = posterProfilesMap.get(poster.user_id) || {}
      return [
        poster.title || "",
        profile.full_name || "",
        poster.email || profile.email || "",
        profile.institution || "",
        poster.authors || "",
        poster.category || "", // Category field: Case Report or Research
        poster.keywords || "", // Keywords field: Medical specialty topic
        poster.submission_status || "Pending",
        poster.created_at ? new Date(poster.created_at).toLocaleDateString() : "",
        poster.updated_at ? new Date(poster.updated_at).toLocaleDateString() : "",
        poster.content || "", // Use content field for abstract URL
        poster.file_url || "",
      ]
    })

    const posterValues = [posterHeaders, ...posterRows]

    console.log("[v0] Writing poster data to sheet. Rows:", posterRows.length)

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'E-Poster Submissions'!A1",
      valueInputOption: "RAW",
      requestBody: { values: posterValues },
    })

    const stats = {
      events: Object.keys(grouped).length,
      totalAttendees: comprehensiveAttendees.length,
      hotelBookings: hotelList.length,
      posterSubmissions: postersData?.length || 0,
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
