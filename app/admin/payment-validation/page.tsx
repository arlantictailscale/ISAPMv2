"use client"

import { createClient } from "@/lib/supabase/client"
import { adminCancelOrder } from "@/app/actions/admin-cancel-order"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/cart/utils"
import { formatDistanceToNow, format } from "date-fns"
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  RefreshCw,
  FileX,
  AlertCircle,
  CheckCircle2,
  Gift,
  Search,
  Filter,
  Calendar,
  DollarSign,
  FileText,
  Copy,
  Building,
  Hash,
  ExternalLink,
} from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBadgeColors, BADGE_COLORS } from "@/lib/badge-colors"
import Image from "next/image" // Added Image component import
import { trackPurchase } from "@/lib/meta-pixel"

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
  invoice_number: string | null
  verified_at: string | null
  verified_by: string | null
  orders: {
    id: string
    full_name: string
    email: string
    phone: string
    total_amount: number
    currency: string
    status: string
    created_at: string
    institution: string | null
    position: string | null
    order_items: Array<{
      id: string
      event_label: string
      item_type: string
      unit_price: number
      hotel_room_type: string | null
      check_in_date: string | null
      check_out_date: string | null
      nights: number | null
      extra_beds: number | null
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

  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<"all" | "bank_transfer" | "sponsored">("all")

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setIsAdmin(true)
    await fetchPayments()
  }

  async function fetchPayments() {
    setLoading(true)
    setError(null)

    try {
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
        setError(paymentsError.message)
        return
      }

      // Fetch orders without payment records (exclude cancelled orders)
      const { data: ordersData, error: ordersError } = await createClient()
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })

      if (ordersError) {
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
        invoice_number: null,
        verified_by: null,
        verified_at: null,
        created_at: order.created_at,
        updated_at: order.updated_at,
        orders: order,
      }))

      // Combine both lists
      const allPayments = [...(paymentsData || []), ...noProofPayments]
      setPayments(allPayments)
    } catch (err) {
      setError("Failed to fetch payments")
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = useMemo(() => {
    let result = payments

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((p) => {
        const order = p.orders
        return (
          order?.full_name?.toLowerCase().includes(query) ||
          order?.email?.toLowerCase().includes(query) ||
          order?.phone?.toLowerCase().includes(query) ||
          order?.institution?.toLowerCase().includes(query) ||
          p.order_id?.toLowerCase().includes(query) ||
          p.transaction_reference?.toLowerCase().includes(query) ||
          p.invoice_number?.toLowerCase().includes(query) ||
          p.sponsor_name?.toLowerCase().includes(query)
        )
      })
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const startDate = new Date()

      if (dateFilter === "today") {
        startDate.setHours(0, 0, 0, 0)
      } else if (dateFilter === "week") {
        startDate.setDate(now.getDate() - 7)
      } else if (dateFilter === "month") {
        startDate.setMonth(now.getMonth() - 1)
      }

      result = result.filter((p) => new Date(p.created_at) >= startDate)
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      if (paymentMethodFilter === "sponsored") {
        result = result.filter((p) => p.payment_method?.toLowerCase() === "sponsored")
      } else {
        result = result.filter((p) => p.payment_method?.toLowerCase() !== "sponsored")
      }
    }

    return result
  }, [payments, searchQuery, dateFilter, paymentMethodFilter])

  const stats = useMemo(() => {
    const pendingCount = filteredPayments.filter((p) => p.payment_status === "pending" && p.payment_proof_url).length
    const sponsoredPendingCount = filteredPayments.filter(
      (p) => p.payment_method?.toLowerCase() === "sponsored" && p.payment_status === "pending",
    ).length
    const approvedCount = filteredPayments.filter((p) => p.payment_status === "verified").length
    const rejectedCount = filteredPayments.filter((p) => p.payment_status === "rejected").length
    const noProofCount = filteredPayments.filter(
      (p) =>
        (p.payment_status === "no_proof" ||
          (!p.payment_proof_url && p.payment_status !== "verified" && p.payment_status !== "rejected")) &&
        p.payment_method?.toLowerCase() !== "sponsored",
    ).length

    const totalPendingAmount = filteredPayments
      .filter((p) => p.payment_status === "pending")
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const totalApprovedAmount = filteredPayments
      .filter((p) => p.payment_status === "verified")
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    return {
      pendingCount,
      sponsoredPendingCount,
      approvedCount,
      rejectedCount,
      noProofCount,
      totalPendingAmount,
      totalApprovedAmount,
      totalNeedingAction: pendingCount + sponsoredPendingCount,
    }
  }, [filteredPayments])

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

    // Check if there's a significant discrepancy (more than 1 IDR due to rounding)
    if (
      Math.abs(calculatedTotal - submittedAmount) > 1 &&
      selectedPayment.payment_method?.toLowerCase() !== "sponsored"
    ) {
      toast({
        title: "Amount Mismatch Detected",
        description: `Submitted amount (${formatCurrency(submittedAmount, selectedPayment.currency)}) does not match calculated order total (${formatCurrency(calculatedTotal, selectedPayment.currency)}). Please verify before approving.`,
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)

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

    // Track Purchase event for Meta Pixel
    trackPurchase({
      value: calculatedTotal,
      currency: "IDR",
      content_name: items.map((i: any) => i.event_label || i.hotel_room_type).join(", "),
      content_ids: items.map((i: any) => i.event_id || i.hotel_booking_id).filter(Boolean),
      content_type: "product",
      num_items: items.length,
    })
    
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

  // Use filtered payments for tab counts
  const pendingPayments = filteredPayments.filter((p) => p.payment_status === "pending" && p.payment_proof_url)
  const approvedPayments = filteredPayments.filter((p) => p.payment_status === "verified")
  const rejectedPayments = filteredPayments.filter((p) => p.payment_status === "rejected")
  const sponsoredPayments = filteredPayments.filter(
    (p) => p.payment_method?.toLowerCase() === "sponsored" && p.payment_status === "pending",
  )
  const noProofPayments = filteredPayments.filter(
    (p) =>
      (p.payment_status === "no_proof" ||
        (!p.payment_proof_url && p.payment_status !== "verified" && p.payment_status !== "rejected")) &&
      p.payment_method?.toLowerCase() !== "sponsored",
  )

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    })
  }

  const PaymentCard = ({ payment }: { payment: Payment }) => {
    const order = payment.orders
    const items = order?.order_items || []

    const calculatedTotal = calculateOrderTotal(items)

    const isSponsored = payment.payment_method?.toLowerCase() === "sponsored"

    return (
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{order?.full_name}</h3>
                <p className="text-sm text-muted-foreground truncate">{order?.email}</p>
                {order?.phone && <p className="text-sm text-muted-foreground break-all">{order.phone}</p>}
                {order?.institution && (
                  <div className="flex items-center gap-1 mt-1">
                    <Building className="w-3 h-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground truncate">{order.institution}</p>
                  </div>
                )}
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

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-xs bg-muted/50 rounded-lg p-3 overflow-hidden">
              <div className="flex items-center gap-1 min-w-0">
                <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Order:</span>
                <button
                  onClick={() => copyToClipboard(payment.order_id, "Order ID")}
                  className="font-mono hover:text-primary transition-colors flex items-center gap-1 truncate"
                >
                  <span className="truncate">{payment.order_id.slice(0, 8)}...</span>
                  <Copy className="w-3 h-3 shrink-0" />
                </button>
              </div>
              {payment.transaction_reference && (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-muted-foreground shrink-0">Ref:</span>
                  <button
                    onClick={() => copyToClipboard(payment.transaction_reference!, "Reference")}
                    className="font-mono hover:text-primary transition-colors flex items-center gap-1 truncate"
                  >
                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{payment.transaction_reference}</span>
                    <Copy className="w-3 h-3 shrink-0" />
                  </button>
                </div>
              )}
              {payment.invoice_number && (
                <div className="flex items-center gap-1 min-w-0">
                  <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground shrink-0">Invoice:</span>
                  <span className="font-mono truncate max-w-[100px]">{payment.invoice_number}</span>
                </div>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(payment.created_at), "dd MMM yyyy HH:mm")}</span>
              </div>
            </div>

            {/* Order Items - Improved layout */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">Order Items Breakdown:</p>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-1.5 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      {item.item_type === "event" ? (
                        <>
                          {getEventTypeBadge(item.event_label)}
                          <span className="text-sm line-clamp-2">{item.event_label}</span>
                        </>
                      ) : item.item_type === "webinar" ? (
                        <>
                          <Badge
                            className={`${BADGE_COLORS.WEBINAR.bg} ${BADGE_COLORS.WEBINAR.text} ${BADGE_COLORS.WEBINAR.border} shrink-0`}
                          >
                            {BADGE_COLORS.WEBINAR.label}
                          </Badge>
                          <span className="text-sm line-clamp-2">{item.event_label}</span>
                        </>
                      ) : (
                        <>
                          <Badge
                            className={`${BADGE_COLORS.HOTEL.bg} ${BADGE_COLORS.HOTEL.text} ${BADGE_COLORS.HOTEL.border} shrink-0`}
                          >
                            {BADGE_COLORS.HOTEL.label}
                          </Badge>
                          <span className="text-sm font-medium">
                            {item.hotel_room_type} ({item.nights} night{item.nights > 1 ? "s" : ""})
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="font-semibold text-base">
                        {item.item_type === "hotel" && item.nights
                          ? formatCurrency(item.unit_price * item.nights, payment.currency)
                          : formatCurrency(item.unit_price, payment.currency)}
                      </div>
                      {item.item_type === "hotel" && item.nights && (
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.unit_price, payment.currency)} × {item.nights}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.item_type === "hotel" && item.extra_beds && item.extra_beds > 0 && (
                    <div className="pl-2 border-l-2 border-amber-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-amber-600 rounded-full"></span>+{item.extra_beds}{" "}
                          extra bed{item.extra_beds > 1 ? "s" : ""} (incl. breakfast)
                        </span>
                        <span className="text-xs text-amber-600 font-medium">Included in rate</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t text-sm">
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

            {payment.payment_status === "verified" && payment.verified_at && (
              <div className="pt-2 border-t">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified on {format(new Date(payment.verified_at), "dd MMM yyyy 'at' HH:mm")}</span>
                  </div>
                </div>
              </div>
            )}

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

            {/* Total - Enhanced styling and separation */}
            <div className="pt-4 border-t-2 border-primary/20">
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(calculatedTotal, payment.currency)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {items.length} item{items.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Payment Proof Thumbnail - only show for non-sponsored payments */}
            {payment.payment_proof_url && !isSponsored && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Payment Proof:</p>
                {payment.payment_proof_url.toLowerCase().endsWith(".pdf") ? (
                  <div
                    className="relative w-full max-w-full h-40 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center border"
                    onClick={() => {
                      window.open(payment.payment_proof_url!, "_blank")
                    }}
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="w-12 h-12" />
                      <span className="text-sm font-medium">PDF Document</span>
                      <span className="text-xs">Click to view</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="relative w-full max-w-full h-40 bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setSelectedPayment(payment)
                      setIsImageDialogOpen(true)
                    }}
                  >
                    <Image
                      src={payment.payment_proof_url || "/placeholder.svg"}
                      alt="Payment proof"
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        // Fallback to placeholder on error
                        const target = e.target as HTMLImageElement
                        target.src = "/payment-proof-image.jpg"
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                      <Eye className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                )}
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

            {/* Actions for sponsored payments */}
            {isSponsored && payment.payment_status === "pending" && (
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

            {/* Cancel button for no_proof orders */}
            {payment.payment_status === "no_proof" && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={async () => {
                    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
                      return
                    }
                    const result = await adminCancelOrder(payment.order_id)
                    if (result.success) {
                      alert("Order cancelled successfully")
                      fetchPayments()
                    } else {
                      alert(`Failed to cancel order: ${result.error}`)
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
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
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <p>Access denied. Admin privileges required.</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navigation />
      <main className="flex-1 w-full max-w-7xl mx-auto pt-24 pb-20 px-4 overflow-x-hidden">
        <div className="space-y-6 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Payment Validation</h1>
              <p className="text-muted-foreground">Review and approve submitted payment proofs</p>
            </div>
            <Button onClick={fetchPayments} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-700">{stats.totalNeedingAction}</p>
                    <p className="text-sm text-amber-600">Needs Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">{stats.approvedCount}</p>
                    <p className="text-sm text-green-600">Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{stats.sponsoredPendingCount}</p>
                    <p className="text-sm text-purple-600">Sponsored Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-700">
                      {formatCurrency(stats.totalApprovedAmount, "IDR")}
                    </p>
                    <p className="text-sm text-blue-600">Total Approved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, order ID, invoice, institution..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <Calendar className="w-4 h-4 mr-2 shrink-0" />
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentMethodFilter} onValueChange={(v: any) => setPaymentMethodFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <Filter className="w-4 h-4 mr-2 shrink-0" />
                      <SelectValue placeholder="Payment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(searchQuery || dateFilter !== "all" || paymentMethodFilter !== "all") && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Showing {filteredPayments.length} of {payments.length} payments
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setDateFilter("all")
                      setPaymentMethodFilter("all")
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="pending" className="flex-1 min-w-[100px] data-[state=active]:bg-amber-100">
                <Clock className="w-4 h-4 mr-2 hidden sm:inline" />
                Pending
                {pendingPayments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-amber-200 text-amber-800">
                    {pendingPayments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sponsored" className="flex-1 min-w-[100px] data-[state=active]:bg-purple-100">
                <Gift className="w-4 h-4 mr-2 hidden sm:inline" />
                Sponsored
                {sponsoredPayments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-purple-200 text-purple-800">
                    {sponsoredPayments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex-1 min-w-[100px] data-[state=active]:bg-green-100">
                <CheckCircle2 className="w-4 h-4 mr-2 hidden sm:inline" />
                Approved ({approvedPayments.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1 min-w-[100px] data-[state=active]:bg-red-100">
                <XCircle className="w-4 h-4 mr-2 hidden sm:inline" />
                Rejected ({rejectedPayments.length})
              </TabsTrigger>
              <TabsTrigger value="no_proof" className="flex-1 min-w-[100px] data-[state=active]:bg-gray-100">
                <FileX className="w-4 h-4 mr-2 hidden sm:inline" />
                No Proof ({noProofPayments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {pendingPayments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending payments to review</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sponsored" className="mt-6">
              {sponsoredPayments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sponsored payments pending verification</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sponsoredPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {approvedPayments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No approved payments yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {approvedPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {rejectedPayments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No rejected payments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {rejectedPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="no_proof" className="mt-6">
              {noProofPayments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <FileX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>All orders have payment proofs submitted</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {noProofPayments.map((payment) => (
                    <PaymentCard key={payment.id} payment={payment} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Image Preview Dialog */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
              <DialogDescription>Review the submitted payment proof</DialogDescription>
            </DialogHeader>
            {selectedPayment?.payment_proof_url && (
              <div className="relative w-full min-h-[300px]">
                {selectedPayment.payment_proof_url.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <FileText className="w-16 h-16 text-muted-foreground" />
                    <p className="text-muted-foreground">PDF Document</p>
                    <Button onClick={() => window.open(selectedPayment.payment_proof_url!, "_blank")} variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open PDF in New Tab
                    </Button>
                  </div>
                ) : (
                  <Image
                    src={selectedPayment.payment_proof_url || "/placeholder.svg"}
                    alt="Payment proof"
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain rounded-lg"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/payment-proof-image.jpg"
                    }}
                  />
                )}
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                Close
              </Button>
              {selectedPayment?.payment_status === "pending" && (
                <>
                  <Button
                    variant="default"
                    onClick={() => {
                      setIsImageDialogOpen(false)
                      setIsApproveDialogOpen(true)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsImageDialogOpen(false)
                      setIsRejectDialogOpen(true)
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedPayment?.payment_method?.toLowerCase() === "sponsored"
                  ? "Verify Sponsored Registration"
                  : "Approve Payment"}
              </DialogTitle>
              <DialogDescription>
                {selectedPayment?.payment_method?.toLowerCase() === "sponsored" ? (
                  <>
                    <span className="font-medium text-purple-700">Sponsor: {selectedPayment?.sponsor_name}</span>
                    <br />
                    Please confirm you have verified this sponsorship before approving.
                  </>
                ) : (
                  <>
                    Are you sure you want to approve this payment for{" "}
                    <strong>{selectedPayment?.orders?.full_name}</strong>?
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedPayment?.payment_method?.toLowerCase() === "sponsored" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-4">
                <p className="text-sm font-medium text-purple-900 mb-2">Verification Checklist:</p>
                <ul className="text-sm text-purple-700 list-disc list-inside space-y-1">
                  <li>Sponsor has confirmed the registration</li>
                  <li>Participant details match sponsor's request</li>
                  <li>Sponsorship covers the total amount</li>
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className={
                  selectedPayment?.payment_method?.toLowerCase() === "sponsored"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : ""
                }
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {selectedPayment?.payment_method?.toLowerCase() === "sponsored"
                      ? "Verify & Approve"
                      : "Approve Payment"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedPayment?.payment_method?.toLowerCase() === "sponsored"
                  ? "Reject Sponsored Registration"
                  : "Reject Payment"}
              </DialogTitle>
              <DialogDescription>
                {selectedPayment?.payment_method?.toLowerCase() === "sponsored" ? (
                  <>
                    <span className="font-medium text-purple-700">Sponsor: {selectedPayment?.sponsor_name}</span>
                    <br />
                    Please provide a reason for rejecting this sponsored registration.
                  </>
                ) : (
                  <>Please provide a reason for rejecting this payment.</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder={
                    selectedPayment?.payment_method?.toLowerCase() === "sponsored"
                      ? "e.g., Unable to verify sponsorship, sponsor not confirmed, etc."
                      : "e.g., Payment amount mismatch, unclear payment proof, etc."
                  }
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
              {selectedPayment?.payment_method?.toLowerCase() === "sponsored" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectionReason("Sponsorship not confirmed by sponsor")}
                  >
                    Sponsor not confirmed
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRejectionReason("Invalid sponsor information")}>
                    Invalid sponsor info
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectionReason("Sponsorship expired or cancelled")}
                  >
                    Sponsorship cancelled
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectionReason("Payment amount does not match")}
                  >
                    Amount mismatch
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setRejectionReason("Payment proof is unclear")}>
                    Unclear proof
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectionReason("Payment not found in bank statement")}
                  >
                    Not found
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false)
                  setRejectionReason("")
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  )
}
