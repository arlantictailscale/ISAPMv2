import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  console.log("[v0] Auth callback route triggered")
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token = requestUrl.searchParams.get("token")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const error = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const redirect_to = requestUrl.searchParams.get("redirect_to")
  const origin = requestUrl.origin

  console.log("[v0] Callback params:", {
    code: !!code,
    token: !!token,
    token_hash: !!token_hash,
    type,
    error,
    error_description,
    redirect_to,
  })

  if (error) {
    console.error("[v0] OAuth error:", error, error_description)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error_description || error)}`)
  }

  const supabase = await createClient()

  if (token && type) {
    try {
      console.log("[v0] Verifying email with token, type:", type)

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
      })

      if (verifyError) {
        console.error("[v0] Error verifying token:", verifyError)
        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(verifyError.message)}`)
      }

      console.log("[v0] Email verified successfully for user:", data.user?.email)

      // Redirect to the specified URL or email-confirmed page
      const finalRedirect = redirect_to || `${origin}/auth/email-confirmed`
      return NextResponse.redirect(finalRedirect)
    } catch (err) {
      console.error("[v0] Unexpected error verifying token:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Email verification failed")}`)
    }
  }

  if (token_hash && type) {
    try {
      console.log("[v0] Verifying with token_hash, type:", type)

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token_hash,
        type: type as "signup" | "email" | "recovery" | "invite" | "email_change",
      })

      if (verifyError) {
        console.error("[v0] Error verifying token_hash:", verifyError)
        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(verifyError.message)}`)
      }

      console.log("[v0] Token hash verified successfully for user:", data.user?.email)

      const finalRedirect = redirect_to || `${origin}/auth/email-confirmed`
      return NextResponse.redirect(finalRedirect)
    } catch (err) {
      console.error("[v0] Unexpected error verifying token_hash:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Verification failed")}`)
    }
  }

  // Handle OAuth code exchange (existing logic)
  if (code) {
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
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    } catch (err) {
      console.error("[v0] Unexpected error in callback:", err)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent("Authentication failed")}`)
    }
  }

  console.warn("[v0] No code or token provided in callback")
  return NextResponse.redirect(`${origin}/auth/login?error=no_session`)
}
