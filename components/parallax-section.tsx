"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ParallaxSectionProps {
  children: ReactNode
  className?: string
  speed?: number // -1 to 1, negative moves opposite to scroll
  direction?: "vertical" | "horizontal"
  overflow?: boolean
  disabled?: boolean
}

export function ParallaxSection({
  children,
  className,
  speed = 0.3,
  direction = "vertical",
  overflow = false,
  disabled = false,
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setIsReducedMotion(prefersReducedMotion)

    if (prefersReducedMotion || disabled) return

    const handleScroll = () => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Only apply parallax when element is in view
      if (rect.bottom < 0 || rect.top > windowHeight) return

      // Calculate parallax offset based on element position relative to viewport center
      const elementCenter = rect.top + rect.height / 2
      const viewportCenter = windowHeight / 2
      const distanceFromCenter = (elementCenter - viewportCenter) / windowHeight

      // Apply speed multiplier (clamped for performance)
      const parallaxOffset = distanceFromCenter * speed * 100

      requestAnimationFrame(() => {
        setOffset(parallaxOffset)
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed, disabled])

  const transform =
    isReducedMotion || disabled
      ? undefined
      : direction === "vertical"
        ? `translate3d(0, ${offset}px, 0)`
        : `translate3d(${offset}px, 0, 0)`

  return (
    <div ref={sectionRef} className={cn("relative", !overflow && "overflow-hidden", className)}>
      <div
        style={{
          transform,
          willChange: isReducedMotion || disabled ? "auto" : "transform",
          transition: "transform 0.1s linear",
        }}
      >
        {children}
      </div>
    </div>
  )
}
