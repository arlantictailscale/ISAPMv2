"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface CartContextType {
  itemCount: number
  refreshCart: () => Promise<void>
  user: User | null
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemCount, setItemCount] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const loadCartCount = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    setUser(currentUser)
    setIsLoading(false)

    if (!currentUser) {
      setItemCount(0)
      return
    }

    const { data: cart } = await supabase
      .from("carts")
      .select("id, cart_items(count)")
      .eq("user_id", currentUser.id)
      .eq("status", "active")
      .maybeSingle()

    const count = cart?.cart_items?.[0]?.count || 0
    setItemCount(count)
  }

  useEffect(() => {
    loadCartCount()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        loadCartCount()
      }
    })

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
      subscription.unsubscribe()
      supabase.removeChannel(cartItemsChannel)
    }
  }, [supabase])

  return (
    <CartContext.Provider value={{ itemCount, refreshCart: loadCartCount, user, isLoading }}>
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
