import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)

  // Add cache headers for static assets
  const url = request.nextUrl.pathname

  if (url.startsWith("/images/") || url.startsWith("/_next/static/")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable")
  }

  // Add cache headers for API routes that can be cached
  if (url.startsWith("/api/") && request.method === "GET") {
    // Default short cache for API routes
    if (!response.headers.has("Cache-Control")) {
      response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
