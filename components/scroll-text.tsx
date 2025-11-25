"use client"

import type React from "react"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface ScrollTextProps {
  children: ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span"
  underline?: boolean
  delay?: number
}

export function ScrollText({
  children,
  className,
  as: Component = "p",
  underline = false,
  delay = 0,
}: ScrollTextProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>({
    threshold: 0.2,
    triggerOnce: true,
  })

  return (
    <Component
      ref={ref as React.RefObject<HTMLElement>}
      className={cn("scroll-fade-up", underline && "scroll-underline", isVisible && "is-visible", className)}
      style={{ transitionDelay: delay ? `${delay}s` : undefined }}
    >
      {children}
    </Component>
  )
}
