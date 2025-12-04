"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, X, AlertCircle, CreditCard, Gift } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getBadgeColors, getCategoryLabel } from "@/lib/badge-colors"
import { DownloadInvoiceButton } from "@/components/download-invoice-button"

interface PaymentOrderClientProps {
  initialOrder: any
  initialPayment: any
}

export default function PaymentOrderClient({ initialOrder, initialPayment }: PaymentOrderClientProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showResubmitForm, setShowResubmitForm] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [transactionRef, setTransactionRef] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [sponsorName, setSponsorName] = useState("")

  const calculateTotal = () => {
    if (!initialOrder?.order_items) return 0
    return initialOrder.order_items.reduce((sum: number, item: any) => {
      const nights = item.item_type === "hotel" && item.nights ? item.nights : 1
      return sum + (item.unit_price || 0) * nights
    }, 0)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (.jpg or .png)")
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const copyToClipboard = (text: string, field: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedField(field)
          toast.success("Copied to clipboard!")
          setTimeout(() => setCopiedField(null), 2000)
        })
        .catch(() => {
          toast.error("Failed to copy")
        })
    }
  }

  const handleSubmit = async () => {
    if (paymentMethod === "Sponsored") {
      // For sponsored payments, only sponsor name is required
      if (!sponsorName.trim()) {
        toast.error("Please enter the sponsor/benefactor name")
        return
      }
    } else {
      // For bank transfer and other methods, require bank details
      if (!paymentMethod || !bankName || !accountName || !transactionRef) {
        toast.error("Please fill in all required fields")
        return
      }
    }

    if (paymentMethod !== "Sponsored" && !selectedFile) {
      toast.error("Please upload a payment proof file")
      return
    }

    if (!initialOrder?.id || !initialOrder?.user_id) {
      toast.error("Order information is missing")
      console.error("[v0] Missing order data:", { orderId: initialOrder?.id, userId: initialOrder?.user_id })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      if (selectedFile) {
        formData.append("file", selectedFile)
      }
      formData.append("orderId", initialOrder.id)
      formData.append("paymentMethod", paymentMethod)
      formData.append("bankName", bankName)
      formData.append("accountName", accountName)
      formData.append("transactionRef", transactionRef)
      formData.append("additionalNotes", additionalNotes)
      formData.append("userId", initialOrder.user_id)
      formData.append("sponsorName", sponsorName)

      console.log("[v0] Submitting payment proof:", {
        orderId: initialOrder.id,
        userId: initialOrder.user_id,
        fileSize: selectedFile ? selectedFile.size : "N/A",
        fileType: selectedFile ? selectedFile.type : "N/A",
        paymentMethod,
        sponsorName,
      })

      const response = await fetch("/api/upload-payment-proof", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const result = await response.json()
        console.error("[v0] Payment upload failed:", result)
        throw new Error(result.error || "Failed to upload payment proof")
      }

      const result = await response.json()
      console.log("[v0] Payment proof uploaded successfully:", result)

      toast.success("Payment proof submitted successfully! Awaiting verification.")

      router.refresh()

      await new Promise((resolve) => setTimeout(resolve, 300))

      router.push("/my-purchases")
    } catch (error: any) {
      console.error("[v0] Payment submission error:", error)

      if (error.message === "Failed to fetch") {
        toast.error("Network error. Please check your connection and try again.")
      } else {
        toast.error(error.message || "Failed to submit payment proof")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const hasSubmittedPayment = initialPayment && !showResubmitForm
  const isResubmitting = showResubmitForm && initialPayment
  const canDownloadInvoice = initialPayment?.payment_status === "verified"

  if (hasSubmittedPayment) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20 min-h-screen bg-gray-50">
          <section className="py-8 px-4">
            <div className="max-w-2xl mx-auto">
              <Link
                href="/my-purchases"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <Upload className="w-4 h-4" />
                Back to My Purchases
              </Link>

              <div
                className={`mb-6 p-4 rounded-lg ${
                  initialPayment.payment_status === "verified"
                    ? "bg-green-50 border border-green-200"
                    : initialPayment.payment_status === "rejected"
                      ? "bg-red-50 border border-red-200"
                      : "bg-amber-50 border border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      initialPayment.payment_status === "verified"
                        ? "bg-green-500"
                        : initialPayment.payment_status === "rejected"
                          ? "bg-red-500"
                          : "bg-amber-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {initialPayment.payment_status === "verified"
                        ? "Payment Approved"
                        : initialPayment.payment_status === "rejected"
                          ? "Payment Rejected"
                          : "Waiting Verification Payment"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {initialPayment.payment_status === "verified"
                        ? "Your payment has been verified and approved."
                        : initialPayment.payment_status === "rejected"
                          ? `Your payment was rejected. Reason: ${initialPayment.rejection_reason || "No reason provided"}`
                          : "Your payment proof has been submitted and is awaiting admin verification."}
                    </p>
                  </div>
                  {canDownloadInvoice && (
                    <DownloadInvoiceButton orderId={initialOrder.id} variant="default" size="sm" />
                  )}
                </div>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>Order #{initialOrder.id.slice(0, 8)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {initialOrder.order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded ${getBadgeColors(item.item_type, item.event_label || "", item.event_id || "").bg} ${getBadgeColors(item.item_type, item.event_label || "", item.event_id || "").text}`}
                            >
                              {getCategoryLabel(item.item_type, item.event_label || "", item.event_id || "")}
                            </span>
                          </div>
                          <p className="font-medium text-sm">{item.event_label || item.hotel_room_type || "Unknown"}</p>
                          {item.item_type === "event" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.participant_type_label || "General"}
                            </p>
                          )}
                          {item.item_type === "hotel" && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <p>{item.hotel_room_type} Room</p>
                              <p>
                                {item.check_in_date} to {item.check_out_date} ({item.nights} nights)
                              </p>
                              {item.number_of_guests && <p>{item.number_of_guests} guest(s)</p>}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {item.item_type === "hotel" && item.nights > 1 ? (
                            <>
                              <p className="font-semibold text-cyan-700">
                                IDR {((item.unit_price || 0) * item.nights).toLocaleString("id-ID")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                IDR {(item.unit_price || 0).toLocaleString("id-ID")} × {item.nights} nights
                              </p>
                            </>
                          ) : (
                            <p className="font-semibold text-cyan-700">
                              IDR {(item.unit_price || 0).toLocaleString("id-ID")}
                            </p>
                          )}
                          {item.quantity > 1 && <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <p className="font-semibold text-lg">Total Amount</p>
                    <p className="font-bold text-xl text-cyan-700">IDR {calculateTotal().toLocaleString("id-ID")}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>Details of your submitted payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {initialPayment.payment_method && (
                      <div>
                        <Label className="text-muted-foreground">Payment Method</Label>
                        <p className="font-medium">{initialPayment.payment_method}</p>
                      </div>
                    )}
                    {initialPayment.bank_name && (
                      <div>
                        <Label className="text-muted-foreground">Bank Name</Label>
                        <p className="font-medium">{initialPayment.bank_name}</p>
                      </div>
                    )}
                    {initialPayment.account_name && (
                      <div>
                        <Label className="text-muted-foreground">Account Name</Label>
                        <p className="font-medium">{initialPayment.account_name}</p>
                      </div>
                    )}
                    {initialPayment.transaction_reference && (
                      <div>
                        <Label className="text-muted-foreground">Transaction Reference</Label>
                        <p className="font-medium">{initialPayment.transaction_reference}</p>
                      </div>
                    )}
                  </div>

                  {initialPayment.notes && (
                    <div>
                      <Label className="text-muted-foreground">Additional Notes</Label>
                      <p className="font-medium">{initialPayment.notes}</p>
                    </div>
                  )}

                  {/* Payment Proof */}
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Payment Proof</Label>
                    <div className="border rounded-lg p-4">
                      <img
                        src={initialPayment.payment_proof_url || "/placeholder.svg"}
                        alt="Payment proof"
                        className="w-full h-auto max-h-96 object-contain rounded"
                      />
                    </div>
                  </div>

                  {/* Submission Date */}
                  <div>
                    <Label className="text-muted-foreground">Submitted On</Label>
                    <p className="font-medium">{new Date(initialPayment.created_at).toLocaleString("id-ID")}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {initialPayment.payment_status === "rejected" && (
                      <Button
                        onClick={() => setShowResubmitForm(true)}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Resubmit Payment Proof
                      </Button>
                    )}
                    {(initialPayment.payment_status === "pending" || initialPayment.payment_status === "verified") && (
                      <Button
                        onClick={() => setShowResubmitForm(true)}
                        variant="outline"
                        className="flex-1 border-cyan-600 text-cyan-600 hover:bg-cyan-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Re-upload Payment Proof
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gray-50">
        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/my-purchases"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <Upload className="w-4 h-4" />
              Back to My Purchases
            </Link>

            {isResubmitting && (
              <div className="mb-6 p-4 rounded-lg bg-cyan-50 border border-cyan-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-cyan-900">Re-uploading Payment Proof</p>
                    <p className="text-sm text-cyan-700 mt-1">
                      {initialPayment.payment_status === "rejected"
                        ? `Your previous payment was rejected. Reason: ${initialPayment.rejection_reason || "No reason provided"}. Please upload a new payment proof.`
                        : "You are about to replace your current payment proof. The new submission will be reviewed by our team."}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowResubmitForm(false)}
                      className="mt-2 text-cyan-600 hover:text-cyan-700 p-0 h-auto"
                    >
                      Cancel and go back
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Order #{initialOrder.id.slice(0, 8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {initialOrder.order_items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${getBadgeColors(item.item_type, item.event_label || "", item.event_id || "").bg} ${getBadgeColors(item.item_type, item.event_label || "", item.event_id || "").text}`}
                          >
                            {getCategoryLabel(item.item_type, item.event_label || "", item.event_id || "")}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{item.event_label || item.hotel_room_type || "Unknown"}</p>
                        {item.item_type === "event" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.participant_type_label || "General"}
                          </p>
                        )}
                        {item.item_type === "hotel" && (
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            <p>{item.hotel_room_type} Room</p>
                            <p>
                              {item.check_in_date} to {item.check_out_date} ({item.nights} nights)
                            </p>
                            {item.number_of_guests && <p>{item.number_of_guests} guest(s)</p>}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {item.item_type === "hotel" && item.nights > 1 ? (
                          <>
                            <p className="font-semibold text-cyan-700">
                              IDR {((item.unit_price || 0) * item.nights).toLocaleString("id-ID")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              IDR {(item.unit_price || 0).toLocaleString("id-ID")} × {item.nights} nights
                            </p>
                          </>
                        ) : (
                          <p className="font-semibold text-cyan-700">
                            IDR {(item.unit_price || 0).toLocaleString("id-ID")}
                          </p>
                        )}
                        {item.quantity > 1 && <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <p className="font-semibold text-lg">Total Amount</p>
                  <p className="font-bold text-xl text-cyan-700">IDR {calculateTotal().toLocaleString("id-ID")}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
                <CardDescription>Choose how you want to pay for your order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Payment Method</Label>
                  <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50">
                      <TabsTrigger
                        value="Bank Transfer"
                        className="flex items-center gap-2 h-12 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                        Bank Transfer
                      </TabsTrigger>
                      <TabsTrigger
                        value="Sponsored"
                        className="flex items-center gap-2 h-12 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                      >
                        <Gift className="w-4 h-4" />
                        Sponsored
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">
                    {paymentMethod === "Bank Transfer"
                      ? "Pay via bank transfer to our official account"
                      : "Registration sponsored by a company or individual"}
                  </p>
                </div>

                {paymentMethod === "Sponsored" && (
                  <div className="space-y-2">
                    <Label htmlFor="sponsor-name">Sponsor / Benefactor Name *</Label>
                    <Input
                      id="sponsor-name"
                      placeholder="e.g., PT ABC Company, Dr. John Doe, Hospital Name"
                      value={sponsorName}
                      onChange={(e) => setSponsorName(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the name of the company, organization, or individual sponsoring your registration
                    </p>
                  </div>
                )}

                {paymentMethod !== "Sponsored" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Bank Name *</Label>
                      <Input
                        id="bank-name"
                        placeholder="e.g., Bank Syariah Indonesia"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-name">Account Name *</Label>
                      <Input
                        id="account-name"
                        placeholder="Name on the account"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transaction-ref">Transaction Reference / ID *</Label>
                      <Input
                        id="transaction-ref"
                        placeholder="e.g., TRX123456789"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="additional-notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additional-notes"
                    placeholder={
                      paymentMethod === "Sponsored"
                        ? "Any additional information about the sponsorship"
                        : "Any additional information about your payment"
                    }
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {paymentMethod !== "Sponsored" && (
                  <div className="space-y-2">
                    <Label htmlFor="payment-proof">Payment Proof File *</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                      {!selectedFile ? (
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Upload payment receipt or transfer confirmation
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            Supported formats: JPG, PNG only (Max 5MB)
                          </p>
                          <Input
                            id="payment-proof"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Label
                            htmlFor="payment-proof"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
                          >
                            Choose File
                          </Label>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveFile}
                              className="flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          {previewUrl && (
                            <div className="border rounded-lg p-4">
                              <img
                                src={previewUrl || "/placeholder.svg"}
                                alt="Payment proof preview"
                                className="w-full h-auto max-h-64 object-contain rounded"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={handleSubmit} disabled={isUploading} className="w-full" size="lg">
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-pulse" />
                      {paymentMethod === "Sponsored"
                        ? "Submitting..."
                        : isResubmitting
                          ? "Re-uploading..."
                          : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {paymentMethod === "Sponsored"
                        ? "Submit Sponsored Registration"
                        : isResubmitting
                          ? "Submit New Payment Proof"
                          : "Submit Payment Proof"}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {paymentMethod === "Sponsored"
                    ? "Your sponsored registration will be verified within 1-2 business days"
                    : "Your payment will be verified within 1-2 business days"}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
