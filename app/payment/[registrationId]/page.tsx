"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, CheckCircle2, Copy, Check, X, Eye } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { uploadPaymentProof } from "@/app/actions/upload-payment-proof"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Registration {
  id: string
  first_name: string
  last_name: string
  registration_type: string
  amount: number
  currency: string
  status: string
}

interface Payment {
  id: string
  payment_proof_url: string | null
  payment_method: string | null
  bank_name: string | null
  account_name: string | null
  transaction_reference: string | null
  payment_status: string
  rejection_reason: string | null
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const registrationId = params.registrationId as string

  const [registration, setRegistration] = useState<Registration | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
  const [isUploadingProof, setIsUploadingProof] = useState(false)
  const [showProofLightbox, setShowProofLightbox] = useState(false)

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "bank_transfer",
    bankName: "",
    accountName: "",
    transactionReference: "",
    notes: "",
  })

  // Updated bank account details to match the provided image
  const bankAccounts = [
    {
      bank: "Bank Syariah Indonesia (BSI)",
      accountNumber: "7207681363",
      accountName: "PT.Tombo Farma Indonesia",
      branch: "KCP MALANG SAWOJAJAR",
    },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        // Fetch registration
        const { data: regData, error: regError } = await supabase
          .from("registrations")
          .select("*")
          .eq("id", registrationId)
          .eq("user_id", user.id)
          .single()

        if (regError || !regData) {
          toast.error("Registration not found")
          router.push("/my-registrations")
          return
        }

        setRegistration(regData)

        // Check if payment already exists
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("*")
          .eq("registration_id", registrationId)
          .maybeSingle()

        if (paymentData) {
          setPayment(paymentData)
          if (paymentData.payment_status === "rejected") {
            setPaymentData({
              paymentMethod: paymentData.payment_method || "bank_transfer",
              bankName: paymentData.bank_name || "",
              accountName: paymentData.account_name || "",
              transactionReference: paymentData.transaction_reference || "",
              notes: paymentData.notes || "",
            })
            if (paymentData.payment_proof_url) {
              setPaymentProofPreview(paymentData.payment_proof_url)
            }
          }
        }
      } catch (err) {
        console.error("[v0] Error fetching data:", err)
        toast.error("Failed to load payment information")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [registrationId, router, supabase])

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== "image/jpeg" && file.type !== "image/jpg") {
      toast.error("Only .jpg files are allowed")
      return
    }

    // Validate file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      toast.error("File size must not exceed 1MB")
      return
    }

    setPaymentProofFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPaymentProofPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = () => {
    setPaymentProofFile(null)
    setPaymentProofPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentProofFile && !paymentProofPreview) {
      toast.error("Please upload payment proof (.jpg, max 1MB)")
      return
    }

    setIsSubmitting(true)

    try {
      if (!registration || !user) return

      let paymentProofUrl = paymentProofPreview // Use existing URL for resubmissions

      if (paymentProofFile) {
        setIsUploadingProof(true)
        try {
          const formData = new FormData()
          formData.append("file", paymentProofFile)
          formData.append("registrationId", registrationId)

          const result = await uploadPaymentProof(formData)

          if (result.error) {
            toast.error(result.error)
            return
          }

          paymentProofUrl = result.url
        } catch (uploadError) {
          console.error("[v0] Error uploading payment proof:", uploadError)
          toast.error("Failed to upload payment proof")
          return
        } finally {
          setIsUploadingProof(false)
        }
      }

      if (payment && payment.payment_status === "rejected") {
        // Update existing payment record
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            payment_method: paymentData.paymentMethod,
            bank_name: paymentData.bankName,
            account_name: paymentData.accountName,
            transaction_reference: paymentData.transactionReference,
            notes: paymentData.notes,
            payment_proof_url: paymentProofUrl,
            payment_status: "pending",
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id)

        if (updateError) {
          console.error("[v0] Error updating payment:", updateError)
          toast.error("Failed to resubmit payment information")
          return
        }

        toast.success("Payment resubmitted successfully!")
      } else {
        // Create new payment record
        const { error: insertError } = await supabase.from("payments").insert([
          {
            registration_id: registrationId,
            user_id: user.id,
            amount: registration.amount,
            currency: registration.currency,
            payment_method: paymentData.paymentMethod,
            bank_name: paymentData.bankName,
            account_name: paymentData.accountName,
            transaction_reference: paymentData.transactionReference,
            notes: paymentData.notes,
            payment_proof_url: paymentProofUrl,
            payment_status: "pending",
          },
        ])

        if (insertError) {
          console.error("[v0] Error creating payment:", insertError)
          toast.error("Failed to submit payment information")
          return
        }

        toast.success("Payment information submitted successfully!")
      }

      // Update registration status
      await supabase.from("registrations").update({ status: "pending" }).eq("id", registrationId)

      router.push(`/payment/${registrationId}/details`)
    } catch (err) {
      console.error("[v0] Error submitting payment:", err)
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading payment information...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!registration) {
    return null
  }

  if (payment && payment.payment_status === "verified") {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20">
          <section className="py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    Payment Verified
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Your payment has been verified. You will receive a confirmation email shortly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/my-registrations">
                    <Button>Back to My Registrations</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  if (payment && payment.payment_status === "pending") {
    router.push(`/payment/${registrationId}/details`)
    return null
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">
              {payment?.payment_status === "rejected" ? "Resubmit Payment" : "Payment Instructions"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {payment?.payment_status === "rejected"
                ? "Please provide correct payment information"
                : "Complete your registration payment"}
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {payment?.payment_status === "rejected" && payment.rejection_reason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800">Previous Submission Rejected</CardTitle>
                  <CardDescription className="text-red-700">{payment.rejection_reason}</CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Registration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-semibold">
                    {registration.first_name} {registration.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration Type:</span>
                  <span className="font-semibold">{registration.registration_type}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-primary">
                    {registration.currency} {registration.amount.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Bank Transfer Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Bank Transfer Details</CardTitle>
                <CardDescription>Please transfer the total amount to the following bank account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bankAccounts.map((account, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{account.bank}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-muted-foreground hover:text-primary"
                        onClick={() => handleCopy(account.accountNumber)}
                      >
                        {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Account Number:</span>{" "}
                        <span className="font-mono font-semibold text-primary text-lg">{account.accountNumber}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Account Name:</span>{" "}
                        <span className="font-semibold">{account.accountName}</span>
                      </p>
                      {account.branch && (
                        <p>
                          <span className="text-muted-foreground">Branch:</span> <span>{account.branch}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Confirmation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Payment</CardTitle>
                <CardDescription>
                  After making the transfer, please fill in the details below to help us verify your payment faster.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Payment Method *</label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="e-wallet">E-Wallet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Bank Name *</label>
                    <input
                      type="text"
                      value={paymentData.bankName}
                      onChange={(e) => setPaymentData({ ...paymentData, bankName: e.target.value })}
                      required
                      placeholder="e.g., Bank Mandiri"
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Account Name *</label>
                    <input
                      type="text"
                      value={paymentData.accountName}
                      onChange={(e) => setPaymentData({ ...paymentData, accountName: e.target.value })}
                      required
                      placeholder="Name on the bank account"
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Transaction Reference / Receipt Number</label>
                    <input
                      type="text"
                      value={paymentData.transactionReference}
                      onChange={(e) => setPaymentData({ ...paymentData, transactionReference: e.target.value })}
                      placeholder="Transaction ID or receipt number"
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Additional Notes (Optional)</label>
                    <textarea
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      placeholder="Any additional information..."
                      rows={3}
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Payment Proof (.jpg only, max 1MB) *</label>
                    <div className="space-y-3">
                      {paymentProofPreview ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <img
                              src={paymentProofPreview || "/placeholder.svg"}
                              alt="Payment proof preview"
                              className="w-full h-64 object-contain border border-input rounded-lg bg-muted"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowProofLightbox(true)}
                            className="w-full"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Size
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30">
                          <div className="flex flex-col items-center justify-center py-6">
                            <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                            <p className="text-sm font-semibold text-muted-foreground mb-1">
                              Click to upload payment proof
                            </p>
                            <p className="text-xs text-muted-foreground">.jpg only, maximum 1MB</p>
                          </div>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,image/jpeg"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={isSubmitting || isUploadingProof} className="w-full">
                    {isSubmitting || isUploadingProof ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isUploadingProof ? "Uploading..." : "Submitting..."}
                      </>
                    ) : (
                      "Submit Payment Information"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />

      {/* Payment proof lightbox dialog */}
      <Dialog open={showProofLightbox} onOpenChange={setShowProofLightbox}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {paymentProofPreview && (
            <div className="relative w-full">
              <img
                src={paymentProofPreview || "/placeholder.svg"}
                alt="Payment proof full size"
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
