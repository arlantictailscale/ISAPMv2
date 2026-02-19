"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollAnimation<T extends HTMLElement = HTMLElement>(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = "0px 0px -50px 0px", triggerOnce = true } = options
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const progress = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0
      setProgress(progress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return progress
}

export function useParallax(speed = 0.5) {
  const ref = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      // Calculate how far the element is from center of viewport
      const elementCenter = rect.top + rect.height / 2
      const viewportCenter = windowHeight / 2
      const distanceFromCenter = elementCenter - viewportCenter
      const rate = distanceFromCenter * speed * -1
      setOffset(rate)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return { ref, offset }
}

export function useSectionParallax() {
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    setWindowHeight(window.innerHeight)

    const handleScroll = () => {
      requestAnimationFrame(() => {
        setScrollY(window.scrollY)
      })
    }

    const handleResize = () => {
      setWindowHeight(window.innerHeight)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const getParallaxStyle = useCallback(
    (speed = 0.5, direction: "vertical" | "horizontal" = "vertical") => {
      const offset = scrollY * speed
      return {
        transform: direction === "vertical" ? `translate3d(0, ${offset}px, 0)` : `translate3d(${offset}px, 0, 0)`,
        willChange: "transform",
      }
    },
    [scrollY],
  )

  const getElementParallax = useCallback(
    (elementTop: number, speed = 0.5) => {
      const relativeScroll = scrollY - elementTop + windowHeight
      const offset = relativeScroll * speed
      return {
        transform: `translate3d(0, ${offset}px, 0)`,
        willChange: "transform",
      }
    },
    [scrollY, windowHeight],
  )

  return { scrollY, windowHeight, getParallaxStyle, getElementParallax }
}

export function useScrollVisibility() {
  const ref = useRef<HTMLElement>(null)
  const [visibility, setVisibility] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setVisibility(1)
      return
    }

    const handleScroll = () => {
      if (!element) return
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Calculate visibility percentage (0 to 1)
      const elementTop = rect.top
      const elementBottom = rect.bottom
      const elementHeight = rect.height

      if (elementBottom < 0 || elementTop > windowHeight) {
        setVisibility(0)
      } else if (elementTop <= 0 && elementBottom >= windowHeight) {
        setVisibility(1)
      } else {
        const visibleHeight = Math.min(elementBottom, windowHeight) - Math.max(elementTop, 0)
        setVisibility(Math.min(visibleHeight / elementHeight, 1))
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return { ref, visibility }
}
