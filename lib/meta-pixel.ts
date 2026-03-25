// Meta Pixel tracking utility
// This file provides functions to track Lead and Purchase events

declare global {
  interface Window {
    fbq: (...args: any[]) => void
  }
}

/**
 * Track a Lead event when a user shows interest (sign-up, poster submission, etc.)
 */
export function trackLead(params?: {
  content_name?: string
  content_category?: string
  value?: number
  currency?: string
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Lead", params)
  }
}

/**
 * Track a Purchase event when a payment is completed/approved
 */
export function trackPurchase(params: {
  value: number
  currency: string
  content_name?: string
  content_ids?: string[]
  content_type?: string
  num_items?: number
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", params)
  }
}

/**
 * Track InitiateCheckout when user starts checkout process
 */
export function trackInitiateCheckout(params?: {
  value?: number
  currency?: string
  content_ids?: string[]
  num_items?: number
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", params)
  }
}

/**
 * Track CompleteRegistration when user completes account registration
 */
export function trackCompleteRegistration(params?: {
  content_name?: string
  status?: string
  value?: number
  currency?: string
}) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "CompleteRegistration", params)
  }
}
