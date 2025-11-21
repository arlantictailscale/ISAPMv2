"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Clock, Eye, ImageIcon, FileSpreadsheet } from 'lucide-react'
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import * as XLSX from 'xlsx'

interface PaymentWithRegistration {
  id: string
  registration_id: string
  user_id: string
  amount: number
  currency: string
  payment_method: string
  bank_name: string
  account_name: string
  transaction_reference: string
  payment_status: string
  notes: string
  created_at: string
  payment_proof_url?: string
  rejection_reason?: string
  registrations: {
    first_name: string
    last_name: string
    email: string
    registration_type: string
  }
  profiles: {
    position: string
  } | null
  has_payment: boolean
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [payments, setPayments] = useState<PaymentWithRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRegistration | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndFetchPayments()
  }, [])

  const checkAdminAndFetchPayments = async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profile || profile.role !== "admin") {
        toast.error("Unauthorized access")
        router.push("/")
        return
      }

      await fetchPayments()
    } catch (err) {
      console.error("[v0] Error checking admin status:", err)
      toast.error("Failed to load admin panel")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          `
          *,
          registrations (
            first_name,
            last_name,
            email,
            registration_type
          )
        `
        )
        .order("created_at", { ascending: false })

      if (paymentsError) throw paymentsError

      console.log("[v0] Payments data:", paymentsData)

      const { data: registrationsData, error: registrationsError } = await supabase
        .from("registrations")
        .select("*")
        .order("updated_at", { ascending: false })

      if (registrationsError) throw registrationsError

      console.log("[v0] All registrations:", registrationsData)

      const registrationIdsWithPayments = paymentsData?.map(p => p.registration_id) || []

      console.log("[v0] Registration IDs with payments:", registrationIdsWithPayments)

      const registrationsWithoutPayments = registrationsData?.filter(
        reg => !registrationIdsWithPayments.includes(reg.id)
      ) || []

      console.log("[v0] Registrations without payments:", registrationsWithoutPayments)

      const paymentUserIds = paymentsData?.map(p => p.user_id).filter(Boolean) || []
      const registrationUserIds = registrationsWithoutPayments?.map(r => r.user_id).filter(Boolean) || []
      const userIds = [...new Set([...paymentUserIds, ...registrationUserIds])] as string[]
      
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, position")
        .in("id", userIds)

      if (profilesError) {
        console.error("[v0] Error fetching profiles:", profilesError)
      }

      const paymentsWithProfiles = paymentsData?.map(payment => ({
        ...payment,
        profiles: profilesData?.find(profile => profile.id === payment.user_id) || null,
        has_payment: true
      })) || []

      const registrationsAsPayments = registrationsWithoutPayments?.map(reg => ({
        id: reg.id,
        registration_id: reg.id,
        user_id: reg.user_id || '',
        amount: reg.amount || 0,
        currency: reg.currency || 'IDR',
        payment_method: '-',
        bank_name: '-',
        account_name: '-',
        transaction_reference: '-',
        payment_status: 'not_submitted',
        notes: '',
        created_at: reg.updated_at || reg.order_date,
        registrations: {
          first_name: reg.first_name,
          last_name: reg.last_name,
          email: reg.email,
          registration_type: reg.registration_type
        },
        profiles: profilesData?.find(profile => profile.id === reg.user_id) || { position: reg.position || '-' },
        has_payment: false
      })) || []

      const allPayments = [...paymentsWithProfiles, ...registrationsAsPayments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setPayments(allPayments)
    } catch (err) {
      console.error("[v0] Error fetching payments:", err)
      toast.error("Failed to load payments")
    }
  }

  const handleUpdatePaymentStatus = async (paymentId: string, status: "verified" | "rejected", reason?: string) => {
    setIsProcessing(true)

    try {
      console.log('[v0] handleUpdatePaymentStatus called with:', { paymentId, status, reason, selectedPayment })

      const paymentToProcess = selectedPayment || payments.find(p => p.id === paymentId)
      
      if (!paymentToProcess) {
        console.error('[v0] Payment not found for ID:', paymentId)
        toast.error('Payment not found')
        return
      }

      console.log('[v0] Processing payment:', paymentToProcess)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const updateData: any = {
        payment_status: status,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      }

      if (status === "rejected" && reason) {
        updateData.rejection_reason = reason
      }

      const { error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", paymentId)

      if (error) throw error

      if (status === "verified") {
        await supabase
          .from("registrations")
          .update({ status: "confirmed" })
          .eq("id", paymentToProcess.registration_id)
      }

      try {
        console.log('[v0] Preparing to send payment verification email');
        console.log('[v0] Payment data:', paymentToProcess);
        console.log('[v0] Email recipient:', paymentToProcess.registrations.email);
        console.log('[v0] Status:', status);
        console.log('[v0] Rejection reason:', reason);
        
        const emailPayload = {
          email: paymentToProcess.registrations.email,
          firstName: paymentToProcess.registrations.first_name,
          lastName: paymentToProcess.registrations.last_name,
          status: status,
          rejectionReason: reason,
          registrationType: paymentToProcess.registrations.registration_type,
          amount: paymentToProcess.amount,
          currency: paymentToProcess.currency,
        };
        
        console.log('[v0] Email payload:', emailPayload);
        
        const emailResponse = await fetch('/api/send-payment-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload),
        });

        console.log('[v0] Email API response status:', emailResponse.status);
        
        const emailResponseText = await emailResponse.text();
        console.log('[v0] Email API response text:', emailResponseText);

        if (!emailResponse.ok) {
          console.error('[v0] Failed to send payment verification email. Status:', emailResponse.status);
        } else {
          console.log('[v0] Payment verification email sent successfully!');
        }
      } catch (emailError) {
        console.error('[v0] Error sending payment verification email:', emailError);
      }

      toast.success(`Payment ${status === "verified" ? "approved" : "rejected"} successfully`)
      setSelectedPayment(null)
      setShowRejectDialog(false)
      setRejectionReason("")
      await fetchPayments()
    } catch (err) {
      console.error("[v0] Error updating payment:", err)
      toast.error("Failed to update payment status")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectClick = (payment: PaymentWithRegistration) => {
    setSelectedPayment(payment)
    setShowRejectDialog(true)
    setRejectionReason("")
  }

  const handleConfirmReject = () => {
    if (!selectedPayment) return
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }
    handleUpdatePaymentStatus(selectedPayment.id, "rejected", rejectionReason)
  }

  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === "all") return true
    return payment.payment_status === filterStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_submitted":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
            <Clock className="w-3 h-3 mr-1" />
            Not Submitted
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "verified":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredPayments.map((payment) => ({
        'Order ID': payment.registration_id,
        'Name': `${payment.registrations.first_name} ${payment.registrations.last_name}`,
        'Email': payment.registrations.email,
        'Position': payment.profiles?.position || '-',
        'Registration Type': payment.registrations.registration_type,
        'Amount': `${payment.currency} ${payment.amount.toLocaleString()}`,
        'Payment Method': payment.payment_method,
        'Bank': payment.bank_name,
        'Account Name': payment.account_name,
        'Transaction Reference': payment.transaction_reference || '-',
        'Status': payment.payment_status,
        'Has Payment Proof': payment.has_payment ? 'Yes' : 'No',
        'Notes': payment.notes || '',
        'Rejection Reason': payment.rejection_reason || '',
        'Submission Date': new Date(payment.created_at).toLocaleString()
      }))

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Payments')

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Order ID
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 20 }, // Position
        { wch: 20 }, // Registration Type
        { wch: 15 }, // Amount
        { wch: 15 }, // Payment Method
        { wch: 20 }, // Bank
        { wch: 25 }, // Account Name
        { wch: 20 }, // Transaction Reference
        { wch: 15 }, // Status
        { wch: 15 }, // Has Payment Proof
        { wch: 30 }, // Notes
        { wch: 30 }, // Rejection Reason
        { wch: 20 }, // Submission Date
      ]
      ws['!cols'] = colWidths

      // Generate filename with current date
      const filename = `ISAPM2026-Payments-${new Date().toISOString().split('T')[0]}.xlsx`
      
      // Write file
      XLSX.writeFile(wb, filename)
      
      toast.success(`Exported ${filteredPayments.length} payments to Excel`)
    } catch (error) {
      console.error('[v0] Error exporting to Excel:', error)
      toast.error('Failed to export to Excel')
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">Payment Validation</h1>
            <p className="text-lg text-muted-foreground">Review and approve conference registrations</p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <Button onClick={exportToExcel} variant="outline" className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                All ({payments.length})
              </Button>
              <Button
                variant={filterStatus === "not_submitted" ? "default" : "outline"}
                onClick={() => setFilterStatus("not_submitted")}
              >
                Not Submitted ({payments.filter((p) => p.payment_status === "not_submitted").length})
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("pending")}
              >
                Pending ({payments.filter((p) => p.payment_status === "pending").length})
              </Button>
              <Button
                variant={filterStatus === "verified" ? "default" : "outline"}
                onClick={() => setFilterStatus("verified")}
              >
                Verified ({payments.filter((p) => p.payment_status === "verified").length})
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                onClick={() => setFilterStatus("rejected")}
              >
                Rejected ({payments.filter((p) => p.payment_status === "rejected").length})
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredPayments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No payments found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPayments.map((payment) => (
                  <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="break-words">
                            {payment.registrations.first_name} {payment.registrations.last_name}
                          </CardTitle>
                          <CardDescription className="break-words">{payment.registrations.email}</CardDescription>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(payment.payment_status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Order ID</p>
                          <p className="font-semibold font-mono text-xs break-all">{payment.registration_id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Registration Type</p>
                          <p className="font-semibold">{payment.registrations.registration_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Position</p>
                          <p className="font-semibold">{payment.profiles?.position || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-semibold break-words">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </p>
                        </div>
                        {payment.has_payment && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Payment Method</p>
                              <p className="font-semibold break-words">{payment.payment_method}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Bank</p>
                              <p className="font-semibold break-words">{payment.bank_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Account Name</p>
                              <p className="font-semibold break-words">{payment.account_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Transaction Reference</p>
                              <p className="font-semibold break-words">{payment.transaction_reference || "-"}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {payment.has_payment && payment.payment_proof_url && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">Payment Proof:</p>
                          <button
                            onClick={() => {
                              setSelectedImageUrl(payment.payment_proof_url!)
                              setShowImageDialog(true)
                            }}
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <ImageIcon className="w-4 h-4" />
                            View Uploaded Proof
                          </button>
                        </div>
                      )}

                      {!payment.has_payment && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800">
                            ⏳ Waiting for payment proof submission from participant
                          </p>
                        </div>
                      )}

                      {payment.notes && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                          <p className="text-sm">{payment.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {payment.payment_status === "pending" && payment.has_payment && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePaymentStatus(payment.id, "verified")}
                              disabled={isProcessing}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectClick(payment)}
                              disabled={isProcessing}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={!!selectedPayment && !showRejectDialog} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Review payment information and take action</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Participant Information</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Order ID:</span>{" "}
                    <span className="font-mono text-xs">{selectedPayment.registration_id}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {selectedPayment.registrations.first_name} {selectedPayment.registrations.last_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span> {selectedPayment.registrations.email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Position:</span>{" "}
                    {selectedPayment.profiles?.position || "-"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Registration Type:</span>{" "}
                    {selectedPayment.registrations.registration_type}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Amount:</span> {selectedPayment.currency}{" "}
                    {selectedPayment.amount.toLocaleString()}
                  </p>
                  {selectedPayment.has_payment && (
                    <>
                      <p>
                        <span className="text-muted-foreground">Payment Method:</span>{" "}
                        {selectedPayment.payment_method}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Bank:</span> {selectedPayment.bank_name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Account Name:</span>{" "}
                        {selectedPayment.account_name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Transaction Reference:</span>{" "}
                        {selectedPayment.transaction_reference || "-"}
                      </p>
                    </>
                  )}
                  <p>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {getStatusBadge(selectedPayment.payment_status)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Submitted:</span>{" "}
                    {new Date(selectedPayment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedPayment.has_payment && selectedPayment.payment_proof_url && (
                <div>
                  <h3 className="font-semibold mb-2">Payment Proof</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedPayment.payment_proof_url || "/placeholder.svg"}
                      alt="Payment Proof"
                      className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setSelectedImageUrl(selectedPayment.payment_proof_url!)
                        setShowImageDialog(true)
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Click image to view full size</p>
                </div>
              )}

              {selectedPayment.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Notes</h3>
                  <p className="text-sm p-3 bg-muted/50 rounded-lg">{selectedPayment.notes}</p>
                </div>
              )}

              {selectedPayment.payment_status === "pending" && selectedPayment.has_payment && (
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => handleUpdatePaymentStatus(selectedPayment.id, "verified")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    )}
                    Approve Payment
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleConfirmReject}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Confirm Rejection
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={(open) => {
        setShowRejectDialog(open)
        if (!open) {
          setRejectionReason("")
          setSelectedPayment(null)
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The user will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="rejection-reason" className="text-sm font-medium block mb-2">
                Rejection Reason
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Transaction reference not found, incorrect amount, unclear payment proof..."
                className="w-full min-h-[120px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectionReason("")
                  setSelectedPayment(null)
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmReject}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black/90 p-4">
            {selectedImageUrl && (
              <img
                src={selectedImageUrl || "/placeholder.svg"}
                alt="Payment Proof Full Size"
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
