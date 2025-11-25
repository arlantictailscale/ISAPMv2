"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ParallaxLayerProps {
  children: ReactNode
  className?: string
  speed?: number
  zIndex?: number
  opacity?: boolean // Fade in/out based on scroll
}

export function ParallaxLayer({ children, className, speed = 0.2, zIndex = 0, opacity = false }: ParallaxLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ y: 0, opacity: 1 })
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setIsReducedMotion(prefersReducedMotion)

    if (prefersReducedMotion) return

    const handleScroll = () => {
      if (!layerRef.current) return

      const rect = layerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Calculate relative position in viewport
      const elementProgress = (windowHeight - rect.top) / (windowHeight + rect.height)
      const clampedProgress = Math.max(0, Math.min(1, elementProgress))

      // Calculate parallax offset
      const yOffset = (clampedProgress - 0.5) * speed * 200

      // Calculate opacity if enabled
      let opacityValue = 1
      if (opacity) {
        // Fade in from 0 to 0.3, stay at 1 from 0.3 to 0.7, fade out from 0.7 to 1
        if (clampedProgress < 0.3) {
          opacityValue = clampedProgress / 0.3
        } else if (clampedProgress > 0.7) {
          opacityValue = 1 - (clampedProgress - 0.7) / 0.3
        }
      }

      requestAnimationFrame(() => {
        setTransform({ y: yOffset, opacity: opacityValue })
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed, opacity])

  return (
    <div
      ref={layerRef}
      className={cn("relative", className)}
      style={{
        zIndex,
        transform: isReducedMotion ? undefined : `translate3d(0, ${transform.y}px, 0)`,
        opacity: isReducedMotion ? 1 : transform.opacity,
        willChange: isReducedMotion ? "auto" : "transform, opacity",
        transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
      }}
    >
      {children}
    </div>
  )
}
