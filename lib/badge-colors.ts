/**
 * Centralized badge color configuration for event types and categories
 * Ensures visual consistency and accessibility across all pages
 */

export const BADGE_COLORS = {
  CPD: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    border: "border-violet-300",
    solid: "bg-violet-500 text-white",
    label: "CPD COURSE",
  },
  WORKSHOP: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
    solid: "bg-orange-500 text-white",
    label: "WORKSHOP",
  },
  SYMPOSIUM: {
    bg: "bg-cyan-100",
    text: "text-cyan-700",
    border: "border-cyan-300",
    solid: "bg-cyan-500 text-white",
    label: "SYMPOSIUM",
  },
  HOTEL: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
    solid: "bg-purple-500 text-white",
    label: "HOTEL",
  },
  WEBINAR: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-300",
    solid: "bg-indigo-500 text-white",
    label: "WEBINAR",
  },
} as const

export type BadgeType = keyof typeof BADGE_COLORS

/**
 * Get badge color classes based on event type
 * @param itemType - Type of item (event, hotel, or webinar)
 * @param eventLabel - Label of the event (for determining if workshop/symposium/cpd)
 * @param eventId - ID of the event
 * @returns Object with bg, text, and border color classes
 */
export function getBadgeColors(itemType: string, eventLabel?: string, eventId?: string) {
  if (itemType === "hotel") {
    return BADGE_COLORS.HOTEL
  }

  if (itemType === "webinar") {
    return BADGE_COLORS.WEBINAR
  }

  const lowerLabel = eventLabel?.toLowerCase() || ""
  const lowerId = eventId?.toLowerCase() || ""

  if (lowerLabel.startsWith("ws ") || lowerLabel.includes("workshop") || lowerId.includes("workshop")) {
    return BADGE_COLORS.WORKSHOP
  }

  if (lowerLabel.includes("symposium") || lowerId.includes("symposium")) {
    return BADGE_COLORS.SYMPOSIUM
  }

  return BADGE_COLORS.CPD
}

/**
 * Get the category label for an event
 */
export function getCategoryLabel(itemType: string, eventLabel?: string, eventId?: string): string {
  return getBadgeColors(itemType, eventLabel, eventId).label
}
