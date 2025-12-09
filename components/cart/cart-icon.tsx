"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart/cart-context"

export function CartIcon() {
  const { itemCount } = useCart()
  const [prevCount, setPrevCount] = useState(itemCount)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (itemCount > prevCount) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevCount(itemCount)
  }, [itemCount, prevCount])

  return (
    <Link href="/cart">
      <Button
        variant="ghost"
        size="icon"
        className={`relative transition-transform duration-200 ${isAnimating ? "animate-[cartBounce_0.6s_ease-out]" : ""}`}
      >
        <ShoppingCart className={`h-5 w-5 transition-transform duration-200 ${isAnimating ? "scale-110" : ""}`} />
        {itemCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 ${isAnimating ? "animate-[badgePop_0.4s_ease-out] ring-2 ring-primary/50" : ""}`}
          >
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
        <span className="sr-only">Shopping cart with {itemCount} items</span>
      </Button>
    </Link>
  )
}
