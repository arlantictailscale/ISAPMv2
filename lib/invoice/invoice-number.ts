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
 * Generate a sequential invoice number for a given date
 * Format: Natmet-YYMMDD-XXXX
 *
 * @param date - The invoice date (defaults to current date)
 * @returns Promise<string> - The generated invoice number
 *
 * @example
 * // First invoice on Dec 3, 2025
 * generateSequentialInvoiceNumber(new Date('2025-12-03')) // "Natmet-251203-0001"
 *
 * // Second invoice on same day
 * generateSequentialInvoiceNumber(new Date('2025-12-03')) // "Natmet-251203-0002"
 *
 * // First invoice on Dec 4, 2025 (counter resets)
 * generateSequentialInvoiceNumber(new Date('2025-12-04')) // "Natmet-251204-0001"
 */
export async function generateSequentialInvoiceNumber(date: Date = new Date()): Promise<string> {
  const supabase = getSupabaseAdmin()

  // Format date components
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const dateStr = `${year}${month}${day}`

  // If Supabase is not available, use fallback immediately
  if (!supabase) {
    console.error("[v0] Supabase not available, using fallback invoice number")
    return generateFallbackInvoiceNumber(date)
  }

  // Format date for database (YYYY-MM-DD)
  const dbDate = `${date.getFullYear()}-${month}-${day}`

  try {
    // Call the database function to get next sequence (atomic operation)
    const { data, error } = await supabase.rpc("get_next_invoice_sequence", {
      p_date: dbDate,
    })

    if (error) {
      console.error("[v0] Error getting next invoice sequence:", error)
      // Fallback to UUID-based if database call fails
      return generateFallbackInvoiceNumber(date)
    }

    // Format sequence as 4-digit number with leading zeros
    const sequence = (data as number).toString().padStart(4, "0")

    return `Natmet-${dateStr}-${sequence}`
  } catch (error) {
    console.error("[v0] Error generating sequential invoice number:", error)
    // Fallback to UUID-based if anything fails
    return generateFallbackInvoiceNumber(date)
  }
}

/**
 * Fallback invoice number generation using order ID (for backward compatibility)
 * Format: Natmet-YYMMDDSUFX
 */
export function generateFallbackInvoiceNumber(date: Date = new Date(), orderId?: string): string {
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")

  if (orderId) {
    const orderSuffix = orderId.slice(0, 4).toUpperCase()
    return `Natmet-${year}${month}${day}${orderSuffix}`
  }

  // Generate random suffix if no order ID
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `Natmet-${year}${month}${day}${randomSuffix}`
}

/**
 * Validate invoice number format
 * Accepts both formats:
 * - Sequential: Natmet-YYMMDD-XXXX (e.g., Natmet-251203-0001)
 * - Legacy: Natmet-YYMMDDSUFX (4 alphanumeric chars)
 */
export function validateInvoiceNumber(invoiceNumber: string): boolean {
  // Sequential format: Natmet-YYMMDD-XXXX
  const sequentialPattern = /^Natmet-\d{6}-\d{4}$/

  // Legacy format: Natmet-YYMMDDSUFX (4 alphanumeric chars)
  const legacyPattern = /^Natmet-\d{6}[A-Z0-9]{4}$/

  return sequentialPattern.test(invoiceNumber) || legacyPattern.test(invoiceNumber)
}

/**
 * Parse invoice number to extract date and sequence
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string
  date: Date
  sequence: string
  isSequential: boolean
} | null {
  // Sequential format: Natmet-YYMMDD-XXXX
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
 * Get current day's invoice count (for admin dashboard)
 */
export async function getTodayInvoiceCount(): Promise<number> {
  const supabase = getSupabaseAdmin()

  if (!supabase) {
    return 0
  }

  const today = new Date()
  const month = (today.getMonth() + 1).toString().padStart(2, "0")
  const day = today.getDate().toString().padStart(2, "0")
  const dbDate = `${today.getFullYear()}-${month}-${day}`

  try {
    const { data, error } = await supabase
      .from("invoice_counters")
      .select("last_sequence")
      .eq("counter_date", dbDate)
      .single()

    if (error || !data) {
      return 0
    }

    return data.last_sequence
  } catch {
    return 0
  }
}
