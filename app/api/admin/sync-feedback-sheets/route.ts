import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { google } from "googleapis"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting Feedback Google Sheets sync...")

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

    // Get the session from cookies for authentication
    const cookieHeader = request.headers.get("cookie") || ""
    const { createServerClient } = await import("@supabase/ssr")
    
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieHeader.split(";").map((cookie) => {
              const [name, ...rest] = cookie.trim().split("=")
              return { name, value: rest.join("=") }
            })
          },
          setAll() {},
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

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

    // Check for Google credentials
    const googleCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

    if (!googleCredentials || !spreadsheetId) {
      return NextResponse.json(
        { error: "Google Sheets not configured. Please add GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SPREADSHEET_ID." },
        { status: 400 }
      )
    }

    // Parse credentials
    let credentials
    try {
      credentials = JSON.parse(googleCredentials)
    } catch {
      return NextResponse.json(
        { error: "Invalid Google service account credentials" },
        { status: 400 }
      )
    }

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // Sheet name for feedback
    const sheetName = "Feedback"

    // Check if sheet exists, create if not
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
        console.log("[v0] Created new sheet:", sheetName)
      }
    } catch (err) {
      console.error("[v0] Error checking/creating sheet:", err)
    }

    // Prepare data for sheets
    const headers = [
      "ID",
      "Name",
      "Email",
      "Category",
      "Message",
      "Status",
      "Submitted At",
      "Last Updated",
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

    // Clear existing data and write new
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers, ...rows],
      },
    })

    // Format header row
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
                      backgroundColor: { red: 0.2, green: 0.6, blue: 0.6 },
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
      message: `Synced ${feedbackData?.length || 0} feedback entries to Google Sheets`,
    })
  } catch (error: any) {
    console.error("[v0] Feedback sync error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync feedback" },
      { status: 500 }
    )
  }
}
