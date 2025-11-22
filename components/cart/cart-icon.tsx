"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart/cart-context"

export function CartIcon() {
  const { itemCount } = useCart()

  return (
    <Link href="/cart">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
        <span className="sr-only">Shopping cart with {itemCount} items</span>
      </Button>
    </Link>
  )
}
