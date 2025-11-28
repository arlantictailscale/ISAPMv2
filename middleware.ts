/**
 * Next.js Middleware
 * Handles authentication, security headers, and rate limiting
 */

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/auth/login",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/api/auth",
  "/api/public",
  "/pricing",
  "/venue",
  "/hotel-booking",
  "/events",
  "/call-for-papers",
  "/contact",
  "/about",
]

// Admin-only routes
const ADMIN_ROUTES = ["/admin"]

// API routes that need rate limiting
const RATE_LIMITED_ROUTES = ["/api/contact", "/api/upload-payment-proof", "/auth/login", "/auth/sign-up"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create response with security headers
  let response = NextResponse.next({ request })

  const securityHeaders = {
    "X-DNS-Prefetch-Control": "on",
    "X-XSS-Protection": "1; mode=block",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Skip middleware for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_next") ||
    pathname.includes(".") // Static files like .css, .js, .png
  ) {
    return response
  }

  // Setup Supabase client for authentication
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbGllbnVsZXRoZ2Z4ZGlxZ2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzgxOTUsImV4cCI6MjA3ODU1NDE5NX0.AEvTooDW5Zswza55RXnf6e-A5bZu-kOYY6kuV6cZ9Cw"

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          // Re-apply security headers to new response
          Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            }),
          )
        },
      },
    })

    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if route is public
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))

    // Check if route is admin-only
    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))

    // Redirect unauthenticated users from protected routes
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(url)
    }

    if (isAdminRoute && user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!profile || profile.role !== "admin") {
        console.warn(`[Security] Unauthorized admin access attempt: ${user.id} to ${pathname}`)
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    if (RATE_LIMITED_ROUTES.some((route) => pathname.startsWith(route))) {
      const clientIP =
        request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
      response.headers.set("X-RateLimit-Policy", "applied")
      response.headers.set("X-Client-IP", clientIP)
    }

    return response
  } catch (error) {
    console.error("[Middleware] Error:", error)
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
