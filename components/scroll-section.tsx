"use client"

import type React from "react"

import { useScrollAnimation } from "@/hooks/use-scroll-animation"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type AnimationType =
  | "fade-up"
  | "fade-left"
  | "fade-right"
  | "scale"
  | "blur"
  | "rotate"
  | "section-reveal"
  | "slide-left"
  | "slide-right"
  | "zoom"
  | "flip"
  | "glow"
  | "stagger"

interface ScrollSectionProps {
  children: ReactNode
  className?: string
  animation?: AnimationType
  delay?: number
  threshold?: number
  triggerOnce?: boolean
  as?: "div" | "section" | "article" | "aside" | "header" | "footer"
}

const animationClasses: Record<AnimationType, string> = {
  "fade-up": "scroll-fade-up",
  "fade-left": "scroll-fade-left",
  "fade-right": "scroll-fade-right",
  scale: "scroll-scale",
  blur: "scroll-blur",
  rotate: "scroll-rotate",
  "section-reveal": "section-reveal",
  "slide-left": "slide-in-left",
  "slide-right": "slide-in-right",
  zoom: "zoom-reveal",
  flip: "flip-reveal",
  glow: "glow-reveal",
  stagger: "stagger-children",
}

export function ScrollSection({
  children,
  className,
  animation = "section-reveal",
  delay = 0,
  threshold = 0.15,
  triggerOnce = true,
  as: Component = "section",
}: ScrollSectionProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>({
    threshold,
    triggerOnce,
  })

  const animationClass = animationClasses[animation]

  return (
    <Component
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(animationClass, isVisible && "is-visible", className)}
      style={{ transitionDelay: delay ? `${delay}s` : undefined }}
    >
      {children}
    </Component>
  )
}
