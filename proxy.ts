import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Update Supabase session
  const response = await updateSession(request)

  // Add security headers to all responses
  const securityHeaders = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Protect admin routes
  const path = request.nextUrl.pathname
  if (path.startsWith("/admin")) {
    // Admin routes are protected by page-level auth checks
    // This adds an extra layer of security by checking the session cookie exists
    const supabaseAuthCookie = request.cookies
      .getAll()
      .find((cookie) => cookie.name.includes("auth-token") || cookie.name.includes("sb-"))

    if (!supabaseAuthCookie) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", path)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect authenticated routes
  const protectedPaths = [
    "/dashboard",
    "/my-registrations",
    "/my-orders",
    "/my-purchases",
    "/my-events",
    "/my-hotel-bookings",
    "/my-posters",
    "/checkout",
    "/submit-poster",
  ]
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p))

  if (isProtectedPath) {
    const supabaseAuthCookie = request.cookies
      .getAll()
      .find((cookie) => cookie.name.includes("auth-token") || cookie.name.includes("sb-"))

    if (!supabaseAuthCookie) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
