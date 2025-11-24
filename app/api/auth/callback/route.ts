import { createClient } from "@/lib/supabase/server"
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
    try {
      const supabase = await createClient()
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
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    } catch (err) {
      console.error("[v0] Unexpected error in callback:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Authentication failed")}`)
    }
  }

  console.warn("[v0] No code provided in callback")
  return NextResponse.redirect(`${origin}/auth/login`)
}
