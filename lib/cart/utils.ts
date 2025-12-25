import type { CartItem, CartSummary } from "./types"

const EXTRA_BED_PRICE_PER_NIGHT = 550000

/**
 * Calculate cart totals
 */
export function calculateCartTotal(items: CartItem[]): CartSummary {
  const subtotal = items.reduce((sum, item) => {
    // For hotel bookings, multiply unit price by number of nights
    // For event registrations and webinars, use unit price as-is
    if (item.item_type === "hotel" && item.nights) {
      return sum + (item.unit_price || 0) * item.nights
    }
    return sum + (item.unit_price || 0)
  }, 0)

  const currency = items.length > 0 ? items[0].currency : "IDR"

  return {
    subtotal,
    currency,
    itemCount: items.length,
    items,
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = "IDR"): string {
  if (currency === "IDR") {
    return `Rp ${amount.toLocaleString("id-ID")}`
  }
  return `${currency} ${amount.toLocaleString()}`
}

/**
 * Validate cart item data
 */
export function validateCartItem(item: Partial<CartItem>): boolean {
  if (!item.item_type || !item.unit_price) {
    return false
  }

  if (item.item_type === "event") {
    return !!(item.event_id && item.participant_type_id)
  }

  if (item.item_type === "hotel") {
    return !!(item.hotel_room_type && item.check_in_date && item.check_out_date)
  }

  if (item.item_type === "webinar") {
    return !!(item.event_id && item.event_label)
  }

  return false
}

/**
 * Check if two cart items are duplicates
 */
export function isDuplicateCartItem(item1: Partial<CartItem>, item2: Partial<CartItem>): boolean {
  if (item1.item_type !== item2.item_type) {
    return false
  }

  if (item1.item_type === "event") {
    return item1.event_id === item2.event_id && item1.participant_type_id === item2.participant_type_id
  }

  if (item1.item_type === "hotel") {
    return (
      item1.hotel_room_type === item2.hotel_room_type &&
      item1.check_in_date === item2.check_in_date &&
      item1.check_out_date === item2.check_out_date &&
      item1.event_label === item2.event_label
    )
  }

  if (item1.item_type === "webinar") {
    return item1.event_id === item2.event_id
  }

  return false
}
