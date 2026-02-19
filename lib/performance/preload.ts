/**
 * Preload critical images for better LCP
 */
export function preloadCriticalImages() {
  if (typeof window === "undefined") return

  const criticalImages = ["/images/surgical-background.jpg", "/images/isapm-2026-banner.png"]

  criticalImages.forEach((src) => {
    const link = document.createElement("link")
    link.rel = "preload"
    link.as = "image"
    link.href = src
    document.head.appendChild(link)
  })
}

/**
 * Prefetch routes for faster navigation
 */
export function prefetchRoutes(routes: string[]) {
  if (typeof window === "undefined") return

  routes.forEach((route) => {
    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = route
    document.head.appendChild(link)
  })
}
