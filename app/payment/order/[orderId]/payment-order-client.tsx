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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, ArrowLeft, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface PaymentOrderClientProps {
  order: any
  userId: string // Changed from user object to userId string
  payment: any
}

export default function PaymentOrderClient({ order, userId, payment }: PaymentOrderClientProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showResubmitForm, setShowResubmitForm] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [transactionRef, setTransactionRef] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  const getEventType = (label: string, id: string) => {
    const labelLower = label.toLowerCase()
    const idLower = id.toLowerCase()

    if (labelLower.startsWith("ws") || labelLower.includes("workshop")) {
      return "WORKSHOP"
    }
    if (labelLower.includes("symposium")) {
      return "SYMPOSIUM"
    }
    return "CPD COURSE"
  }

  const calculateTotal = () => {
    if (!order.order_items) return 0
    return order.order_items.reduce((sum: number, item: any) => {
      const nights = item.item_type === "hotel" && item.nights ? item.nights : 1
      return sum + (item.unit_price || 0) * nights
    }, 0)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, JPEG)")
      return
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB")
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!paymentMethod || !bankName || !accountName || !transactionRef) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!selectedFile) {
      toast.error("Please upload a payment proof image")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("orderId", order.id)
      formData.append("paymentMethod", paymentMethod)
      formData.append("bankName", bankName)
      formData.append("accountName", accountName)
      formData.append("transactionRef", transactionRef)
      formData.append("additionalNotes", additionalNotes)
      formData.append("userId", userId) // Added userId to formData

      const response = await fetch("/api/upload-payment-proof", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload payment proof")
      }

      toast.success("Payment proof submitted successfully! Awaiting verification.")

      router.refresh()

      // Small delay to ensure revalidation completes
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Redirect to my purchases page
      router.push("/my-purchases")
    } catch (error: any) {
      console.error("[v0] Payment submission error:", error)
      toast.error(error.message || "Failed to submit payment proof")
    } finally {
      setIsUploading(false)
    }
  }

  const hasSubmittedPayment = payment && !showResubmitForm

  if (hasSubmittedPayment) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20 min-h-screen bg-gray-50">
          <section className="py-8 px-4">
            <div className="max-w-2xl mx-auto">
              {/* Back button */}
              <Link
                href="/my-purchases"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to My Purchases
              </Link>

              {/* Payment Status Banner */}
              <div
                className={`mb-6 p-4 rounded-lg ${
                  payment.payment_status === "verified"
                    ? "bg-green-50 border border-green-200"
                    : payment.payment_status === "rejected"
                      ? "bg-red-50 border border-red-200"
                      : "bg-amber-50 border border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      payment.payment_status === "verified"
                        ? "bg-green-500"
                        : payment.payment_status === "rejected"
                          ? "bg-red-500"
                          : "bg-amber-500"
                    }`}
                  />
                  <div>
                    <p className="font-semibold">
                      {payment.payment_status === "verified"
                        ? "Payment Approved"
                        : payment.payment_status === "rejected"
                          ? "Payment Rejected"
                          : "Waiting Verification Payment"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.payment_status === "verified"
                        ? "Your payment has been verified and approved."
                        : payment.payment_status === "rejected"
                          ? `Your payment was rejected. Reason: ${payment.rejection_reason || "No reason provided"}`
                          : "Your payment proof has been submitted and is awaiting admin verification."}
                    </p>
                  </div>
                </div>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                  <CardDescription>Order #{order.id.slice(0, 8)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items List */}
                  <div className="space-y-3">
                    {order.order_items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-100 text-cyan-700">
                              {item.item_type === "hotel"
                                ? "HOTEL"
                                : getEventType(item.event_label || "", item.event_id || "")}
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

                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <p className="font-semibold text-lg">Total Amount</p>
                    <p className="font-bold text-xl text-cyan-700">IDR {calculateTotal().toLocaleString("id-ID")}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>Details of your submitted payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payment.payment_method && (
                      <div>
                        <Label className="text-muted-foreground">Payment Method</Label>
                        <p className="font-medium">{payment.payment_method}</p>
                      </div>
                    )}
                    {payment.bank_name && (
                      <div>
                        <Label className="text-muted-foreground">Bank Name</Label>
                        <p className="font-medium">{payment.bank_name}</p>
                      </div>
                    )}
                    {payment.account_name && (
                      <div>
                        <Label className="text-muted-foreground">Account Name</Label>
                        <p className="font-medium">{payment.account_name}</p>
                      </div>
                    )}
                    {payment.transaction_reference && (
                      <div>
                        <Label className="text-muted-foreground">Transaction Reference</Label>
                        <p className="font-medium">{payment.transaction_reference}</p>
                      </div>
                    )}
                  </div>

                  {payment.notes && (
                    <div>
                      <Label className="text-muted-foreground">Additional Notes</Label>
                      <p className="font-medium">{payment.notes}</p>
                    </div>
                  )}

                  {/* Payment Proof */}
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Payment Proof</Label>
                    <div className="border rounded-lg p-4">
                      <img
                        src={payment.payment_proof_url || "/placeholder.svg"}
                        alt="Payment proof"
                        className="w-full h-auto max-h-96 object-contain rounded"
                      />
                    </div>
                  </div>

                  {/* Submission Date */}
                  <div>
                    <Label className="text-muted-foreground">Submitted On</Label>
                    <p className="font-medium">{new Date(payment.created_at).toLocaleString("id-ID")}</p>
                  </div>

                  {/* Action Buttons */}
                  {payment.payment_status === "rejected" && (
                    <Button
                      onClick={() => setShowResubmitForm(true)}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      Resubmit Payment Proof
                    </Button>
                  )}
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
            {/* Back button */}
            <Link
              href="/my-purchases"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Purchases
            </Link>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>Order #{order.id.slice(0, 8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items List */}
                <div className="space-y-3">
                  {order.order_items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-100 text-cyan-700">
                            {item.item_type === "hotel"
                              ? "HOTEL"
                              : getEventType(item.event_label || "", item.event_id || "")}
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

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t">
                  <p className="font-semibold text-lg">Total Amount</p>
                  <p className="font-bold text-xl text-cyan-700">IDR {calculateTotal().toLocaleString("id-ID")}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confirm Your Payment</CardTitle>
                <CardDescription>
                  After making the transfer, please fill in the details below to help us verify your payment faster.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment-method">
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bank Name */}
                <div className="space-y-2">
                  <Label htmlFor="bank-name">
                    Bank Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bank-name"
                    placeholder="e.g., Bank Mandiri"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                {/* Account Name */}
                <div className="space-y-2">
                  <Label htmlFor="account-name">
                    Account Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="account-name"
                    placeholder="Name on the bank account"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>

                {/* Transaction Reference */}
                <div className="space-y-2">
                  <Label htmlFor="transaction-ref">
                    Transaction Reference / Receipt Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="transaction-ref"
                    placeholder="Transaction ID or receipt number"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="additional-notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additional-notes"
                    placeholder="Any additional information..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Payment Proof Upload */}
                <div className="space-y-2">
                  <Label htmlFor="payment-proof">
                    Payment Proof (.jpg only, max 1MB) <span className="text-red-500">*</span>
                  </Label>

                  {!selectedFile ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="payment-proof"
                        accept="image/jpeg,image/jpg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="payment-proof" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium mb-1">Click to upload payment proof</p>
                        <p className="text-sm text-muted-foreground">.jpg only, maxes 1MB</p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border rounded-lg p-4">
                      <button
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {previewUrl && (
                        <img
                          src={previewUrl || "/placeholder.svg"}
                          alt="Payment proof preview"
                          className="w-full h-48 object-contain rounded"
                        />
                      )}
                      <p className="text-sm text-center mt-2 text-muted-foreground">{selectedFile.name}</p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  size="lg"
                >
                  {isUploading ? "Submitting..." : "Submit Payment Information"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
