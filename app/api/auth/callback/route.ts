import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[v0] Auth callback route triggered")
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const origin = requestUrl.origin

  console.log("[v0] Callback params:", { code: !!code, error, error_description })

  if (error) {
    console.error("[v0] OAuth error:", error, error_description)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const cookieStore = await cookies()

    const response = NextResponse.redirect(`${origin}/dashboard`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbGllbnVsZXRoZ2Z4ZGlxZ2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzgxOTUsImV4cCI6MjA3ODU1NDE5NX0.AEvTooDW5Zswza55RXnf6e-A5bZu-kOYY6kuV6cZ9Cw",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    try {
      console.log("[v0] Exchanging code for session...")

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("[v0] Error exchanging code:", exchangeError)
        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
      }

      console.log("[v0] Session created successfully for user:", data.user?.email)

      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

        if (!profile) {
          console.log("[v0] Creating new profile for OAuth user")
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            first_name: data.user.user_metadata?.given_name || null,
            last_name: data.user.user_metadata?.family_name || null,
            role: "user",
          })

          if (profileError) {
            console.error("[v0] Error creating profile:", profileError)
          }

          // Send welcome email for new OAuth users
          try {
            await fetch(`${origin}/api/send-welcome-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: data.user.email,
                userId: data.user.id,
                userName:
                  data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0],
              }),
            })
          } catch (emailError) {
            console.error("[v0] Error sending welcome email:", emailError)
          }
        }
      }

      return response
    } catch (err) {
      console.error("[v0] Unexpected error in callback:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Authentication failed")}`)
    }
  }

  console.warn("[v0] No code provided in callback")
  return NextResponse.redirect(`${origin}/auth/login`)
}
