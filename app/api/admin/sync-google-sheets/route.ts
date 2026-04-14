import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { google } from "googleapis"
import { getWebinarById } from "@/lib/data/webinars"

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

    // Create a map of user_id to profile for posters
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

    // Query from orders table to properly filter out cancelled orders
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        order_items (*),
        order_payments!inner (*)
      `)
      .neq("status", "cancelled")
      .eq("order_payments.payment_status", "verified")
      .order("created_at", { ascending: false })

    // Transform to match expected paymentsData structure
    const paymentsData = ordersData?.map(order => ({
      ...order.order_payments?.[0],
      orders: {
        ...order,
        order_items: order.order_items
      }
    })).filter(p => p.id) || []

    const paymentsError = ordersError

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

    const comprehensiveAttendees: any[] = []

    // Process Event Attendees
    const grouped: Record<string, any[]> = {}
    EVENT_OPTIONS.forEach((event) => {
      grouped[event.id] = []
    })

    // Process Hotel Bookings
    const hotelList: any[] = []

    const webinarList: any[] = []

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
            unit_price: item.unit_price,
            original_price: item.original_price,
            discount_amount: item.discount_amount,
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
        } else if (item.item_type === "webinar") {
          const webinarInfo = getWebinarById(item.event_id)
          webinarList.push({
            ...order,
            ...profile,
            webinar_id: item.event_id,
            webinar_title: webinarInfo?.title || item.event_label || item.event_id,
            webinar_short_title: webinarInfo?.shortTitle || item.event_label || item.event_id,
            webinar_date: webinarInfo?.date || "",
            webinar_time: webinarInfo?.time || "",
            access_type: "purchased",
            unit_price: item.unit_price,
            verified_at: payment.verified_at,
          })
        }
      })
    })

    const { data: webinarGrantsData, error: webinarGrantsError } = await supabaseAdmin
      .from("symposium_webinar_grants")
      .select("*")
      .eq("status", "active")
      .order("granted_at", { ascending: false })

    if (webinarGrantsError) {
      console.error("[v0] Error fetching webinar grants:", webinarGrantsError)
    }

    console.log("[v0] Found webinar grants:", webinarGrantsData?.length || 0)

    // Get profiles for webinar grant users
    const grantUserIds = webinarGrantsData?.map((g) => g.user_id).filter(Boolean) as string[]
    const { data: grantProfilesData } = await supabaseAdmin.from("profiles").select("*").in("id", grantUserIds)

    const grantProfilesMap = new Map(grantProfilesData?.map((p) => [p.id, p]) || [])

    // Add granted webinars to the list
    webinarGrantsData?.forEach((grant) => {
      const profile = grantProfilesMap.get(grant.user_id) || {}
      const webinarInfo = getWebinarById(grant.webinar_id)

      webinarList.push({
        user_id: grant.user_id,
        ...profile,
        webinar_id: grant.webinar_id,
        webinar_title: webinarInfo?.title || grant.webinar_id,
        webinar_short_title: webinarInfo?.shortTitle || grant.webinar_id,
        webinar_date: webinarInfo?.date || "",
        webinar_time: webinarInfo?.time || "",
        access_type: grant.grant_type || "symposium_bonus",
        unit_price: 0, // Bonus webinars are free
        verified_at: grant.granted_at,
        order_id: grant.order_id,
        grant_id: grant.id,
      })
    })

    console.log("[v0] Total webinar registrations:", webinarList.length)

    const { data: allPaymentsData, error: allPaymentsError } = await supabaseAdmin
      .from("order_payments")
      .select(`
        *,
        orders!order_payments_order_id_fkey (
          *,
          order_items (*)
        )
      `)
      .or("payment_proof_url.not.is.null,payment_method.ilike.sponsored") // Include sponsored payments
      .order("created_at", { ascending: false })

    if (allPaymentsError) {
      console.error("[v0] Error fetching all payments:", allPaymentsError)
    }

    // Fetch profiles for payment proof submitters
    const paymentUserIds = allPaymentsData?.map((p) => p.user_id).filter(Boolean) as string[]
    const { data: paymentProfilesData, error: paymentProfilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("id", paymentUserIds)

    if (paymentProfilesError) {
      console.error("[v0] Error fetching payment profiles:", paymentProfilesError)
    }

    const paymentProfilesMap = new Map(paymentProfilesData?.map((p) => [p.id, p]) || [])

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
          title: "Payment Proofs",
        },
      },
    })

    // Add E-Poster Submissions sheet
    updateRequests.push({
      addSheet: {
        properties: {
          sheetId: EVENT_OPTIONS.length + 3,
          title: "E-Poster Submissions",
        },
      },
    })

    updateRequests.push({
      addSheet: {
        properties: {
          sheetId: EVENT_OPTIONS.length + 4,
          title: "Webinar Registrations",
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
      "Payment Type", // New column for Bank Transfer vs Sponsored
      "Sponsor Name", // New column for sponsor name
      "Payment Proof Submitted",
      "Payment Proof URL",
      "Payment Amount",
      "Payment Date",
      "Payment Proof ID",
      "Payment File Type",
      "Webinar Access",
    ]

    const paymentProofMap = new Map()
    allPaymentsData?.forEach((payment) => {
      if (payment.user_id) {
        // Store the most recent payment for each user (including sponsored)
        if (!paymentProofMap.has(payment.user_id)) {
          const isSponsored = payment.payment_method?.toLowerCase() === "sponsored"
          paymentProofMap.set(payment.user_id, {
            payment_proof_url: payment.payment_proof_url,
            amount: payment.amount,
            created_at: payment.created_at,
            transaction_reference: payment.transaction_reference,
            file_type: payment.payment_proof_url?.split(".").pop()?.toUpperCase() || "N/A",
            payment_method: payment.payment_method,
            sponsor_name: payment.sponsor_name,
            is_sponsored: isSponsored,
          })
        }
      }
    })

    const userWebinarMap = new Map<string, string[]>()
    webinarList.forEach((reg) => {
      if (reg.user_id) {
        const existing = userWebinarMap.get(reg.user_id) || []
        const accessLabel = reg.access_type === "purchased" ? "(Purchased)" : "(Bonus)"
        existing.push(`${reg.webinar_short_title || reg.webinar_title} ${accessLabel}`)
        userWebinarMap.set(reg.user_id, existing)
      }
    })

    const comprehensiveRows = comprehensiveAttendees.map((attendee) => {
      const paymentProof = paymentProofMap.get(attendee.user_id)
      const isSponsored = paymentProof?.is_sponsored
      const webinarAccess = userWebinarMap.get(attendee.user_id) || []

      return [
        attendee.title_degree
          ? `${attendee.title_degree} ${attendee.full_name || ""}`.trim()
          : attendee.full_name || "",
        attendee.satu_sehat_name || "",
        attendee.satu_sehat_email || attendee.email || "",
        attendee.nik || "",
        attendee.institution || "",
        attendee.phone || "",
        attendee.event_label || "",
        attendee.participant_type_label || "",
        attendee.verified_at ? new Date(attendee.verified_at).toLocaleDateString() : "",
        isSponsored ? "Sponsored" : "Bank Transfer", // Payment type column
        paymentProof?.sponsor_name || "", // Sponsor name column
        isSponsored ? "N/A" : paymentProof ? "Yes" : "No",
        paymentProof?.payment_proof_url || "",
        paymentProof ? `Rp ${paymentProof.amount?.toLocaleString("id-ID")}` : "",
        paymentProof?.created_at ? new Date(paymentProof.created_at).toLocaleDateString() : "",
        paymentProof?.transaction_reference || "",
        paymentProof?.file_type || "",
        webinarAccess.length > 0 ? webinarAccess.join(", ") : "None",
      ]
    })

    const eventUserIds = new Set(comprehensiveAttendees.map((a) => a.user_id))
    const webinarOnlyUsers = webinarList.filter((w) => !eventUserIds.has(w.user_id))

    // Group webinar-only users by user_id to avoid duplicates
    const webinarOnlyUsersMap = new Map<string, any>()
    webinarOnlyUsers.forEach((reg) => {
      if (reg.user_id && !webinarOnlyUsersMap.has(reg.user_id)) {
        webinarOnlyUsersMap.set(reg.user_id, reg)
      }
    })

    // Add webinar-only users to comprehensive rows
    webinarOnlyUsersMap.forEach((reg, userId) => {
      const paymentProof = paymentProofMap.get(userId)
      const isSponsored = paymentProof?.is_sponsored
      const webinarAccess = userWebinarMap.get(userId) || []

      comprehensiveRows.push([
        reg.title_degree ? `${reg.title_degree} ${reg.full_name || ""}`.trim() : reg.full_name || "",
        reg.satu_sehat_name || "",
        reg.satu_sehat_email || reg.email || "",
        reg.nik || "",
        reg.institution || "",
        reg.phone || "",
        "Webinar Only", // Event label for webinar-only users
        "Webinar Participant", // Participant type
        reg.verified_at ? new Date(reg.verified_at).toLocaleDateString() : "",
        isSponsored ? "Sponsored" : reg.unit_price > 0 ? "Bank Transfer" : "Free (Bonus)",
        paymentProof?.sponsor_name || "",
        isSponsored ? "N/A" : paymentProof ? "Yes" : "No",
        paymentProof?.payment_proof_url || "",
        paymentProof ? `Rp ${paymentProof.amount?.toLocaleString("id-ID")}` : "",
        paymentProof?.created_at ? new Date(paymentProof.created_at).toLocaleDateString() : "",
        paymentProof?.transaction_reference || "",
        paymentProof?.file_type || "",
        webinarAccess.length > 0 ? webinarAccess.join(", ") : "None",
      ])
    })

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

      const headers = ["Full Name", "Email", "Phone", "Institution", "Position", "Participant Type", "Price Paid (IDR)", "Original Price (IDR)", "Discount Amount (IDR)", "Price Type", "Verified At"]
      const rows = list.map((a) => {
        const pricePaid = a.unit_price ?? 0
        const originalPrice = a.original_price ?? pricePaid
        const discountAmount = a.discount_amount ?? 0
        let priceType = "Full Price"
        if (discountAmount > 0) priceType = "Discounted"
        else if (pricePaid < originalPrice) priceType = "Early Bird"
        return [
          a.full_name || "",
          a.email || "",
          a.phone || "",
          a.institution || "",
          a.position || "",
          a.participant_type_label || "",
          pricePaid,
          originalPrice,
          discountAmount,
          priceType,
          a.verified_at ? new Date(a.verified_at).toLocaleDateString() : "",
        ]
      })

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

    const paymentProofHeaders = [
      "Unique ID",
      "Submitter Name",
      "Email",
      "Phone",
      "Institution",
      "Order ID",
      "Amount Paid",
      "Currency",
      "Payment Type", // Renamed from Payment Method for clarity
      "Sponsor Name", // New column
      "Bank Name",
      "Account Name",
      "Payment Status",
      "Payment Proof URL",
      "File Type",
      "Submission Date",
      "Verification Date",
      "Verified By",
      "Notes",
    ]

    const paymentProofRows = (allPaymentsData || []).map((payment) => {
      const profile = paymentProfilesMap.get(payment.user_id) || {}
      const order = payment.orders
      const isSponsored = payment.payment_method?.toLowerCase() === "sponsored"

      // Determine file type from URL
      let fileType = isSponsored ? "N/A" : "Unknown"
      if (payment.payment_proof_url) {
        if (payment.payment_proof_url.toLowerCase().includes(".pdf")) {
          fileType = "PDF"
        } else if (payment.payment_proof_url.toLowerCase().match(/\.(jpg|jpeg)$/)) {
          fileType = "JPG/JPEG"
        } else if (payment.payment_proof_url.toLowerCase().includes(".png")) {
          fileType = "PNG"
        }
      }

      return [
        payment.transaction_reference || payment.id, // Unique identifier
        profile.full_name || order?.full_name || "",
        profile.email || order?.email || "",
        profile.phone || order?.phone || "",
        profile.institution || order?.institution || "",
        payment.order_id || "",
        payment.amount || 0,
        payment.currency || "IDR",
        isSponsored ? "Sponsored" : payment.payment_method || "Bank Transfer", // Payment type
        payment.sponsor_name || "", // Sponsor name
        isSponsored ? "N/A" : payment.bank_name || "",
        isSponsored ? "N/A" : payment.account_name || "",
        payment.payment_status || "pending",
        payment.payment_proof_url || (isSponsored ? "N/A - Sponsored" : ""),
        fileType,
        payment.created_at ? new Date(payment.created_at).toLocaleString() : "",
        payment.verified_at ? new Date(payment.verified_at).toLocaleString() : "",
        payment.verified_by || "",
        payment.notes || "",
      ]
    })

    const paymentProofValues = [paymentProofHeaders, ...paymentProofRows]

    console.log("[v0] Writing payment proof data to sheet. Rows:", paymentProofRows.length)

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'Payment Proofs'!A1",
      valueInputOption: "RAW",
      requestBody: { values: paymentProofValues },
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
        profile.institution || "", // Get institution from profile
        poster.authors || "",
        poster.category || "", // Category field: Case Report or Research
        poster.keywords || "", // Keywords field: Medical specialty topic
        poster.submission_status || "Pending",
        poster.created_at ? new Date(poster.created_at).toLocaleDateString() : "",
        poster.updated_at ? new Date(poster.updated_at).toLocaleDateString() : "",
        poster.content || "", // content field contains abstract PDF URL
        poster.file_url || "", // file_url contains poster file URL
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

    const webinarHeaders = [
      "Full Name with Titles/Degrees",
      "Email",
      "Phone",
      "Institution",
      "Position",
      "Webinar Title",
      "Webinar Date",
      "Webinar Time",
      "Access Type",
      "Amount Paid",
      "Order ID",
      "Registered/Granted At",
    ]

    const webinarRows = webinarList.map((reg) => [
      reg.title_degree ? `${reg.title_degree} ${reg.full_name || ""}`.trim() : reg.full_name || "",
      reg.email || "",
      reg.phone || "",
      reg.institution || "",
      reg.position || "",
      reg.webinar_short_title || reg.webinar_title || "",
      reg.webinar_date ? new Date(reg.webinar_date).toLocaleDateString() : "TBD",
      reg.webinar_time ? `${reg.webinar_time} WIB` : "TBD",
      reg.access_type === "purchased"
        ? "Purchased"
        : reg.access_type === "symposium_bonus"
          ? "Symposium Bonus"
          : reg.access_type || "Unknown",
      reg.unit_price ? `Rp ${reg.unit_price.toLocaleString("id-ID")}` : "Free (Bonus)",
      reg.order_id || "",
      reg.verified_at ? new Date(reg.verified_at).toLocaleDateString() : "",
    ])

    const webinarValues = [webinarHeaders, ...webinarRows]

    console.log("[v0] Writing webinar data to sheet. Rows:", webinarRows.length)

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "'Webinar Registrations'!A1",
      valueInputOption: "RAW",
      requestBody: { values: webinarValues },
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
        paymentProofs: allPaymentsData?.length || 0,
        webinarRegistrations: webinarList.length,
      },
    })
  } catch (error: any) {
    console.error("[v0] Google Sheets sync error:", error)
    return NextResponse.json({ error: error.message || "Failed to sync to Google Sheets" }, { status: 500 })
  }
}
