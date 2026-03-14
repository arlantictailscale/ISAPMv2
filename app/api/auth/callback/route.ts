import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[v0] Auth callback route triggered")
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const redirect_to = requestUrl.searchParams.get("redirect_to") || "/dashboard"
  const origin = requestUrl.origin

  // Mobile detection for debugging auth loops
  const userAgent = request.headers.get("user-agent") || ""
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isMobileChrome = (isMobile && /Chrome/i.test(userAgent)) || /CriOS/i.test(userAgent)

  console.log("[v0] Callback params:", {
    code: !!code,
    token_hash: !!token_hash,
    type,
    error,
    error_description,
    isMobile,
    isMobileChrome,
    userAgent: userAgent.substring(0, 100), // Truncate for logging
  })

  // Handle OAuth errors
  if (error) {
    console.error("[v0] OAuth error:", error, error_description)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error_description || error)}`)
  }

  const supabase = await createClient()

  if (token_hash && type) {
    console.log("[v0] Processing email verification token...")

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "signup" | "email",
      })

      if (verifyError) {
        console.error("[v0] Error verifying email token:", verifyError)
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent("Email verification failed: " + verifyError.message)}`,
        )
      }

      console.log("[v0] Email verified successfully for user:", data.user?.email)

      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

        if (!profile) {
          console.log("[v0] Creating profile for verified user")
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || null,
            first_name: data.user.user_metadata?.first_name || null,
            last_name: data.user.user_metadata?.last_name || null,
            role: "user",
          })

          if (profileError) {
            console.error("[v0] Error creating profile:", profileError)
          }
        }
      }

      return NextResponse.redirect(`${origin}${redirect_to}`)
    } catch (err) {
      console.error("[v0] Unexpected error verifying email:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Email verification failed")}`)
    }
  }

  if (code) {
    try {
      console.log("[v0] Exchanging OAuth code for session...")

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

      return NextResponse.redirect(`${origin}${redirect_to}`)
    } catch (err) {
      console.error("[v0] Unexpected error in OAuth callback:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Authentication failed")}`)
    }
  }

  console.warn("[v0] No code or token_hash provided in callback")
  return NextResponse.redirect(`${origin}/auth/login`)
}
