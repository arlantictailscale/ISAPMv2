"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/cart/utils"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, XCircle, Eye, Clock, RefreshCw, FileX, AlertCircle, CheckCircle2, Gift } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { approvePayment, rejectPayment } from "@/app/actions/payment-validation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getBadgeColors, BADGE_COLORS } from "@/lib/badge-colors"

interface Payment {
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
  sponsor_name: string | null
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
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    console.log("[v0] Checking authentication for payment validation page")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] User:", user ? `${user.email} (${user.id})` : "Not logged in")

    if (!user) {
      console.log("[v0] No user found, redirecting to login")
      router.push("/auth/login")
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log("[v0] Profile:", profile)
    console.log("[v0] Profile error:", profileError)

    if (profile?.role !== "admin") {
      console.log("[v0] User is not admin, redirecting to dashboard")
      router.push("/dashboard")
      return
    }

    console.log("[v0] User is admin, fetching payments")
    setIsAdmin(true)
    await fetchPayments()
  }

  async function fetchPayments() {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting to fetch payments...")

      // Fetch existing payment records
      const { data: paymentsData, error: paymentsError } = await createClient()
        .from("order_payments")
        .select(`
          *,
          orders (
            *,
            order_items (*)
          )
        `)
        .order("created_at", { ascending: false })

      if (paymentsError) {
        console.error("[v0] Error fetching payments:", paymentsError)
        setError(paymentsError.message)
        return
      }

      // Fetch orders without payment records
      const { data: ordersData, error: ordersError } = await createClient()
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .order("created_at", { ascending: false })

      if (ordersError) {
        console.error("[v0] Error fetching orders:", ordersError)
        setError(ordersError.message)
        return
      }

      // Find orders that don't have payment records
      const orderIdsWithPayments = new Set(paymentsData?.map((p) => p.order_id) || [])
      const ordersWithoutPayments = ordersData?.filter((order) => !orderIdsWithPayments.has(order.id)) || []

      // Create payment objects for orders without payments
      const noProofPayments = ordersWithoutPayments.map((order) => ({
        id: `no-payment-${order.id}`,
        order_id: order.id,
        user_id: order.user_id,
        amount: order.total_amount,
        currency: order.currency,
        payment_method: null,
        payment_proof_url: null,
        bank_name: null,
        account_name: null,
        transaction_reference: null,
        payment_status: "no_proof",
        rejection_reason: null,
        notes: null,
        sponsor_name: null,
        verified_by: null,
        verified_at: null,
        created_at: order.created_at,
        updated_at: order.updated_at,
        sponsor_name: null,
        orders: order,
      }))

      // Combine both lists
      const allPayments = [...(paymentsData || []), ...noProofPayments]

      console.log("[v0] Fetched payments count:", paymentsData?.length || 0)
      console.log("[v0] Orders without payments count:", noProofPayments.length)
      console.log("[v0] Fetch error:", paymentsError || ordersError)
      console.log("[v0] Payments data:", paymentsData)

      console.log("[v0] Setting payments state with", allPayments.length, "items")
      setPayments(allPayments)
      console.log("[v0] Finished fetching payments")
    } catch (err) {
      console.error("[v0] Unexpected error:", err)
      setError("Failed to fetch payments")
    } finally {
      setLoading(false)
    }
  }

  const calculateOrderTotal = (items: any[]) => {
    return items.reduce((sum, item) => {
      const nights = item.nights || 1
      return sum + (item.unit_price || 0) * nights
    }, 0)
  }

  const handleApprove = async () => {
    if (!selectedPayment) return

    const order = selectedPayment.orders
    const items = order?.order_items || []
    const calculatedTotal = calculateOrderTotal(items)
    const submittedAmount = selectedPayment.amount

    console.log("[v0] Calculated total:", calculatedTotal)
    console.log("[v0] Submitted amount:", submittedAmount)
    console.log("[v0] Difference:", Math.abs(calculatedTotal - submittedAmount))

    // Check if there's a significant discrepancy (more than 1 IDR due to rounding)
    if (Math.abs(calculatedTotal - submittedAmount) > 1 && selectedPayment.payment_method !== "sponsored") {
      toast({
        title: "Amount Mismatch Detected",
        description: `Submitted amount (${formatCurrency(submittedAmount, selectedPayment.currency)}) does not match calculated order total (${formatCurrency(calculatedTotal, selectedPayment.currency)}). Please verify before approving.`,
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)

    console.log("[v0] Approving payment:", selectedPayment.id)

    const result = await approvePayment(selectedPayment.id, selectedPayment.order_id, calculatedTotal)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error || "Failed to approve payment",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
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
    console.log("[v0] Rejecting payment:", selectedPayment.id)

    const result = await rejectPayment(selectedPayment.id, rejectionReason)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error || "Failed to reject payment",
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
  const approvedPayments = payments.filter((p) => p.payment_status === "verified")
  const rejectedPayments = payments.filter((p) => p.payment_status === "rejected")
  const sponsoredPayments = payments.filter((p) => p.payment_method === "sponsored" && p.payment_status === "pending")
  const noProofPayments = payments.filter(
    (p) =>
      (p.payment_status === "no_proof" ||
        (!p.payment_proof_url && p.payment_status !== "verified" && p.payment_status !== "rejected")) &&
      p.payment_method !== "sponsored",
  )

  console.log("[v0] Filtered payments:", {
    total: payments.length,
    pending: pendingPayments.length,
    approved: approvedPayments.length,
    rejected: rejectedPayments.length,
    sponsored: sponsoredPayments.length,
    noProof: noProofPayments.length,
  })

  const getEventTypeBadge = (label: string) => {
    const colors = getBadgeColors("event", label)
    if (label.toLowerCase().includes("symposium")) {
      return (
        <Badge
          className={`${BADGE_COLORS.SYMPOSIUM.bg} ${BADGE_COLORS.SYMPOSIUM.text} ${BADGE_COLORS.SYMPOSIUM.border}`}
        >
          {BADGE_COLORS.SYMPOSIUM.label}
        </Badge>
      )
    } else if (label.toLowerCase().startsWith("ws ")) {
      return (
        <Badge className={`${BADGE_COLORS.WORKSHOP.bg} ${BADGE_COLORS.WORKSHOP.text} ${BADGE_COLORS.WORKSHOP.border}`}>
          {BADGE_COLORS.WORKSHOP.label}
        </Badge>
      )
    } else {
      return (
        <Badge className={`${BADGE_COLORS.CPD.bg} ${BADGE_COLORS.CPD.text} ${BADGE_COLORS.CPD.border}`}>
          {BADGE_COLORS.CPD.label}
        </Badge>
      )
    }
  }

  const PaymentCard = ({ payment }: { payment: Payment }) => {
    const order = payment.orders
    const items = order?.order_items || []

    const calculatedTotal = calculateOrderTotal(items)

    const isSponsored = payment.payment_method === "sponsored"

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{order?.full_name}</h3>
                <p className="text-sm text-muted-foreground truncate">{order?.email}</p>
                {order?.phone && <p className="text-sm text-muted-foreground break-all">{order.phone}</p>}
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                {isSponsored && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 whitespace-nowrap">
                    <Gift className="w-3 h-3 mr-1" />
                    Sponsored
                  </Badge>
                )}
                <Badge
                  variant={
                    payment.payment_status === "verified"
                      ? "default"
                      : payment.payment_status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                  className="whitespace-nowrap"
                >
                  {payment.payment_status}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground">Order Items:</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {item.item_type === "event" ? (
                      <>
                        {getEventTypeBadge(item.event_label)}
                        <span className="break-words">{item.event_label}</span>
                      </>
                    ) : (
                      <>
                        <Badge
                          className={`${BADGE_COLORS.HOTEL.bg} ${BADGE_COLORS.HOTEL.text} ${BADGE_COLORS.HOTEL.border}`}
                        >
                          {BADGE_COLORS.HOTEL.label}
                        </Badge>
                        <span className="break-words">
                          {item.hotel_room_type} ({item.nights} nights)
                        </span>
                      </>
                    )}
                  </div>
                  <span className="font-medium whitespace-nowrap">
                    {item.item_type === "hotel" && item.nights
                      ? formatCurrency(item.unit_price * item.nights, payment.currency)
                      : formatCurrency(item.unit_price, payment.currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t text-sm">
              <div className="min-w-0">
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium truncate">
                  {isSponsored ? (
                    <span className="flex items-center gap-1">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                        Sponsored
                      </Badge>
                    </span>
                  ) : (
                    payment.payment_method || "Bank Transfer"
                  )}
                </p>
              </div>
              {isSponsored ? (
                <div className="min-w-0 sm:col-span-1">
                  <p className="text-muted-foreground">Sponsor / Benefactor</p>
                  <p className="font-medium text-purple-700 text-lg">{payment.sponsor_name || "Not specified"}</p>
                </div>
              ) : (
                <>
                  <div className="min-w-0">
                    <p className="text-muted-foreground">Bank</p>
                    <p className="font-medium truncate">{payment.bank_name || "N/A"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground">Account Name</p>
                    <p className="font-medium truncate">{payment.account_name || "N/A"}</p>
                  </div>
                </>
              )}
            </div>

            {isSponsored && payment.payment_status === "pending" && (
              <div className="pt-2 border-t">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Gift className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium text-purple-900">Sponsored Payment Verification</p>
                      <p className="text-sm text-purple-700">
                        Please verify this sponsored registration by confirming with the sponsor:{" "}
                        <strong>{payment.sponsor_name}</strong>
                      </p>
                      <ul className="text-sm text-purple-600 list-disc list-inside mt-2 space-y-1">
                        <li>Confirm the sponsor has agreed to cover this registration</li>
                        <li>Verify the participant details with the sponsor</li>
                        <li>Ensure the sponsorship amount covers the order total</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(calculatedTotal, payment.currency)}
              </span>
            </div>

            {/* Payment Proof Thumbnail - only show for non-sponsored payments */}
            {payment.payment_proof_url && !isSponsored && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Payment Proof:</p>
                <div
                  className="relative w-full max-w-full h-40 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
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
                <p className="text-sm text-muted-foreground break-words">{payment.rejection_reason}</p>
              </div>
            )}

            {/* Actions - show for pending bank transfers with proof */}
            {payment.payment_status === "pending" && payment.payment_proof_url && !isSponsored && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
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

            {payment.payment_status === "pending" && isSponsored && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setSelectedPayment(payment)
                    setIsApproveDialogOpen(true)
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Sponsorship
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

  if (loading) {
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
    <>
      <Navigation />
      <main className="pt-24 lg:pt-20 pb-20">
        <div className="bg-muted/30 overflow-x-hidden">
          <div className="container mx-auto p-4 sm:p-6 max-w-full">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Payment Validation</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Review and approve submitted payment proofs</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Loading payments...</p>
                </div>
              </div>
            ) : payments.length === 0 ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No Payments Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      There are currently no payment submissions in the system. Payments will appear here once users
                      submit their payment proofs for orders.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" onClick={fetchPayments}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              // Existing tabs content
              <div className="space-y-6">
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 grid w-full grid-cols-3 sm:grid-cols-5 mb-6">
                    <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Pending</span>
                      <span className="sm:hidden">Pend.</span>
                      {pendingPayments.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                          {pendingPayments.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="sponsored" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Sponsored</span>
                      <span className="sm:hidden">Spon.</span>
                      {sponsoredPayments.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-500 text-white rounded-full">
                          {sponsoredPayments.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Approved ({approvedPayments.length})</span>
                      <span className="sm:hidden">App. ({approvedPayments.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Rejected ({rejectedPayments.length})</span>
                      <span className="sm:hidden">Rej. ({rejectedPayments.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="no-proof" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                      <FileX className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">No Proof ({noProofPayments.length})</span>
                      <span className="sm:hidden">None ({noProofPayments.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-4 mt-6">
                    {pendingPayments.length === 0 ? (
                      <Card className="p-8">
                        <div className="text-center space-y-2">
                          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold">No Pending Payments</h3>
                          <p className="text-sm text-muted-foreground">
                            All submitted payments have been reviewed. Check back later for new submissions.
                          </p>
                        </div>
                      </Card>
                    ) : (
                      pendingPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
                    )}
                  </TabsContent>

                  <TabsContent value="sponsored" className="space-y-4 mt-6">
                    {sponsoredPayments.length === 0 ? (
                      <Card className="p-8">
                        <div className="text-center space-y-2">
                          <Gift className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                          <h3 className="font-semibold">No Pending Sponsored Registrations</h3>
                          <p className="text-sm text-muted-foreground">
                            Sponsored registrations awaiting verification will appear here.
                          </p>
                        </div>
                      </Card>
                    ) : (
                      <>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <Gift className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-purple-900">Sponsored Payment Validation</p>
                              <p className="text-sm text-purple-700 mt-1">
                                These registrations are marked as sponsored. Please verify with each sponsor before
                                approving. No payment proof is required for sponsored registrations.
                              </p>
                            </div>
                          </div>
                        </div>
                        {sponsoredPayments.map((payment) => (
                          <PaymentCard key={payment.id} payment={payment} />
                        ))}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="approved" className="space-y-4 mt-6">
                    {approvedPayments.length === 0 ? (
                      <Card className="p-8">
                        <div className="text-center space-y-2">
                          <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold">No Approved Payments</h3>
                          <p className="text-sm text-muted-foreground">
                            Approved payments will appear here once you verify and approve payment submissions.
                          </p>
                        </div>
                      </Card>
                    ) : (
                      approvedPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
                    )}
                  </TabsContent>

                  <TabsContent value="rejected" className="space-y-4 mt-6">
                    {rejectedPayments.length === 0 ? (
                      <Card className="p-8">
                        <div className="text-center space-y-2">
                          <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold">No Rejected Payments</h3>
                          <p className="text-sm text-muted-foreground">
                            Rejected payments will appear here when you decline payment submissions.
                          </p>
                        </div>
                      </Card>
                    ) : (
                      rejectedPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
                    )}
                  </TabsContent>

                  <TabsContent value="no-proof" className="space-y-4 mt-6">
                    {noProofPayments.length === 0 ? (
                      <Card className="p-8">
                        <div className="text-center space-y-2">
                          <FileX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-semibold">No Unpaid Orders</h3>
                          <p className="text-sm text-muted-foreground">
                            All orders have payment proofs submitted or are being processed.
                          </p>
                        </div>
                      </Card>
                    ) : (
                      noProofPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPayment?.payment_method === "sponsored" ? "Verify Sponsored Registration" : "Approve Payment"}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment?.payment_method === "sponsored"
                ? "Please confirm you have verified this sponsorship with the sponsor before approving."
                : "Are you sure you want to approve this payment? This action will mark the order as paid and allow the user to access their event registrations."}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment &&
            (() => {
              const order = selectedPayment.orders
              const items = order?.order_items || []
              const calculatedTotal = calculateOrderTotal(items)
              const submittedAmount = selectedPayment.amount
              const hasMismatch = Math.abs(calculatedTotal - submittedAmount) > 1
              const isSponsored = selectedPayment.payment_method === "sponsored"

              return (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Order ID:</div>
                    <div className="font-mono text-xs break-all">{selectedPayment.order_id}</div>
                    <div className="text-muted-foreground">Customer:</div>
                    <div className="truncate">{order?.full_name}</div>
                    {isSponsored && (
                      <>
                        <div className="text-muted-foreground">Sponsor:</div>
                        <div className="font-semibold text-purple-700">{selectedPayment.sponsor_name}</div>
                      </>
                    )}
                  </div>

                  {isSponsored && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="font-medium text-purple-900 mb-2">Verification Checklist:</p>
                      <ul className="text-sm text-purple-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-purple-500" />
                          <span>
                            Confirmed sponsorship with <strong>{selectedPayment.sponsor_name}</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-purple-500" />
                          <span>
                            Verified participant: <strong>{order?.full_name}</strong>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-purple-500" />
                          <span>
                            Sponsorship covers:{" "}
                            <strong>{formatCurrency(calculatedTotal, selectedPayment.currency)}</strong>
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-3">
                    <div className="text-sm font-medium">Payment Details:</div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.item_type === "event"
                              ? item.event_label
                              : `${item.hotel_room_type} (${item.nights} nights)`}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              item.item_type === "hotel" && item.nights
                                ? item.unit_price * item.nights
                                : item.unit_price,
                              selectedPayment.currency,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Calculated vs Submitted comparison - only for non-sponsored */}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isSponsored ? "Total Amount:" : "Calculated Total:"}
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(calculatedTotal, selectedPayment.currency)}
                        </span>
                      </div>
                      {!isSponsored && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Submitted Amount:</span>
                          <span className={`font-semibold ${hasMismatch ? "text-destructive" : "text-green-600"}`}>
                            {formatCurrency(submittedAmount, selectedPayment.currency)}
                          </span>
                        </div>
                      )}

                      {!isSponsored && hasMismatch && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-semibold">Amount Mismatch!</div>
                            <div className="text-xs mt-1">
                              The submitted payment amount does not match the calculated order total. Difference:{" "}
                              {formatCurrency(Math.abs(calculatedTotal - submittedAmount), selectedPayment.currency)}
                            </div>
                          </div>
                        </div>
                      )}

                      {!isSponsored && !hasMismatch && (
                        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Amount verified - matches order total</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className={selectedPayment?.payment_method === "sponsored" ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {isProcessing
                ? "Processing..."
                : selectedPayment?.payment_method === "sponsored"
                  ? "Confirm Sponsorship"
                  : "Approve Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The user will be notified and can resubmit with
              corrections.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Order ID:</div>
                <div className="font-mono text-xs break-all">{selectedPayment.order_id}</div>
                <div className="text-muted-foreground">Amount:</div>
                <div className="font-semibold break-all">
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </div>
                <div className="text-muted-foreground">Customer:</div>
                <div className="truncate">{selectedPayment.orders?.full_name}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="E.g., Payment proof is unclear, incorrect amount, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
              {isProcessing ? "Rejecting..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {selectedPayment?.payment_proof_url && (
            <div className="w-full">
              <img
                src={selectedPayment.payment_proof_url || "/placeholder.svg"}
                alt="Payment proof"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}
