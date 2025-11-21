"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, CheckCircle, XCircle, Clock, Eye, Trash2, Send, AlertTriangle, Info } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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

export default function OrderPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [orderPayment, setOrderPayment] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderType, setOrderType] = useState<{ hasEvents: boolean; hasHotels: boolean }>({
    hasEvents: false,
    hasHotels: false,
  })

  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  useEffect(() => {
    checkAuthAndLoadOrder()
  }, [orderId])

  const checkAuthAndLoadOrder = async () => {
    try {
      let userData = null
      let authAttempts = 0
      const maxAuthAttempts = 3

      while (authAttempts < maxAuthAttempts && !userData) {
        try {
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser()

          if (authError) {
            console.error("[v0] Auth error (attempt " + (authAttempts + 1) + "):", authError)
            if (authAttempts === maxAuthAttempts - 1) {
              toast.error("Authentication failed. Please log in again.")
              router.push("/auth/login")
              return
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
            authAttempts++
            continue
          }

          if (!user) {
            console.log("[v0] No user found, redirecting to login")
            router.push("/auth/login")
            return
          }

          userData = user
          setUser(user)
          break
        } catch (authErr: any) {
          console.error("[v0] Auth fetch error (attempt " + (authAttempts + 1) + "):", authErr)
          authAttempts++
          if (authAttempts >= maxAuthAttempts) {
            setError("Unable to authenticate. Please refresh the page or log in again.")
            toast.error("Authentication failed. Please refresh the page.")
            setIsLoading(false)
            return
          }
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      if (!userData) {
        setError("Authentication failed")
        setIsLoading(false)
        return
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderError) {
        console.error("[v0] Order fetch error:", orderError)
        throw new Error("Failed to load order details")
      }

      if (!orderData) {
        throw new Error("Order not found")
      }

      if (userData && orderData.user_id !== userData.id) {
        toast.error("Unauthorized access")
        router.push("/dashboard")
        return
      }

      setOrder(orderData)

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)

      if (itemsError) {
        console.error("[v0] Items fetch error:", itemsError)
        throw new Error("Failed to load order items")
      }

      setOrderItems(itemsData || [])

      const hasEvents = itemsData?.some((item: any) => item.item_type === "event") || false
      const hasHotels = itemsData?.some((item: any) => item.item_type === "hotel") || false
      setOrderType({ hasEvents, hasHotels })

      const { data: paymentData, error: paymentError } = await supabase
        .from("order_payments")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle()

      if (paymentError && paymentError.code !== "PGRST116") {
        console.error("[v0] Payment fetch error:", paymentError)
      }

      setOrderPayment(paymentData)
      setError(null)
    } catch (error: any) {
      console.error("[v0] Error loading order:", error)
      setError(error.message || "Failed to load booking details")
      toast.error(error.message || "Failed to load booking details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentFile(e.target.files[0])
    }
  }

  const handleUploadProof = async () => {
    if (!paymentFile) {
      toast.error("Please select a file to upload")
      return
    }

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append("file", paymentFile)
      formData.append("orderId", orderId)

      const response = await fetch("/api/upload-payment-proof", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to upload payment proof")
      }

      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (orderUpdateError) throw orderUpdateError

      toast.success("Payment proof uploaded successfully!")
      setPaymentFile(null)
      checkAuthAndLoadOrder()
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmitForVerification = async () => {
    if (!orderPayment?.payment_proof_url) {
      toast.error("Please upload payment proof first")
      return
    }

    try {
      setIsSubmitting(true)

      const { error: paymentUpdateError } = await supabase
        .from("order_payments")
        .update({
          payment_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      if (paymentUpdateError) throw paymentUpdateError

      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (orderUpdateError) throw orderUpdateError

      toast.success("Payment submitted for verification!")
      setShowSubmitDialog(false)
      checkAuthAndLoadOrder()
    } catch (error: any) {
      console.error("[v0] Submit error:", error)
      toast.error(`Submission failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true)

      // Update order payment status if exists
      if (orderPayment) {
        const { error: paymentUpdateError } = await supabase
          .from("order_payments")
          .update({
            payment_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId)

        if (paymentUpdateError) throw paymentUpdateError
      }

      // Update order status
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (orderUpdateError) throw orderUpdateError

      toast.success("Order cancelled successfully")
      setShowCancelDialog(false)
      router.push("/my-purchases")
    } catch (error: any) {
      console.error("[v0] Cancel error:", error)
      toast.error(`Cancellation failed: ${error.message}`)
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const paymentStatus = orderPayment?.payment_status || status
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      not_submitted: { label: "Not Submitted", variant: "secondary", icon: Clock },
      pending: { label: "Pending Review", variant: "default", icon: Clock },
      paid: { label: "Paid", variant: "default", icon: CheckCircle },
      verified: { label: "Verified", variant: "default", icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
      cancelled: { label: "Cancelled", variant: "secondary", icon: XCircle },
    }

    const config = statusConfig[paymentStatus] || statusConfig.not_submitted
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getOrderTitle = () => {
    const eventItems = orderItems.filter((item: any) => item.item_type === "event")
    const hasCPD = eventItems.some(
      (item: any) => item.event_label?.toLowerCase().includes("cpd") || item.event_label?.toLowerCase().includes("day"),
    )
    const hasWorkshop = eventItems.some(
      (item: any) =>
        item.event_label?.toLowerCase().includes("ws") || item.event_label?.toLowerCase().includes("workshop"),
    )
    const hasSymposium = eventItems.some((item: any) => item.event_label?.toLowerCase().includes("symposium"))

    const eventTypes = []
    if (hasCPD) eventTypes.push("CPD Course")
    if (hasWorkshop) eventTypes.push("Workshop")
    if (hasSymposium) eventTypes.push("Symposium")

    if (orderType.hasEvents && orderType.hasHotels) {
      return "Event Registration & Hotel Booking Payment"
    } else if (orderType.hasEvents) {
      if (eventTypes.length > 1) {
        return "Event Registration Payment"
      }
      return `${eventTypes[0] || "Event"} Registration Payment`
    } else if (orderType.hasHotels) {
      return "Hotel Booking Payment"
    }
    return "Order Payment"
  }

  const getOrderDescription = () => {
    if (orderType.hasEvents && orderType.hasHotels) {
      return "Complete your payment for event registration and hotel accommodation"
    } else if (orderType.hasEvents) {
      return "Complete your payment for ISAPM National Meeting 2026 registration"
    } else if (orderType.hasHotels) {
      return "Complete your payment for hotel accommodation"
    }
    return "Complete your payment"
  }

  const getEventBadgeType = (eventLabel: string) => {
    const label = eventLabel?.toLowerCase() || ""
    if (label.includes("symposium")) {
      return { label: "SYMPOSIUM", color: "text-purple-600" }
    } else if (label.includes("ws") || label.includes("workshop")) {
      return { label: "WORKSHOP", color: "text-blue-600" }
    } else {
      return { label: "CPD COURSE", color: "text-primary" }
    }
  }

  const canSubmitForVerification = () => {
    return (
      orderPayment?.payment_proof_url &&
      (orderPayment?.payment_status === "not_submitted" || orderPayment?.payment_status === "rejected")
    )
  }

  const canCancelOrder = () => {
    return (
      order?.status !== "cancelled" &&
      order?.status !== "paid" &&
      order?.status !== "verified" &&
      orderPayment?.payment_status !== "verified" &&
      orderPayment?.payment_status !== "paid"
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-muted/30">
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">{getOrderTitle()}</h1>
                <p className="text-muted-foreground">{getOrderDescription()}</p>
                <p className="text-sm text-muted-foreground mt-1">Order ID: {orderId}</p>
              </div>
              {!isLoading && order && <div>{getStatusBadge(order.status)}</div>}
            </div>

            {isLoading && (
              <Card>
                <CardContent className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            )}

            {error && !isLoading && (
              <Card>
                <CardContent className="py-8 space-y-4">
                  <div className="text-center space-y-2">
                    <XCircle className="w-12 h-12 mx-auto text-destructive" />
                    <h3 className="font-semibold text-lg">Error Loading Order</h3>
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => checkAuthAndLoadOrder()} variant="outline">
                      Retry
                    </Button>
                    <Button onClick={() => router.push("/my-purchases")} variant="default">
                      Back to Purchases
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && !error && order && (
              <>
                {/* Order Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {orderType.hasEvents && "Event Registration Details"}
                      {orderType.hasHotels && !orderType.hasEvents && "Hotel Booking Details"}
                      {orderType.hasEvents && orderType.hasHotels && "Registration & Booking Details"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {orderItems.map((item: any) => (
                      <div key={item.id} className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            {item.item_type === "event" && (
                              <>
                                {(() => {
                                  const badgeInfo = getEventBadgeType(item.event_label)
                                  return (
                                    <div className={`text-xs font-semibold mb-1 ${badgeInfo.color}`}>
                                      {badgeInfo.label}
                                    </div>
                                  )
                                })()}
                                <h3 className="font-semibold text-lg">{item.event_label}</h3>
                                <p className="text-sm text-muted-foreground">{item.participant_type_label}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  ISAPM National Meeting 2026 - April 16-18, 2026
                                </p>
                              </>
                            )}
                            {item.item_type === "hotel" && (
                              <>
                                <div className="text-xs font-semibold text-primary mb-1">HOTEL ACCOMMODATION</div>
                                <h3 className="font-semibold text-lg">{item.hotel_room_type}</h3>
                                <p className="text-sm text-muted-foreground">
                                  The Singhasari Resort & Convention, Batu, Malang
                                </p>
                              </>
                            )}
                          </div>
                          <p className="font-bold text-lg">
                            Rp {(item.unit_price * (item.nights || 1)).toLocaleString("id-ID")}
                          </p>
                        </div>

                        <div className="grid gap-2 text-sm bg-muted p-4 rounded-lg">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {item.item_type === "event" ? "Participant Name:" : "Guest Name:"}
                            </span>
                            <span className="font-medium">{order.full_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{order.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-medium">{order.phone}</span>
                          </div>
                          {item.item_type === "hotel" && item.check_in_date && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Check-in:</span>
                                <span className="font-medium">
                                  {new Date(item.check_in_date).toLocaleDateString("id-ID")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Check-out:</span>
                                <span className="font-medium">
                                  {new Date(item.check_out_date).toLocaleDateString("id-ID")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Number of Nights:</span>
                                <span className="font-medium">{item.nights}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total Amount:</span>
                        <span className="text-primary">Rp {order.total_amount.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Please transfer to the following account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg space-y-3 border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Bank:</span>
                        <span className="font-bold text-lg">Bank Syariah Indonesia (BSI)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Account Number:</span>
                        <span className="font-mono font-bold text-lg">7207681363</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Account Name:</span>
                        <span className="font-semibold">PT.Tombo Farma Indonesia</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-muted-foreground">Branch:</span>
                        <span>KCP MALANG SAWOJAJAR</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Proof Management</CardTitle>
                    <CardDescription>
                      {orderPayment?.payment_proof_url
                        ? "View, update, or manage your payment proof"
                        : "Upload your payment proof after completing the transfer"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {orderPayment?.payment_proof_url && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-base font-semibold">Current Payment Proof</Label>
                          <div className="relative border rounded-lg overflow-hidden bg-muted/30">
                            <div className="relative h-64 w-full">
                              <Image
                                src={orderPayment.payment_proof_url || "/placeholder.svg"}
                                alt="Payment proof"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => setShowImageDialog(true)}>
                                <Eye className="w-4 h-4 mr-1" />
                                View Full
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Uploaded on {new Date(orderPayment.created_at).toLocaleString("id-ID")}
                          </p>
                        </div>

                        {orderPayment.payment_status === "rejected" && orderPayment.rejection_reason && (
                          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-destructive mb-1">Payment Rejected</h4>
                                <p className="text-sm text-destructive/90">{orderPayment.rejection_reason}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Please upload a new payment proof below
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {(orderPayment.payment_status === "verified" || orderPayment.payment_status === "paid") && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-green-700 mb-1">Payment Verified</h4>
                                <p className="text-sm text-green-600">
                                  Your payment has been verified and approved. Thank you!
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {orderPayment.payment_status === "pending" && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-blue-700 mb-1">Under Review</h4>
                                <p className="text-sm text-blue-600">
                                  Your payment is being reviewed by our admin team. This usually takes 1-2 business
                                  days.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {(!orderPayment?.payment_proof_url ||
                      orderPayment?.payment_status === "rejected" ||
                      orderPayment?.payment_status === "not_submitted") && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentProof" className="text-base font-semibold">
                            {orderPayment?.payment_proof_url ? "Upload New Payment Proof" : "Upload Payment Proof"}
                          </Label>
                          <Input
                            id="paymentProof"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">Accepted formats: JPG, PNG, JPEG (Max 10MB)</p>
                        </div>
                        <Button
                          onClick={handleUploadProof}
                          disabled={!paymentFile || isUploading}
                          className="w-full"
                          size="lg"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {orderPayment?.payment_proof_url ? "Replace Payment Proof" : "Upload Payment Proof"}
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {canSubmitForVerification() && (
                      <div className="pt-4 border-t space-y-3">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-blue-800 mb-1">Ready to Submit</p>
                              <p className="text-sm text-blue-700">
                                Your payment proof has been uploaded successfully. Click the button below to submit it
                                for admin verification.
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowSubmitDialog(true)}
                          disabled={isSubmitting}
                          className="w-full bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-600/90"
                          size="lg"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Submit Payment for Approval
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => router.push("/my-purchases")} variant="outline" className="flex-1">
                    Back to My Purchases
                  </Button>
                  {canCancelOrder() && (
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="destructive"
                      className="flex-1"
                      disabled={isCancelling}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>View your uploaded payment proof in full size</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-[600px]">
            {orderPayment?.payment_proof_url && (
              <Image
                src={orderPayment.payment_proof_url || "/placeholder.svg"}
                alt="Payment proof full view"
                fill
                className="object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowImageDialog(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Payment for Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send your payment proof to our admin team for verification. You will be notified once the
              payment has been reviewed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitForVerification} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel This Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone. Your order will be marked as
              cancelled and you will need to create a new order if you wish to register again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
