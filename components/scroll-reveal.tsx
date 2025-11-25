"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"
import type { ReactNode, ElementType, CSSProperties } from "react"

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "none"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  direction?: RevealDirection
  delay?: number // in ms
  duration?: number // in ms
  distance?: number // in px
  threshold?: number
  triggerOnce?: boolean
  as?: ElementType
  style?: CSSProperties
}

const getInitialTransform = (direction: RevealDirection, distance: number): string => {
  switch (direction) {
    case "up":
      return `translateY(${distance}px)`
    case "down":
      return `translateY(-${distance}px)`
    case "left":
      return `translateX(${distance}px)`
    case "right":
      return `translateX(-${distance}px)`
    case "scale":
      return "scale(0.9)"
    case "none":
      return "none"
    default:
      return `translateY(${distance}px)`
  }
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 700,
  distance = 40,
  threshold = 0.1,
  triggerOnce = true,
  as: Component = "div",
  style,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold,
    triggerOnce,
  })

  const initialTransform = getInitialTransform(direction, distance)

  return (
    <Component
      ref={ref as any}
      className={cn(className)}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : initialTransform,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Component>
  )
}
