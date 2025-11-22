"use client"

import { useState } from "react"
import { ShoppingCart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addToCart } from "@/app/actions/cart"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCart } from "@/lib/cart/cart-context"
import type { CartItem } from "@/lib/cart/types"

interface AddToCartButtonProps {
  item: Omit<CartItem, "id" | "cart_id" | "created_at">
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function AddToCartButton({ item, variant = "outline", size = "default", className }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const router = useRouter()
  const { refreshCart } = useCart()

  const handleAddToCart = async () => {
    setIsAdding(true)

    const result = await addToCart(item)

    if (result.error) {
      if (result.error.includes("Not authenticated")) {
        toast.error("Please login to add items to cart", {
          action: {
            label: "Login",
            onClick: () => router.push("/auth/login?redirect=/cart"),
          },
        })
      } else {
        toast.error("Failed to add to cart", {
          description: result.error,
        })
      }
      setIsAdding(false)
    } else {
      await refreshCart()

      toast.success("Added to cart!", {
        action: {
          label: "View Cart",
          onClick: () => router.push("/cart"),
        },
      })
      setIsAdding(false)
      router.refresh()
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleAddToCart} disabled={isAdding} className={className}>
      {isAdding ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
