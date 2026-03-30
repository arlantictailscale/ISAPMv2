"use client"

import { useState } from "react"
import { ShoppingCart, Loader2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addToCartBypassQuota } from "@/app/actions/cart"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCart } from "@/lib/cart/cart-context"
import type { CartItem } from "@/lib/cart/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AddToCartBypassButtonProps {
  item: Omit<CartItem, "id" | "cart_id" | "created_at">
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg"
  className?: string
  onSuccess?: () => void
}

export function AddToCartBypassButton({
  item,
  variant = "outline",
  size = "default",
  className,
  onSuccess,
}: AddToCartBypassButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const router = useRouter()
  const { refreshCart, user, isLoading } = useCart()

  const handleAddToCart = async () => {
    if (!user) {
      setShowLoginDialog(true)
      return
    }

    setIsAdding(true)

    // Uses bypass action that skips quota check
    const result = await addToCartBypassQuota(item)

    if (result.error) {
      if (result.error.includes("Not authenticated")) {
        setShowLoginDialog(true)
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
      onSuccess?.()
      router.refresh()
    }
  }

  const handleLogin = () => {
    const currentPath = window.location.pathname
    router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
  }

  const handleSignUp = () => {
    const currentPath = window.location.pathname
    router.push(`/auth/sign-up?redirect=${encodeURIComponent(currentPath)}`)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleAddToCart}
        disabled={isAdding || isLoading}
        className={className}
      >
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

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-primary" />
              Login Required
            </DialogTitle>
            <DialogDescription>
              Please login or create an account to add items to your cart and complete your registration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">By creating an account, you&apos;ll be able to:</p>
            <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Save items to your cart</li>
              <li>View profession-specific pricing</li>
              <li>Track your registrations</li>
              <li>Access your purchase history</li>
            </ul>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSignUp} className="w-full sm:w-auto bg-transparent">
              Create Account
            </Button>
            <Button onClick={handleLogin} className="w-full sm:w-auto">
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
