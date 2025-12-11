import { createClient } from "@/lib/supabase/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Get parameters from URL
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  console.log("[v0] Email confirmation request:", { token_hash: !!token_hash, type, next })

  // Determine redirect URL based on success/failure
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete("token_hash")
  redirectTo.searchParams.delete("type")
  redirectTo.searchParams.delete("next")

  if (token_hash && type) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    console.log("[v0] verifyOtp result:", {
      success: !!data.session,
      user: data.user?.email,
      error: error?.message,
    })

    if (error) {
      console.error("[v0] verifyOtp error:", error)
      redirectTo.pathname = "/auth/login"
      redirectTo.searchParams.set("error", error.message)
      return NextResponse.redirect(redirectTo)
    }

    if (data.session) {
      // Session established successfully
      console.log("[v0] Session established for:", data.user?.email)

      // For signup confirmations, redirect to success page
      if (type === "signup" || type === "email") {
        redirectTo.pathname = "/auth/email-confirmed"
      }

      return NextResponse.redirect(redirectTo)
    }
  }

  // If we get here, something went wrong
  console.error("[v0] Missing token_hash or type")
  redirectTo.pathname = "/auth/login"
  redirectTo.searchParams.set("error", "Invalid confirmation link")
  return NextResponse.redirect(redirectTo)
}
