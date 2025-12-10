import { WEBINARS, type Webinar } from "./webinars"

// Promotion Types
export interface BundlePromotion {
  id: string
  name: string
  description: string
  triggerEventType: string // The event type that triggers the promotion (e.g., "symposium")
  triggerParticipantTypes: string[] // Participant types that qualify
  includedWebinarIds: string[] // Webinar IDs from WEBINARS array
  discountPercentage: number // 100 = free
  isActive: boolean
  startDate?: Date
  endDate?: Date
}

// Active Promotions Configuration
export const SYMPOSIUM_BUNDLE_PROMOTION: BundlePromotion = {
  id: "symposium-webinar-bundle-2026",
  name: "Symposium Bundle",
  description: "Symposium registration includes access to all 4 webinars at no additional cost.",
  triggerEventType: "symposium",
  triggerParticipantTypes: ["specialist-doctor", "general-doctor", "resident", "nurse", "student", "other"],
  includedWebinarIds: ["webinar_equity_pain", "webinar_2", "webinar_3", "webinar_4"],
  discountPercentage: 100,
  isActive: true,
}

const WEBINAR_STANDARD_PRICE = 100000 // Rp 100.000 per webinar

// Helper Functions
export function isPromotionActive(promotion: BundlePromotion): boolean {
  if (!promotion.isActive) return false

  const now = new Date()
  if (promotion.startDate && now < promotion.startDate) return false
  if (promotion.endDate && now > promotion.endDate) return false

  return true
}

export function getActiveSymposiumPromotion(): BundlePromotion | null {
  return isPromotionActive(SYMPOSIUM_BUNDLE_PROMOTION) ? SYMPOSIUM_BUNDLE_PROMOTION : null
}

export function getIncludedWebinarsForSymposium(): Webinar[] {
  const promotion = getActiveSymposiumPromotion()
  if (!promotion) return []

  return WEBINARS.filter((webinar) => promotion.includedWebinarIds.includes(webinar.id))
}

export function calculateBundleSavings(): number {
  const promotion = getActiveSymposiumPromotion()
  if (!promotion) return 0

  // 4 webinars × Rp 100.000 = Rp 400.000
  return promotion.includedWebinarIds.length * WEBINAR_STANDARD_PRICE
}

export function isWebinarIncludedInSymposiumBundle(webinarId: string): boolean {
  const promotion = getActiveSymposiumPromotion()
  if (!promotion) return false

  return promotion.includedWebinarIds.includes(webinarId)
}

export function isEventTypeSymposium(eventType: string): boolean {
  return eventType === "symposium"
}

export function formatCurrency(amount: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Get bonus items to add when symposium is purchased
export function getBonusWebinarItems(participantType: string) {
  const promotion = getActiveSymposiumPromotion()
  if (!promotion) return []

  const webinars = getIncludedWebinarsForSymposium()

  return webinars
    .filter((webinar) => webinar.status === "active" && webinar.price > 0) // Only active paid webinars
    .map((webinar) => ({
      event_type: "webinar",
      event_label: webinar.slug,
      event_name: `${webinar.shortTitle} (FREE with Symposium)`,
      participant_type: "general", // Standard webinar type
      participant_type_label: "General Admission",
      unit_price: 0, // FREE
      currency: webinar.currency,
      original_price: webinar.price, // Store original price for display
      is_bonus_item: true,
      bonus_source: "symposium",
    }))
}
