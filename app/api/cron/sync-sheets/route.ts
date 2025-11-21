import { NextResponse } from "next/server"
import { syncUsersToGoogleSheets } from "@/app/actions/sync-google-sheets"

// This endpoint should be called by a cron job
// In vercel.json, configure: { "path": "/api/cron/sync-sheets", "schedule": "0 0 * * *" }
export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await syncUsersToGoogleSheets({
      anonymize: false,
      sheetName: "User Profiles - Auto Sync",
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Users synced to Google Sheets successfully",
      ...result,
    })
  } catch (error) {
    console.error("Cron sync error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sync failed" }, { status: 500 })
  }
}
