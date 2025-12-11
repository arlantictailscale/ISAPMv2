import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  // Capture all parameters
  const params: Record<string, string | null> = {}
  requestUrl.searchParams.forEach((value, key) => {
    params[key] = value
  })

  // Also capture hash parameters (though they won't be visible server-side)
  const fullUrl = request.url

  return NextResponse.json(
    {
      url: fullUrl,
      origin: requestUrl.origin,
      pathname: requestUrl.pathname,
      searchParams: params,
      timestamp: new Date().toISOString(),
      message: "This endpoint shows all URL parameters sent in the confirmation email",
    },
    { status: 200 },
  )
}
