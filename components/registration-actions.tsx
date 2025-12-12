"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface RegistrationActionsProps {
  registrationId: string
  payment: any
  registrationStatus: string
}

export function RegistrationActions({ registrationId, payment, registrationStatus }: RegistrationActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancellingPayment, setIsCancellingPayment] = useState(false)

  const handleDeleteRegistration = async () => {
    try {
      setIsDeleting(true)
      const { error } = await supabase.from("registrations").delete().eq("id", registrationId)

      if (error) {
        toast.error("Failed to delete registration")
        return
      }

      toast.success("Registration deleted successfully")
      router.refresh()
    } catch (err) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelPayment = async () => {
    if (!payment) return

    try {
      setIsCancellingPayment(true)
      const { error } = await supabase.from("payments").delete().eq("id", payment.id).eq("payment_status", "pending")

      if (error) {
        toast.error("Failed to cancel payment submission")
        return
      }

      toast.success("Payment submission cancelled")
      router.refresh()
    } catch (err) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsCancellingPayment(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      {payment?.payment_status === "pending" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50 w-full bg-transparent"
              disabled={isCancellingPayment}
            >
              {isCancellingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Payment Submission"
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Payment Submission?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your submitted payment proof. You can submit a new payment proof afterwards.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Payment</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelPayment} className="bg-orange-600 hover:bg-orange-700">
                Yes, Cancel Submission
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {!payment && registrationStatus === "pending" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 w-full bg-transparent"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Registration
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Registration?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your registration.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRegistration} className="bg-red-600 hover:bg-red-700">
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
