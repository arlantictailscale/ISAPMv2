"use client"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"
import type { ReactNode, ElementType } from "react"

type AnimationType = "fade-up" | "fade-left" | "fade-right" | "scale" | "blur" | "rotate" | "default"

interface ScrollAnimationWrapperProps {
  children: ReactNode
  className?: string
  animation?: AnimationType
  delay?: 1 | 2 | 3 | 4 | 5 | 6
  threshold?: number
  triggerOnce?: boolean
  as?: ElementType
}

const animationClasses: Record<AnimationType, string> = {
  "fade-up": "scroll-fade-up",
  "fade-left": "scroll-fade-left",
  "fade-right": "scroll-fade-right",
  scale: "scroll-scale",
  blur: "scroll-blur",
  rotate: "scroll-rotate",
  default: "scroll-animate",
}

export function ScrollAnimationWrapper({
  children,
  className,
  animation = "default",
  delay,
  threshold = 0.1,
  triggerOnce = true,
  as: Component = "div",
}: ScrollAnimationWrapperProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold,
    triggerOnce,
  })

  const delayClass = delay ? `scroll-delay-${delay}` : ""
  const animationClass = animationClasses[animation]

  return (
    <Component ref={ref as any} className={cn(animationClass, delayClass, isVisible && "is-visible", className)}>
      {children}
    </Component>
  )
}
