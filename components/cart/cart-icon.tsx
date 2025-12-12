"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart/cart-context"

export function CartIcon() {
  const { itemCount } = useCart()
  const [prevCount, setPrevCount] = useState(itemCount)
  const [animationType, setAnimationType] = useState<"add" | "remove" | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip animation on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      setPrevCount(itemCount)
      return
    }

    if (itemCount !== prevCount) {
      if (itemCount > prevCount) {
        setAnimationType("add")
      } else if (itemCount < prevCount) {
        setAnimationType("remove")
      }

      const timer = setTimeout(() => {
        setAnimationType(null)
        setPrevCount(itemCount)
      }, 600)

      return () => clearTimeout(timer)
    }
  }, [itemCount, prevCount])

  const getCartAnimationClass = () => {
    if (animationType === "add") return "animate-[cartBounce_0.6s_ease-out]"
    if (animationType === "remove") return "animate-[cartShake_0.5s_ease-out]"
    return ""
  }

  const getBadgeAnimationClass = () => {
    if (animationType === "add") return "animate-[badgePop_0.4s_ease-out] ring-2 ring-primary/50"
    if (animationType === "remove") return "animate-[badgeShrink_0.4s_ease-out] ring-2 ring-destructive/50"
    return ""
  }

  const getIconAnimationClass = () => {
    if (animationType === "add") return "scale-110"
    if (animationType === "remove") return "scale-90 text-destructive"
    return ""
  }

  return (
    <Link href="/cart">
      <Button
        variant="ghost"
        size="icon"
        className={`relative transition-transform duration-200 ${getCartAnimationClass()}`}
      >
        <ShoppingCart className={`h-5 w-5 transition-all duration-200 ${getIconAnimationClass()}`} />
        {itemCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 ${getBadgeAnimationClass()}`}
          >
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
        {itemCount === 0 && animationType === "remove" && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-[badgeFadeOut_0.4s_ease-out_forwards]">
            0
          </span>
        )}
        <span className="sr-only">Shopping cart with {itemCount} items</span>
      </Button>
    </Link>
  )
}
