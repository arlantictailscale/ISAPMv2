"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Loader2, CheckCircle2, Clock, AlertCircle, ImageIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPaymentProof(true)}
                        className="w-full"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        View Full Size
                      </Button>
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
    </>
  )
}
