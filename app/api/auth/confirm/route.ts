import { createClient } from "@/lib/supabase/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Get parameters from URL
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  const code = searchParams.get("code")

  console.log("[v0] Email confirmation request:", {
    token_hash: token_hash ? token_hash.substring(0, 20) + "..." : null,
    type,
    code: !!code,
    isPKCE: token_hash?.startsWith("pkce_"),
    next,
  })

  // Determine redirect URL based on success/failure
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete("token_hash")
  redirectTo.searchParams.delete("type")
  redirectTo.searchParams.delete("next")
  redirectTo.searchParams.delete("code")

  const supabase = await createClient()

  if (code) {
    console.log("[v0] Using exchangeCodeForSession (PKCE flow)")
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] exchangeCodeForSession error:", error)
      redirectTo.pathname = "/auth/login"
      redirectTo.searchParams.set("error", error.message)
      return NextResponse.redirect(redirectTo)
    }

    if (data.session) {
      console.log("[v0] PKCE Session established for:", data.user?.email)
      redirectTo.pathname = "/auth/email-confirmed"
      return NextResponse.redirect(redirectTo)
    }
  }

  if (token_hash && type) {
    // PKCE tokens start with 'pkce_' and need different handling
    if (token_hash.startsWith("pkce_")) {
      console.log("[v0] Detected PKCE token format - this requires ConfirmationURL flow")

      // For PKCE tokens, we need to try verifyOtp but it may fail
      // The proper solution is to use {{ .ConfirmationURL }} in email template
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      console.log("[v0] PKCE verifyOtp result:", {
        success: !!data?.session,
        user: data?.user?.email,
        error: error?.message,
        errorCode: error?.code,
      })

      if (error) {
        console.error("[v0] PKCE verifyOtp failed:", error.message)

        // Provide helpful error message
        redirectTo.pathname = "/auth/login"
        redirectTo.searchParams.set("error", `Verification failed: ${error.message}. Please try signing up again.`)
        return NextResponse.redirect(redirectTo)
      }

      if (data?.session) {
        console.log("[v0] Session established for:", data.user?.email)
        redirectTo.pathname = "/auth/email-confirmed"
        return NextResponse.redirect(redirectTo)
      }
    } else {
      // Standard OTP token hash
      console.log("[v0] Using standard verifyOtp")
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      console.log("[v0] verifyOtp result:", {
        success: !!data?.session,
        user: data?.user?.email,
        error: error?.message,
      })

      if (error) {
        console.error("[v0] verifyOtp error:", error)
        redirectTo.pathname = "/auth/login"
        redirectTo.searchParams.set("error", error.message)
        return NextResponse.redirect(redirectTo)
      }

      if (data?.session) {
        console.log("[v0] Session established for:", data.user?.email)
        if (type === "signup" || type === "email") {
          redirectTo.pathname = "/auth/email-confirmed"
        }
        return NextResponse.redirect(redirectTo)
      }
    }
  }

  // If we get here, something went wrong
  console.error("[v0] Missing required parameters")
  redirectTo.pathname = "/auth/login"
  redirectTo.searchParams.set("error", "Invalid confirmation link")
  return NextResponse.redirect(redirectTo)
}
