"use client"

import { useEffect, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ParallaxBackgroundProps {
  children?: ReactNode
  className?: string
  imageUrl?: string
  speed?: number
  overlay?: boolean
  overlayOpacity?: number
}

export function ParallaxBackground({
  children,
  className,
  imageUrl,
  speed = 0.5,
  overlay = true,
  overlayOpacity = 0.3,
}: ParallaxBackgroundProps) {
  const [offsetY, setOffsetY] = useState(0)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setIsReducedMotion(prefersReducedMotion)

    if (prefersReducedMotion) return

    const handleScroll = () => {
      requestAnimationFrame(() => {
        setOffsetY(window.scrollY * speed)
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${imageUrl})`,
            transform: isReducedMotion ? undefined : `translate3d(0, ${offsetY}px, 0)`,
            willChange: isReducedMotion ? "auto" : "transform",
            height: "120%",
            top: "-10%",
          }}
        />
      )}
      {overlay && <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
