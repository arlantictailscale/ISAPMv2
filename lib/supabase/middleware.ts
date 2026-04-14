import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = new Set([
  "/",
  "/pricing",
  "/venue",
  "/hotel-booking",
  "/events",
  "/call-for-papers",
  "/webinar",
  "/news",
  "/akomodasi",
  "/registrasi",
  "/privacy-policy",
  "/terms-of-service",
  "/sponsors",
  "/pain-clinic-survey",
  "/pain-clinic-survey/qr",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
])

const PUBLIC_PREFIXES = [
  "/auth",
  "/api/auth",
  "/api/public",
  "/api/contact",
  "/api/cron",
  "/events/",
  "/webinar/",
  "/news/",
  "/akomodasi/",
  "/_next",
  "/images",
  "/fonts",
]

const STATIC_FILE_REGEX = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|map|json|xml|txt)$/i

function isPublicPath(pathname: string): boolean {
  // Static files - check first as most common
  if (STATIC_FILE_REGEX.test(pathname)) return true

  // Exact matches (O(1) lookup)
  if (PUBLIC_PATHS.has(pathname)) return true

  // Prefix matches
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbGllbnVsZXRoZ2Z4ZGlxZ2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzgxOTUsImV4cCI6MjA3ODU1NDE5NX0.AEvTooDW5Zswza55RXnf6e-A5bZu-kOYY6kuV6cZ9Cw"

  // Detect mobile browsers for adjusted cookie handling
  const userAgent = request.headers.get("user-agent") || ""
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Ensure mobile-safe cookie settings to prevent auth loops
            const safeOptions = {
              ...options,
              sameSite: "lax" as const, // Required for OAuth redirects on mobile
              secure: process.env.NODE_ENV === "production",
              path: "/",
              // Extend maxAge slightly for mobile to handle slower connections
              maxAge: options?.maxAge || (isMobile ? 60 * 60 * 24 * 7 : undefined), // 7 days for mobile
            }
            supabaseResponse.cookies.set(name, value, safeOptions)
          })
        },
      },
    })

    // getSession() validates JWT locally without database call
    // getUser() makes a database call to verify user exists
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Redirect unauthenticated users from protected routes to login
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo|manifest|robots|sitemap|sw|workbox|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|map|json)$).*)",
  ],
}
