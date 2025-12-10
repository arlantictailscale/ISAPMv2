"use client"

import { Trash2, Calendar, HotelIcon, Users, Video, Loader2, Check, Gift, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/cart/utils"
import type { CartItem } from "@/lib/cart/types"
import { removeFromCart } from "@/app/actions/cart"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCart } from "@/lib/cart/cart-context"

interface CartItemCardProps {
  item: CartItem
}

export function CartItemCard({ item }: CartItemCardProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const [isRemoved, setIsRemoved] = useState(false)
  const router = useRouter()
  const { refreshCart } = useCart()

  const isBonusItem = item.is_bonus_item === true
  const originalPrice = item.original_price || item.unit_price

  const itemTotal =
    item.item_type === "hotel" && item.nights ? (item.unit_price || 0) * item.nights : item.unit_price || 0

  const handleRemove = async () => {
    if (isBonusItem) {
      toast.info("Cannot remove bonus item", {
        description: "This item is included free with your Symposium ticket. Remove the Symposium to remove this item.",
      })
      return
    }

    setIsRemoving(true)
    const result = await removeFromCart(item.id)

    if (result.error) {
      toast.error("Failed to remove item", {
        description: result.error,
      })
      setIsRemoving(false)
    } else {
      setIsRemoved(true)
      toast.success("Item removed from cart")

      // Wait for animation to complete before refreshing
      setTimeout(async () => {
        await refreshCart()
        router.refresh()
      }, 300)
    }
  }

  const getItemIcon = () => {
    if (isBonusItem) {
      return <Gift className="h-5 w-5 text-emerald-600" />
    }
    switch (item.item_type) {
      case "event":
        return <Users className="h-5 w-5 text-primary" />
      case "webinar":
        return <Video className="h-5 w-5 text-purple-600" />
      case "hotel":
      default:
        return <HotelIcon className="h-5 w-5 text-secondary" />
    }
  }

  const getItemTitle = () => {
    if (item.event_name) {
      return item.event_name
    }
    switch (item.item_type) {
      case "event":
        return item.event_label
      case "webinar":
        return item.event_label || "Webinar Registration"
      case "hotel":
      default:
        return `Hotel Room - ${item.hotel_room_type}`
    }
  }

  return (
    <Card
      className={`transition-all duration-300 ease-out ${
        isRemoved ? "opacity-0 scale-95 -translate-x-4" : "opacity-100 scale-100 translate-x-0"
      } ${isBonusItem ? "border-emerald-200 bg-emerald-50/50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getItemIcon()}
              <h3 className="font-semibold">{getItemTitle()}</h3>
              {isBonusItem && (
                <Badge className="bg-emerald-500 text-white border-0 text-xs">
                  <Gift className="w-3 h-3 mr-1" />
                  FREE
                </Badge>
              )}
            </div>

            {item.item_type === "event" && !isBonusItem && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Participant Type: <span className="font-medium text-foreground">{item.participant_type_label}</span>
                </p>
              </div>
            )}

            {isBonusItem && (
              <div className="text-sm text-emerald-700 space-y-1">
                <p className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Included with Symposium purchase
                </p>
                {originalPrice > 0 && (
                  <p className="text-xs text-emerald-600">
                    Value: <span className="line-through">{formatCurrency(originalPrice, item.currency)}</span>
                  </p>
                )}
              </div>
            )}

            {item.item_type === "webinar" && !isBonusItem && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Friday, January 30, 2026 at 13:00 WIB</span>
                </div>
                <p>Online Event - Live Streaming</p>
              </div>
            )}

            {item.item_type === "hotel" && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(item.check_in_date!).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                    {new Date(item.check_out_date!).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p>
                  {item.nights} {item.nights === 1 ? "night" : "nights"}
                </p>
                <p className="text-xs">{formatCurrency(item.unit_price, item.currency)} per night</p>
              </div>
            )}

            {isBonusItem ? (
              <p className="text-lg font-bold text-emerald-600">FREE</p>
            ) : (
              <p className="text-lg font-bold text-primary">{formatCurrency(itemTotal, item.currency)}</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isRemoving || isRemoved || isBonusItem}
            className={`relative overflow-hidden transition-all duration-300 ${
              isBonusItem
                ? "text-muted-foreground/50 cursor-not-allowed"
                : isRemoved
                  ? "bg-green-100 text-green-600"
                  : "text-destructive hover:text-destructive hover:bg-destructive/10"
            }`}
            title={isBonusItem ? "Cannot remove bonus items" : "Remove item"}
          >
            {isBonusItem ? (
              <Lock className="h-4 w-4" />
            ) : isRemoved ? (
              <Check className="h-4 w-4 animate-[bounceIn_0.3s_ease-out]" />
            ) : isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 transition-transform hover:scale-110" />
            )}
            <span className="sr-only">{isBonusItem ? "Locked item" : "Remove item"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
