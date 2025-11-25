"use client"

import { useRef, useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ParallaxSectionProps {
  children: ReactNode
  className?: string
  speed?: number
  direction?: "up" | "down"
  bgClassName?: string
  bgElement?: ReactNode
}

export function ParallaxSection({
  children,
  className,
  speed = 0.3,
  direction = "up",
  bgClassName,
  bgElement,
}: ParallaxSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1, rootMargin: "100px" },
    )

    observer.observe(section)

    const handleScroll = () => {
      if (!section) return
      const rect = section.getBoundingClientRect()
      const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
      const clampedProgress = Math.max(0, Math.min(1, scrollProgress))
      const movement = (clampedProgress - 0.5) * 100 * speed
      setOffset(direction === "up" ? -movement : movement)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [speed, direction])

  return (
    <div ref={sectionRef} className={cn("parallax-section", className)}>
      {bgElement && (
        <div className={cn("parallax-bg", bgClassName)} style={{ transform: `translateY(${offset}px)` }}>
          {bgElement}
        </div>
      )}
      <div className={cn("relative z-10", isVisible && "is-visible")}>{children}</div>
    </div>
  )
}
