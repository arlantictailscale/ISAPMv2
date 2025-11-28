"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Loader2, CheckCircle2, Clock, AlertCircle, ImageIcon, Upload, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { reuploadPaymentProof } from "@/app/actions/reupload-payment-proof"
import { useToast } from "@/hooks/use-toast"

interface Registration {
  id: string
  first_name: string
  last_name: string
  registration_type: string
  amount: number
  currency: string
}

interface Payment {
  id: string
  payment_method: string
  bank_name: string
  account_name: string
  transaction_reference: string | null
  notes: string | null
  payment_status: string
  created_at: string
  payment_proof_url: string | null
}

export default function PaymentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const registrationId = params.registrationId as string

  const [registration, setRegistration] = useState<Registration | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentProof, setShowPaymentProof] = useState(false)
  const [showReuploadDialog, setShowReuploadDialog] = useState(false)
  const [reuploadFile, setReuploadFile] = useState<File | null>(null)
  const [reuploadPreview, setReuploadPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

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

        // Fetch registration
        const { data: regData, error: regError } = await supabase
          .from("registrations")
          .select("*")
          .eq("id", registrationId)
          .eq("user_id", user.id)
          .single()

        if (regError || !regData) {
          router.push("/my-purchases")
          return
        }

        setRegistration(regData)

        // Fetch payment
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("*")
          .eq("registration_id", registrationId)
          .single()

        if (paymentError || !paymentData) {
          router.push(`/payment/${registrationId}`)
          return
        }

        setPayment(paymentData)
      } catch (err) {
        console.error("Error fetching data:", err)
        router.push("/my-purchases")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [registrationId, router, supabase])

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading payment details...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!registration || !payment) {
    return null
  }

  const getStatusConfig = () => {
    switch (payment.payment_status) {
      case "pending":
        return {
          icon: <Clock className="w-12 h-12 text-orange-600" />,
          title: "Payment Pending Verification",
          description:
            "Your payment information has been submitted successfully. Our team will verify your payment shortly.",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-900",
        }
      case "verified":
        return {
          icon: <CheckCircle2 className="w-12 h-12 text-green-600" />,
          title: "Payment Verified",
          description: "Your payment has been verified successfully. You will receive a confirmation email shortly.",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-900",
        }
      case "rejected":
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-600" />,
          title: "Payment Rejected",
          description: "Your payment information was rejected. Please check the details below and resubmit.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-900",
        }
      default:
        return {
          icon: <Clock className="w-12 h-12" />,
          title: "Payment Status",
          description: "Payment information",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-900",
        }
    }
  }

  const statusConfig = getStatusConfig()

  const handleReuploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only .jpg, .png, and .pdf files are allowed",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "File size must not exceed 5MB",
        variant: "destructive",
      })
      return
    }

    setReuploadFile(file)

    // Create preview for images only
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReuploadPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setReuploadPreview(null)
    }
  }

  const handleRemoveReuploadFile = () => {
    setReuploadFile(null)
    setReuploadPreview(null)
  }

  const handleReuploadSubmit = async () => {
    if (!reuploadFile || !registrationId) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", reuploadFile)
      formData.append("registrationId", registrationId)

      const result = await reuploadPaymentProof(formData)

      if (result.error) {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Payment proof uploaded successfully",
        description: "Your payment is now pending verification",
      })

      // Refresh the page data
      setShowReuploadDialog(false)
      setReuploadFile(null)
      setReuploadPreview(null)

      // Reload payment data
      const { data: paymentData } = await supabase
        .from("payments")
        .select("*")
        .eq("registration_id", registrationId)
        .single()

      if (paymentData) {
        setPayment(paymentData)
      }
    } catch (error) {
      console.error("Error reuploading payment proof:", error)
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Status Card */}
            <Card className={`${statusConfig.borderColor} ${statusConfig.bgColor}`}>
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  {statusConfig.icon}
                  <div>
                    <h2 className={`text-2xl font-bold ${statusConfig.textColor} mb-2`}>{statusConfig.title}</h2>
                    <p className={statusConfig.textColor}>{statusConfig.description}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      payment.payment_status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : payment.payment_status === "verified"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    Status: {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

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

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Information submitted on{" "}
                  {new Date(payment.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-semibold">
                    {payment.payment_method === "bank_transfer" ? "Bank Transfer" : payment.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="font-semibold">{payment.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="font-semibold">{payment.account_name}</span>
                </div>
                {payment.transaction_reference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction Reference:</span>
                    <span className="font-semibold font-mono">{payment.transaction_reference}</span>
                  </div>
                )}
                {payment.payment_proof_url && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block mb-2">Payment Proof:</span>
                    <div className="space-y-2">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <Image
                          src={payment.payment_proof_url || "/placeholder.svg"}
                          alt="Payment Proof"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPaymentProof(true)}
                          className="flex-1"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          View Full Size
                        </Button>
                        {(payment.payment_status === "pending" || payment.payment_status === "rejected") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowReuploadDialog(true)}
                            className="flex-1"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Re-upload Proof
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {payment.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block mb-2">Notes:</span>
                    <p className="text-sm">{payment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 flex-col sm:flex-row">
              <Link href="/my-purchases" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  View All Purchases
                </Button>
              </Link>
              {payment.payment_status === "verified" && (
                <Link href={`/badge/${registrationId}`} className="flex-1">
                  <Button className="w-full bg-green-600 hover:bg-green-700">View & Print Participant Badge</Button>
                </Link>
              )}
              {payment.payment_status === "rejected" && (
                <Link href={`/payment/${registrationId}`} className="flex-1">
                  <Button className="w-full">Resubmit Payment</Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={showPaymentProof} onOpenChange={setShowPaymentProof}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogTitle className="sr-only">Payment Proof Image</DialogTitle>
          <div className="relative w-full h-[80vh]">
            {payment?.payment_proof_url && (
              <Image
                src={payment.payment_proof_url || "/placeholder.svg"}
                alt="Payment Proof Full Size"
                fill
                className="object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReuploadDialog} onOpenChange={setShowReuploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Re-upload Payment Proof</DialogTitle>
            <DialogDescription>
              Upload a new payment proof document. Accepted formats: JPG, PNG, PDF (max 5MB)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {reuploadPreview ? (
              <div className="space-y-3">
                <div className="relative">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border bg-muted">
                    {reuploadFile?.type === "application/pdf" ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">{reuploadFile.name}</p>
                          <p className="text-xs text-muted-foreground">PDF Document</p>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={reuploadPreview || "/placeholder.svg"}
                        alt="Payment proof preview"
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveReuploadFile}
                    disabled={isUploading}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {reuploadFile && (
                  <div className="text-sm text-muted-foreground">
                    <p>File: {reuploadFile.name}</p>
                    <p>Size: {(reuploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30">
                <div className="flex flex-col items-center justify-center py-6">
                  <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Click to upload payment proof</p>
                  <p className="text-xs text-muted-foreground">.jpg, .png, or .pdf (max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleReuploadFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowReuploadDialog(false)
                  handleRemoveReuploadFile()
                }}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleReuploadSubmit}
                disabled={!reuploadFile || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Payment Proof
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
