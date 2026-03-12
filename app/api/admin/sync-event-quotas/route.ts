import { type NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { quotas } = await request.json()

    if (!quotas || !Array.isArray(quotas)) {
      return NextResponse.json({ error: "Invalid quotas data" }, { status: 400 })
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

    if (!spreadsheetId) {
      return NextResponse.json({ error: "Google Spreadsheet ID not configured" }, { status: 500 })
    }

    const sheetName = "Event Quotas"

    // Check if the sheet exists, create if not
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const existingSheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === sheetName
    )

    if (!existingSheet) {
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
    }

    // Prepare data rows
    const timestamp = new Date().toISOString()
    const headers = ["Event Name", "Event ID", "Max Capacity", "Registered", "Available", "Utilization %", "Status", "Last Synced"]
    
    const rows = quotas.map((q: any) => [
      q.event_name,
      q.event_id,
      q.max_capacity,
      q.registered_count,
      q.available_seats,
      `${q.percentage_filled}%`,
      q.is_sold_out ? "SOLD OUT" : q.is_low_stock ? "LOW STOCK" : "AVAILABLE",
      timestamp,
    ])

    // Add totals row
    const totalCapacity = quotas.reduce((sum: number, q: any) => sum + q.max_capacity, 0)
    const totalRegistered = quotas.reduce((sum: number, q: any) => sum + q.registered_count, 0)
    const overallUtilization = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0

    rows.push([
      "TOTAL",
      "",
      totalCapacity,
      totalRegistered,
      totalCapacity - totalRegistered,
      `${overallUtilization}%`,
      "",
      timestamp,
    ])

    // Clear existing data and write new data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sheetName}'!A:H`,
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers, ...rows],
      },
    })

    // Format header row
    const sheetId = existingSheet?.properties?.sheetId ?? (
      await sheets.spreadsheets.get({ spreadsheetId })
    ).data.sheets?.find((s) => s.properties?.title === sheetName)?.properties?.sheetId

    if (sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  },
                },
                fields: "userEnteredFormat(backgroundColor,textFormat)",
              },
            },
            {
              autoResizeDimensions: {
                dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 8 },
              },
            },
          ],
        },
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${quotas.length} event quotas to Google Sheets`,
      sheetName,
    })
  } catch (error: any) {
    console.error("[v0] Error syncing event quotas to Google Sheets:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync to Google Sheets" },
      { status: 500 }
    )
  }
}
