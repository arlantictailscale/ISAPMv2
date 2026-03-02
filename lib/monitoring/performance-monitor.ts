"use client"

/**
 * Advanced performance monitoring for production
 * Tracks long tasks, large resources, and performance regressions
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private observers: PerformanceObserver[] = []

  private constructor() {
    if (typeof window === "undefined") return
    this.initializeObservers()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers() {
    // Monitor long tasks (>500ms in development, >100ms in production)
    // Development threshold is higher to reduce noise from HMR and build processes
    const longTaskThreshold = process.env.NODE_ENV === "production" ? 100 : 500
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > longTaskThreshold) {
            // Log only tasks that significantly impact user experience
            console.warn("[v0] Long Task Detected:", {
              name: entry.name,
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: `${entry.startTime.toFixed(2)}ms`,
            })
          }
        }
      })
      longTaskObserver.observe({ entryTypes: ["longtask"] })
      this.observers.push(longTaskObserver)
    } catch (e) {
      // Long task API not supported
    }

    // Monitor largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log("[v0] LCP:", {
          element: (lastEntry as any).element?.tagName,
          loadTime: `${lastEntry.startTime.toFixed(2)}ms`,
          size: (lastEntry as any).size,
        })
      })
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
      this.observers.push(lcpObserver)
    } catch (e) {
      // LCP API not supported
    }

    // Monitor resource timing
    window.addEventListener("load", () => {
      const resources = performance.getEntriesByType("resource")
      const largeResources = resources.filter((r) => r.transferSize && r.transferSize > 100000)

      if (largeResources.length > 0) {
        console.warn(
          "[v0] Large Resources Detected:",
          largeResources.map((r) => ({
            name: r.name.split("/").pop(),
            size: `${(r.transferSize / 1024).toFixed(2)}KB`,
            duration: `${r.duration.toFixed(2)}ms`,
            type: (r as any).initiatorType,
          })),
        )
      }

      // Report total bundle size
      const scriptResources = resources.filter((r) => (r as any).initiatorType === "script")
      const totalScriptSize = scriptResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      console.log("[v0] Total JS Bundle:", `${(totalScriptSize / 1024).toFixed(2)}KB`)
    })
  }

  // Track custom metrics
  trackMetric(name: string, value: number, unit = "ms") {
    console.log(`[v0] Custom Metric: ${name}`, `${value.toFixed(2)}${unit}`)
  }

  // Disconnect all observers
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined") {
    PerformanceMonitor.getInstance()
  }
}
