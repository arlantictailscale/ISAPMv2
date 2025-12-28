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
  "/privacy-policy",
  "/terms-of-service",
])

const PUBLIC_PREFIXES = ["/auth", "/api/auth", "/api/public", "/api/contact", "/api/cron", "/events/", "/webinar/"]

function isPublicPath(pathname: string): boolean {
  // Check exact matches first (faster)
  if (PUBLIC_PATHS.has(pathname)) return true

  // Check prefixes
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
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // Only refresh the session token if it exists - don't call getUser()
    // This is much faster as it only validates the JWT locally without DB call
    await supabase.auth.getSession()

    return supabaseResponse
  } catch (error) {
    console.error("Middleware session refresh error:", error)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo|manifest|robots|sitemap|sw|workbox|api/public|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|map|json|xml|txt)$).*)",
  ],
}
