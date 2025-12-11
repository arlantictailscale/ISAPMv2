"use client"

import { useReportWebVitals } from "next/web-vitals"

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      })
    }

    // Send to analytics in production
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      // Vercel Analytics automatically captures these, but you can also send to custom endpoint
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        page: window.location.pathname,
      })

      // Use sendBeacon for reliable delivery
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/web-vitals", body)
      }
    }
  })

  return null
}
