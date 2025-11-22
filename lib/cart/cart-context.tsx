"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface CartContextType {
  itemCount: number
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0)
  const supabase = createClient()

  const loadCartCount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setItemCount(0)
      return
    }

    const { data: cart } = await supabase
      .from("carts")
      .select("id, cart_items(count)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    const count = cart?.cart_items?.[0]?.count || 0
    setItemCount(count)
  }

  useEffect(() => {
    loadCartCount()

    const channel = supabase
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return <CartContext.Provider value={{ itemCount, refreshCart: loadCartCount }}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
