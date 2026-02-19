// Symposium Webinar Access Management
// Handles checking, granting, and revoking webinar access for Symposium buyers

import { WEBINARS } from "@/lib/data/webinars"

// Symposium event identifiers - events that grant bonus webinar access
export const SYMPOSIUM_EVENT_IDS = ["symposium_main", "symposium", "symposium_full", "symposium_day1", "symposium_day2"]

// Labels that identify Symposium events (case-insensitive matching)
export const SYMPOSIUM_EVENT_LABELS = ["symposium", "8th national meeting symposium", "isapm symposium"]

// Webinars included in Symposium bonus (all 4 webinars)
export const SYMPOSIUM_BONUS_WEBINAR_IDS = ["webinar_equity_pain", "webinar_2", "webinar_3", "webinar_4"]

export interface WebinarGrant {
  id: string
  user_id: string
  order_id: string
  webinar_id: string
  granted_at: string
  granted_by: string | null
  grant_type: "symposium_bonus" | "manual" | "promotional"
  expires_at: string | null
  status: "active" | "revoked" | "expired"
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WebinarAccessResult {
  hasAccess: boolean
  accessType: "purchased" | "symposium_bonus" | "manual" | "promotional" | null
  grant?: WebinarGrant
  orderId?: string
}

/**
 * Check if an event is a Symposium event that grants bonus webinar access
 */
export function isSymposiumEvent(eventId: string, eventLabel?: string): boolean {
  // Check by event ID
  if (SYMPOSIUM_EVENT_IDS.some((id) => eventId.toLowerCase().includes(id.toLowerCase()))) {
    return true
  }

  // Check by event label (case-insensitive)
  if (eventLabel) {
    const labelLower = eventLabel.toLowerCase()
    if (SYMPOSIUM_EVENT_LABELS.some((label) => labelLower.includes(label.toLowerCase()))) {
      return true
    }
    // Also match if label contains "symposium" anywhere
    if (labelLower.includes("symposium")) {
      return true
    }
  }

  return false
}

/**
 * Get webinar details by ID
 */
export function getWebinarDetails(webinarId: string) {
  return WEBINARS.find((w) => w.id === webinarId)
}

/**
 * Get all bonus webinars with their details
 */
export function getBonusWebinars() {
  return SYMPOSIUM_BONUS_WEBINAR_IDS.map((id) => getWebinarDetails(id)).filter(Boolean)
}

/**
 * Calculate total value of bonus webinars
 */
export function getBonusWebinarsValue(): number {
  return getBonusWebinars().reduce((total, webinar) => {
    return total + (webinar?.price || 100000) // Default to 100,000 if price not set
  }, 0)
}

/**
 * Format the bonus value for display
 */
export function formatBonusValue(currency = "IDR"): string {
  const value = getBonusWebinarsValue()
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value)
}
