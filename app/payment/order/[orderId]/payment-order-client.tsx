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
}

export default function PaymentOrderClient({ order, userId }: PaymentOrderClientProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [transactionRef, setTransactionRef] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  const payment = order.order_payments?.[0]

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

      // Redirect to my purchases page
      router.push("/my-purchases")
    } catch (error: any) {
      console.error("[v0] Payment submission error:", error)
      toast.error(error.message || "Failed to submit payment proof")
    } finally {
      setIsUploading(false)
    }
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
