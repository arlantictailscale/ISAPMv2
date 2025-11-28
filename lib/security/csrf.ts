/**
 * CSRF Protection Utility
 * Generates and validates CSRF tokens for forms
 */

import { cookies } from "next/headers"

const CSRF_COOKIE_NAME = "csrf_token"
const CSRF_HEADER_NAME = "x-csrf-token"
const TOKEN_LENGTH = 32

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * Get or create CSRF token for the current session
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!token) {
    token = generateToken()
    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  return token
}

/**
 * Validate CSRF token from request
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!cookieToken) {
    return false
  }

  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken && timingSafeEqual(headerToken, cookieToken)) {
    return true
  }

  // Check form data if it's a form submission
  const contentType = request.headers.get("content-type") || ""
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.clone().formData()
      const formToken = formData.get("csrf_token") as string
      if (formToken && timingSafeEqual(formToken, cookieToken)) {
        return true
      }
    } catch {
      // Ignore form parsing errors
    }
  }

  // Check JSON body
  if (contentType.includes("application/json")) {
    try {
      const body = await request.clone().json()
      if (body.csrf_token && timingSafeEqual(body.csrf_token, cookieToken)) {
        return true
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }

  return false
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}
