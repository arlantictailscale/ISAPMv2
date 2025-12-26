"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

interface CartContextType {
  itemCount: number
  refreshCart: () => Promise<void>
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const { user, isLoading: authLoading } = useAuth()

  const loadCartCount = async () => {
    if (!user) {
      setItemCount(0)
      setIsLoading(false)
      return
    }

    try {
      const { data: cart } = await supabase
        .from("carts")
        .select("id, cart_items(count)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      const count = cart?.cart_items?.[0]?.count || 0
      setItemCount(count)
    } catch (error) {
      console.error("[v0] CartContext: Error loading cart count:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return

    loadCartCount()
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return

    const cartItemsChannel = supabase
      .channel("cart_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cart_items",
        },
        () => {
          loadCartCount()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "carts",
        },
        () => {
          loadCartCount()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(cartItemsChannel)
    }
  }, [supabase, user])

  return (
    <CartContext.Provider value={{ itemCount, refreshCart: loadCartCount, isLoading: isLoading || authLoading }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
