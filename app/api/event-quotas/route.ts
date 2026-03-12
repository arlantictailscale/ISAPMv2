import { NextResponse } from "next/server"
import { getAllEventQuotasWithStatus, getEventQuotaStatus } from "@/app/actions/get-event-quotas"

export const dynamic = "force-dynamic" // Ensure fresh data every time

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (eventId) {
      // Get status for specific event
      const status = await getEventQuotaStatus(eventId)
      if (!status) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      return NextResponse.json(status)
    } else {
      // Get all quotas
      const allStatus = await getAllEventQuotasWithStatus()
      return NextResponse.json(allStatus)
    }
  } catch (err: any) {
    console.error("[v0] API error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
