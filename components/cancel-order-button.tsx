"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { cancelOrder } from "@/app/actions/cancel-order"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CancelOrderButtonProps {
  orderId: string
}

export function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const result = await cancelOrder(orderId)

      if (result.success) {
        toast.success("Order cancelled successfully")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to cancel order")
      }
    } catch (error) {
      console.error("[v0] Error cancelling order:", error)
      toast.error("An error occurred while cancelling the order")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="default"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto whitespace-nowrap"
      >
        <Trash2 className="w-4 h-4 shrink-0" />
        <span className="truncate sm:inline">Cancel Order</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone. The order will be removed from
              your purchases and you will need to create a new order if you wish to purchase these items again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Cancelling..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
