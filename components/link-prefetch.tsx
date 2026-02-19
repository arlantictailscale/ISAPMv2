"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Intelligent route prefetching component
 * Prefetches critical routes on hover/focus for instant navigation
 */
export function LinkPrefetch() {
  const pathname = usePathname()

  useEffect(() => {
    // Prefetch critical routes on idle
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        const criticalRoutes = ["/events", "/dashboard", "/pricing", "/venue"]

        // Only prefetch if not on current page
        criticalRoutes.forEach((route) => {
          if (pathname !== route) {
            const link = document.createElement("link")
            link.rel = "prefetch"
            link.as = "document"
            link.href = route
            document.head.appendChild(link)
          }
        })
      })
    }

    // Prefetch on hover for navigation links
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="/"]')

      if (anchor && anchor instanceof HTMLAnchorElement) {
        const href = anchor.getAttribute("href")
        if (href && href.startsWith("/") && href !== pathname) {
          const link = document.createElement("link")
          link.rel = "prefetch"
          link.as = "document"
          link.href = href
          document.head.appendChild(link)
        }
      }
    }

    document.addEventListener("mouseover", handleMouseOver, { passive: true })
    return () => document.removeEventListener("mouseover", handleMouseOver)
  }, [pathname])

  return null
}
