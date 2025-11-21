"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/cart/utils"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, XCircle, Eye, Clock, AlertCircle, ImageIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminDropdownNav } from "@/components/admin-dropdown-nav"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface OrderPayment {
  id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  payment_method: string
  bank_name: string
  account_name: string
  transaction_reference: string
  payment_proof_url: string | null
  payment_status: string
  rejection_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  orders: {
    id: string
    full_name: string
    email: string
    phone: string
    total_amount: number
    currency: string
    status: string
    created_at: string
    order_items: Array<{
      id: string
      event_label: string
      item_type: string
      unit_price: number
      hotel_room_type: string | null
      check_in_date: string | null
      check_out_date: string | null
      nights: number | null
    }>
  }
}

export default function PaymentValidationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [payments, setPayments] = useState<OrderPayment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<OrderPayment | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setIsAdmin(true)
    await fetchPayments()
  }

  const fetchPayments = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("order_payments")
      .select(`
        *,
        orders (
          *,
          order_items (*)
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      })
    } else {
      setPayments(data || [])
    }

    setIsLoading(false)
  }

  const handleApprove = async () => {
    if (!selectedPayment) return
    setIsProcessing(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: paymentError } = await supabase
      .from("order_payments")
      .update({
        payment_status: "verified",
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        rejection_reason: null,
      })
      .eq("id", selectedPayment.id)

    if (paymentError) {
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    // Update order status to paid
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", selectedPayment.order_id)

    if (orderError) {
      console.error("[v0] Error updating order status:", orderError)
    }

    toast({
      title: "Success",
      description: "Payment approved successfully",
    })

    setIsApproveDialogOpen(false)
    setSelectedPayment(null)
    setIsProcessing(false)
    await fetchPayments()
  }

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("order_payments")
      .update({
        payment_status: "rejected",
        rejection_reason: rejectionReason,
      })
      .eq("id", selectedPayment.id)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    toast({
      title: "Payment Rejected",
      description: "The payment has been rejected and user has been notified",
    })

    setIsRejectDialogOpen(false)
    setSelectedPayment(null)
    setRejectionReason("")
    setIsProcessing(false)
    await fetchPayments()
  }

  const pendingPayments = payments.filter((p) => p.payment_status === "pending" && p.payment_proof_url)
  const verifiedPayments = payments.filter((p) => p.payment_status === "verified")
  const rejectedPayments = payments.filter((p) => p.payment_status === "rejected")
  const noProofPayments = payments.filter((p) => !p.payment_proof_url)

  const getEventTypeBadge = (label: string) => {
    if (label.toLowerCase().includes("symposium")) {
      return <Badge className="bg-purple-100 text-purple-700 border-purple-300">SYMPOSIUM</Badge>
    } else if (label.toLowerCase().startsWith("ws ")) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300">WORKSHOP</Badge>
    } else {
      return <Badge className="bg-teal-100 text-teal-700 border-teal-300">CPD COURSE</Badge>
    }
  }

  const PaymentCard = ({ payment }: { payment: OrderPayment }) => {
    const order = payment.orders
    const items = order?.order_items || []

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{order?.full_name}</h3>
                <p className="text-sm text-muted-foreground">{order?.email}</p>
                {order?.phone && <p className="text-sm text-muted-foreground">{order.phone}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={
                    payment.payment_status === "verified"
                      ? "default"
                      : payment.payment_status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {payment.payment_status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground">Order Items:</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {item.item_type === "event" ? (
                      <>
                        {getEventTypeBadge(item.event_label)}
                        <span>{item.event_label}</span>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline">HOTEL</Badge>
                        <span>
                          {item.hotel_room_type} ({item.nights} nights)
                        </span>
                      </>
                    )}
                  </div>
                  <span className="font-medium">{formatCurrency(item.unit_price, payment.currency)}</span>
                </div>
              ))}
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{payment.payment_method || "Bank Transfer"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bank</p>
                <p className="font-medium">{payment.bank_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Name</p>
                <p className="font-medium">{payment.account_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-bold text-primary text-lg">{formatCurrency(payment.amount, payment.currency)}</p>
              </div>
            </div>

            {/* Payment Proof Thumbnail */}
            {payment.payment_proof_url && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Payment Proof:</p>
                <div
                  className="relative w-full h-40 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setSelectedPayment(payment)
                    setIsImageDialogOpen(true)
                  }}
                >
                  <img
                    src={payment.payment_proof_url || "/placeholder.svg"}
                    alt="Payment proof"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                    <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {payment.rejection_reason && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                <p className="text-sm text-muted-foreground">{payment.rejection_reason}</p>
              </div>
            )}

            {/* Actions */}
            {payment.payment_status === "pending" && payment.payment_proof_url && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  className="flex-1"
                  variant="default"
                  onClick={() => {
                    setSelectedPayment(payment)
                    setIsApproveDialogOpen(true)
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => {
                    setSelectedPayment(payment)
                    setIsRejectDialogOpen(true)
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AdminDropdownNav />

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Payment Validation</h1>
            <p className="text-muted-foreground">Review and approve submitted payment proofs</p>
          </div>

          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingPayments.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{verifiedPayments.length}</div>
                <p className="text-xs text-muted-foreground">Verified payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rejectedPayments.length}</div>
                <p className="text-xs text-muted-foreground">Needs resubmission</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">No Proof</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{noProofPayments.length}</div>
                <p className="text-xs text-muted-foreground">Not submitted yet</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
              <TabsTrigger value="verified">Approved ({verifiedPayments.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedPayments.length})</TabsTrigger>
              <TabsTrigger value="no-proof">No Proof ({noProofPayments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingPayments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No pending payments to review</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="verified" className="space-y-4">
              {verifiedPayments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {verifiedPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No approved payments yet</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedPayments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {rejectedPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No rejected payments</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="no-proof" className="space-y-4">
              {noProofPayments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {noProofPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>All payments have proof submitted</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Image View Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>Full view of the uploaded payment proof</DialogDescription>
          </DialogHeader>
          {selectedPayment?.payment_proof_url && (
            <div className="w-full max-h-[70vh] overflow-auto">
              <img
                src={selectedPayment.payment_proof_url || "/placeholder.svg"}
                alt="Payment proof full view"
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this payment? The order status will be updated to "paid".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The user will be notified and can resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Payment proof is unclear, amount doesn't match, wrong account..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
              {isProcessing ? "Processing..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
