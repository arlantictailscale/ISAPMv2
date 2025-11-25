"use client"

import { useEffect, useState, useRef } from "react"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedCounter({ end, duration = 2000, prefix = "", suffix = "", className }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const { ref, isVisible } = useScrollAnimation<HTMLSpanElement>({
    threshold: 0.3,
    triggerOnce: true,
  })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return
    hasAnimated.current = true

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setCount(end)
      return
    }

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOut * end))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return (
    <span ref={ref} className={cn("counter-animate", isVisible && "is-visible", className)}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}
