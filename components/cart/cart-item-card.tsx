"use client"

import { Trash2, Calendar, HotelIcon, Users, Video, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  const router = useRouter()
  const { refreshCart } = useCart()

  const itemTotal =
    item.item_type === "hotel" && item.nights ? (item.unit_price || 0) * item.nights : item.unit_price || 0

  const handleRemove = async () => {
    setIsRemoving(true)
    const result = await removeFromCart(item.id)

    if (result.error) {
      toast.error("Failed to remove item", {
        description: result.error,
      })
      setIsRemoving(false)
    } else {
      toast.success("Item removed from cart")
      await refreshCart()
      router.refresh()
    }
  }

  const getItemIcon = () => {
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {getItemIcon()}
              <h3 className="font-semibold">{getItemTitle()}</h3>
            </div>

            {item.item_type === "event" && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Participant Type: <span className="font-medium text-foreground">{item.participant_type_label}</span>
                </p>
              </div>
            )}

            {item.item_type === "webinar" && (
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

            <p className="text-lg font-bold text-primary">{formatCurrency(itemTotal, item.currency)}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span className="sr-only">Remove item</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
