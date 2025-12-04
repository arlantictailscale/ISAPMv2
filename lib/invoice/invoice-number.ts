import { createClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations
function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    console.error("[v0] Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
    return null
  }

  console.log("[v0] Creating Supabase admin client for invoice number generation")

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Generate a sequential invoice number
 * Format: XXXX-ISAPM (e.g., 0001-ISAPM, 0002-ISAPM)
 *
 * The sequence is global and continues incrementing with each new transaction.
 * It does NOT reset daily - it's a continuous sequence.
 *
 * @param date - The invoice date (used for database record, not in the format)
 * @returns Promise<string> - The generated invoice number
 *
 * @example
 * generateSequentialInvoiceNumber() // "0001-ISAPM"
 * generateSequentialInvoiceNumber() // "0002-ISAPM"
 * generateSequentialInvoiceNumber() // "0003-ISAPM"
 */
export async function generateSequentialInvoiceNumber(date: Date = new Date()): Promise<string> {
  const supabase = getSupabaseAdmin()

  // If Supabase is not available, use fallback immediately
  if (!supabase) {
    console.error("[v0] Supabase not available, using fallback invoice number")
    return generateFallbackInvoiceNumber(date)
  }

  try {
    const { data, error } = await supabase.rpc("get_next_invoice_sequence", {
      p_date: "2025-01-01", // Fixed date to maintain global sequence
    })

    if (error) {
      console.error("[v0] Error getting next invoice sequence:", error)
      return generateFallbackInvoiceNumber(date)
    }

    const sequence = (data as number).toString().padStart(4, "0")
    return `${sequence}-ISAPM`
  } catch (error) {
    console.error("[v0] Error generating sequential invoice number:", error)
    return generateFallbackInvoiceNumber(date)
  }
}

/**
 * Fallback invoice number generation using random suffix
 * Format: XXXX-ISAPM (random 4-digit number)
 */
export function generateFallbackInvoiceNumber(date: Date = new Date(), orderId?: string): string {
  if (orderId) {
    // Use first 4 chars of order ID as a pseudo-sequence
    const numericSuffix = orderId.replace(/\D/g, "").slice(0, 4).padStart(4, "0")
    return `${numericSuffix}-ISAPM`
  }

  // Generate random 4-digit number
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${randomNum}-ISAPM`
}

/**
 * Validate invoice number format
 * Accepts both formats:
 * - New: XXXX-ISAPM (e.g., 0001-ISAPM)
 * - Legacy: Natmet-YYMMDD-XXXX or Natmet-YYMMDDSUFX
 */
export function validateInvoiceNumber(invoiceNumber: string): boolean {
  const newPattern = /^\d{4}-ISAPM$/

  // Legacy sequential format: Natmet-YYMMDD-XXXX
  const sequentialPattern = /^Natmet-\d{6}-\d{4}$/

  // Legacy format: Natmet-YYMMDDSUFX (4 alphanumeric chars)
  const legacyPattern = /^Natmet-\d{6}[A-Z0-9]{4}$/

  return newPattern.test(invoiceNumber) || sequentialPattern.test(invoiceNumber) || legacyPattern.test(invoiceNumber)
}

/**
 * Parse invoice number to extract sequence
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string
  date: Date | null
  sequence: string
  isSequential: boolean
} | null {
  const newMatch = invoiceNumber.match(/^(\d{4})-ISAPM$/)
  if (newMatch) {
    const [, sequence] = newMatch
    return {
      prefix: "ISAPM",
      date: null, // No date in new format
      sequence,
      isSequential: true,
    }
  }

  // Legacy sequential format: Natmet-YYMMDD-XXXX
  const sequentialMatch = invoiceNumber.match(/^(Natmet)-(\d{2})(\d{2})(\d{2})-(\d{4})$/)
  if (sequentialMatch) {
    const [, prefix, year, month, day, sequence] = sequentialMatch
    const fullYear = 2000 + Number.parseInt(year)
    return {
      prefix,
      date: new Date(fullYear, Number.parseInt(month) - 1, Number.parseInt(day)),
      sequence,
      isSequential: true,
    }
  }

  // Legacy format: Natmet-YYMMDDSUFX
  const legacyMatch = invoiceNumber.match(/^(Natmet)-(\d{2})(\d{2})(\d{2})([A-Z0-9]{4})$/)
  if (legacyMatch) {
    const [, prefix, year, month, day, sequence] = legacyMatch
    const fullYear = 2000 + Number.parseInt(year)
    return {
      prefix,
      date: new Date(fullYear, Number.parseInt(month) - 1, Number.parseInt(day)),
      sequence,
      isSequential: false,
    }
  }

  return null
}

/**
 * Get current total invoice count (for admin dashboard)
 */
export async function getTodayInvoiceCount(): Promise<number> {
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    return 0
  }

  try {
    const { data, error } = await supabase
      .from("invoice_counters")
      .select("last_sequence")
      .eq("counter_date", "2025-01-01")
      .single()

    if (error || !data) {
      return 0
    }

    return data.last_sequence
  } catch {
    return 0
  }
}
