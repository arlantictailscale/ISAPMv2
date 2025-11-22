"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/cart/utils"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, XCircle, Eye, Clock, RefreshCw, FileX } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { approvePayment, rejectPayment } from "@/app/actions/payment-validation"

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
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [payments, setPayments] = useState<OrderPayment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<OrderPayment | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
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

  const fetchPayments = async () => {
    console.log("[v0] Starting to fetch payments...")
    setLoading(true)
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

    console.log("[v0] Fetched payments count:", data?.length || 0)
    console.log("[v0] Fetch error:", error)
    console.log("[v0] Payments data:", JSON.stringify(data, null, 2))

    if (error) {
      console.error("[v0] Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive",
      })
    } else {
      console.log("[v0] Setting payments state with", data?.length || 0, "items")
      setPayments(data || [])
    }

    setLoading(false)
    console.log("[v0] Finished fetching payments")
  }

  const handleApprove = async () => {
    if (!selectedPayment) return
    setIsProcessing(true)

    console.log("[v0] Approving payment:", selectedPayment.id)

    const result = await approvePayment(selectedPayment.id, selectedPayment.order_id)

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
  const noProofPayments = payments.filter((p) => !p.payment_proof_url)

  console.log("[v0] Filtered payments:", {
    total: payments.length,
    pending: pendingPayments.length,
    approved: approvedPayments.length,
    rejected: rejectedPayments.length,
    noProof: noProofPayments.length,
  })

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
        <div className="min-h-screen bg-muted/30">
          <div className="container mx-auto p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Payment Validation</h1>
              <p className="text-muted-foreground">Review and approve submitted payment proofs</p>
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
                    <p className="text-muted-foreground max-w-md mx-auto">
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
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending
                      {pendingPayments.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                          {pendingPayments.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Approved ({approvedPayments.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Rejected ({rejectedPayments.length})
                    </TabsTrigger>
                    <TabsTrigger value="no-proof" className="flex items-center gap-2">
                      <FileX className="w-4 h-4" />
                      No Proof ({noProofPayments.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-4">
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

                  <TabsContent value="approved" className="space-y-4">
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

                  <TabsContent value="rejected" className="space-y-4">
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

                  <TabsContent value="no-proof" className="space-y-4">
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
      <Footer />
    </>
  )
}
