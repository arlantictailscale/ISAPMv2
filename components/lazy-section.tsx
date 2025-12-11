"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface LazySectionProps {
  children: ReactNode
  className?: string
  placeholder?: ReactNode
  rootMargin?: string
  threshold?: number
}

export function LazySection({
  children,
  className,
  placeholder,
  rootMargin = "100px",
  threshold = 0.1,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return (
    <div ref={ref} className={cn("min-h-[100px]", className)}>
      {isVisible ? children : placeholder || <div className="w-full h-full bg-muted/50 animate-pulse rounded-lg" />}
    </div>
  )
}
