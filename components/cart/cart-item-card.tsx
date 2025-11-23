"use client"

import { Trash2, Calendar, HotelIcon, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/cart/utils"
import type { CartItem } from "@/lib/cart/types"
import { removeFromCart } from "@/app/actions/cart"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CartItemCardProps {
  item: CartItem
}

export function CartItemCard({ item }: CartItemCardProps) {
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()

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
      router.refresh()
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Item Type Icon and Title */}
            <div className="flex items-center gap-2">
              {item.item_type === "event" ? (
                <Users className="h-5 w-5 text-primary" />
              ) : (
                <HotelIcon className="h-5 w-5 text-secondary" />
              )}
              <h3 className="font-semibold">
                {item.item_type === "event" ? item.event_label : `Hotel Room - ${item.hotel_room_type}`}
              </h3>
            </div>

            {/* Event Details */}
            {item.item_type === "event" && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Participant Type: <span className="font-medium text-foreground">{item.participant_type_label}</span>
                </p>
              </div>
            )}

            {/* Hotel Details */}
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

            {/* Price */}
            <p className="text-lg font-bold text-primary">{formatCurrency(itemTotal, item.currency)}</p>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove item</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
