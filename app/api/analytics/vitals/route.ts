import { type NextRequest, NextResponse } from "next/server"

/**
 * API endpoint to receive Web Vitals metrics
 * Can be extended to send to custom analytics platforms
 */
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json()

    // Log to server for debugging
    console.log("[Server] Web Vital:", {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      path: metric.path,
    })

    // TODO: Send to custom analytics platform
    // await sendToAnalytics(metric)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Server] Error logging web vital:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
