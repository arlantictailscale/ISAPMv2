/**
 * Admin Authorization Helper
 * Centralized admin authentication and authorization
 */

import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export interface AdminAuthResult {
  authorized: boolean
  user?: {
    id: string
    email: string
    role: string
  }
  error?: string
  status?: number
}

/**
 * Verify admin authorization for API routes
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        authorized: false,
        error: "Authentication required",
        status: 401,
      }
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return {
        authorized: false,
        error: "User profile not found",
        status: 403,
      }
    }

    // Check admin role
    if (profile.role !== "admin") {
      console.warn(`[Security] Unauthorized admin access attempt by user: ${user.id}`)
      return {
        authorized: false,
        error: "Admin access required",
        status: 403,
      }
    }

    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email || "",
        role: profile.role,
      },
    }
  } catch (error) {
    console.error("[Security] Admin auth error:", error)
    return {
      authorized: false,
      error: "Authorization failed",
      status: 500,
    }
  }
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(result: AdminAuthResult): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status || 403 })
}

/**
 * Wrap an API handler with admin auth check
 */
export function withAdminAuth(handler: (request: NextRequest, user: AdminAuthResult["user"]) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAdminAuth(request)

    if (!authResult.authorized) {
      return unauthorizedResponse(authResult)
    }

    return handler(request, authResult.user)
  }
}
