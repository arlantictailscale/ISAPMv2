"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function CartIcon() {
  const [itemCount, setItemCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
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

    loadCartCount()

    // Subscribe to cart changes
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
