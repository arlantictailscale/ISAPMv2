import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { google } from "googleapis"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting Feedback Google Sheets sync...")

    // Authenticate user - matches sync-google-sheets pattern
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

    // Fetch all feedback
    const { data: feedbackData, error: feedbackError } = await supabaseAdmin
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })

    if (feedbackError) {
      console.error("[v0] Error fetching feedback:", feedbackError)
      throw feedbackError
    }

    console.log("[v0] Found feedback entries:", feedbackData?.length || 0)

    // Initialize Google Sheets API - SAME credentials as sync-google-sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // Use SAME spreadsheet as confirmed-attendees sync
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "GOOGLE_SHEETS_SPREADSHEET_ID not configured" },
        { status: 400 }
      )
    }

    console.log("[v0] Syncing feedback to spreadsheet:", spreadsheetId)

    // Sheet tab name for feedback - dedicated tab that won't disturb others
    const sheetName = "Kritik & Saran"

    // Check if sheet tab exists, create if not
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
      const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) || []

      if (!existingSheets.includes(sheetName)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetName },
                },
              },
            ],
          },
        })
        console.log("[v0] Created new sheet tab:", sheetName)
      }
    } catch (err) {
      console.error("[v0] Error checking/creating sheet tab:", err)
    }

    // Prepare data for sheets
    const headers = [
      "ID",
      "Nama",
      "Email",
      "Kategori",
      "Pesan",
      "Status",
      "Dikirim Pada",
      "Terakhir Diperbarui",
    ]

    const rows = feedbackData?.map((item) => [
      item.id,
      item.name,
      item.email || "-",
      item.category,
      item.message,
      item.is_read ? "Read" : "Unread",
      format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss"),
      format(new Date(item.updated_at), "yyyy-MM-dd HH:mm:ss"),
    ]) || []

    // Clear existing data in the feedback tab only (won't affect other tabs)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    })

    // Write new data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers, ...rows],
      },
    })

    // Format header row with teal brand color
    try {
      const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
      const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === sheetName)
      const sheetId = sheet?.properties?.sheetId

      if (sheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.08, green: 0.47, blue: 0.47 },
                      textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                    },
                  },
                  fields: "userEnteredFormat(backgroundColor,textFormat)",
                },
              },
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: "COLUMNS",
                    startIndex: 0,
                    endIndex: headers.length,
                  },
                },
              },
            ],
          },
        })
      }
    } catch (formatError) {
      console.error("[v0] Error formatting sheet:", formatError)
    }

    console.log("[v0] Successfully synced feedback to Google Sheets")

    return NextResponse.json({
      success: true,
      syncedCount: feedbackData?.length || 0,
      message: `Synced ${feedbackData?.length || 0} feedback entries to "${sheetName}" tab`,
    })
  } catch (error: any) {
    console.error("[v0] Feedback sync error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync feedback" },
      { status: 500 }
    )
  }
}
