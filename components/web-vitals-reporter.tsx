"use client"

import { useReportWebVitals } from "next/web-vitals"
import { useEffect } from "react"

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const colors = {
      FCP: "#4285f4", // Blue
      LCP: "#ea4335", // Red
      CLS: "#fbbc04", // Yellow
      FID: "#34a853", // Green
      TTFB: "#9c27b0", // Purple
      INP: "#ff6d00", // Orange
    }

    const color = colors[metric.name as keyof typeof colors] || "#666"

    console.log(`%c[v0] ${metric.name}`, `color: ${color}; font-weight: bold; font-size: 12px;`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    })

    // Send to analytics in production
    if (process.env.NODE_ENV === "production") {
      // Vercel Analytics automatically captures these
      // Optional: Send to custom analytics endpoint
      fetch("/api/analytics/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          path: window.location.pathname,
        }),
      }).catch(() => {
        // Silently fail - don't block user experience
      })
    }
  })

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("@/lib/monitoring/performance-monitor").then(({ PerformanceMonitor }) => {
        PerformanceMonitor.getInstance()
      })
    }
  }, [])

  return null
}
