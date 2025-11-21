"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, Clock, XCircle, Trash2, Download, ImageIcon } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface Registration {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  institution: string
  position: string
  registration_type: string
  status: string
  amount: number | null
  currency: string | null
  order_date: string
  payment_proof_url?: string
}

interface Payment {
  id: string
  payment_status: string
  payment_method: string | null
  bank_name: string | null
  transaction_reference: string | null
  created_at: string
  rejection_reason: string | null
  payment_proof_url?: string
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  completed: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-100",
}

const paymentStatusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  verified: "bg-green-100 text-green-800 hover:bg-green-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
}

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [payments, setPayments] = useState<Record<string, Payment>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(null)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserAndRegistrations = async () => {
      try {
        setIsLoading(true)

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        const { data, error: fetchError } = await supabase
          .from("registrations")
          .select("*")
          .eq("user_id", user.id)
          .order("order_date", { ascending: false })

        if (fetchError) {
          console.error("Error fetching registrations:", fetchError)
          setError("Failed to load registrations")
          return
        }

        setRegistrations(data || [])

        if (data && data.length > 0) {
          const registrationIds = data.map((r) => r.id)
          const { data: paymentsData, error: paymentsError } = await supabase
            .from("payments")
            .select("*")
            .in("registration_id", registrationIds)

          if (!paymentsError && paymentsData) {
            const paymentsMap: Record<string, Payment> = {}
            paymentsData.forEach((payment) => {
              paymentsMap[payment.registration_id] = payment
            })
            setPayments(paymentsMap)
          }
        }
      } catch (err) {
        console.error("Error in fetchUserAndRegistrations:", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndRegistrations()
  }, [router, supabase])

  const handleDeleteRegistration = async (registrationId: string) => {
    try {
      setDeletingId(registrationId)

      const { error: deleteError } = await supabase
        .from("registrations")
        .delete()
        .eq("id", registrationId)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Error deleting registration:", deleteError)
        setError("Failed to delete registration")
        return
      }

      setRegistrations((prev) => prev.filter((r) => r.id !== registrationId))
      setPayments((prev) => {
        const newPayments = { ...prev }
        delete newPayments[registrationId]
        return newPayments
      })
    } catch (err) {
      console.error("Error in handleDeleteRegistration:", err)
      setError("An unexpected error occurred")
    } finally {
      setDeletingId(null)
    }
  }

  const handleCancelPayment = async (registrationId: string, paymentId: string) => {
    try {
      setCancellingPaymentId(paymentId)

      const { error: deleteError } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId)
        .eq("user_id", user.id)
        .eq("payment_status", "pending")

      if (deleteError) {
        console.error("Error cancelling payment:", deleteError)
        setError("Failed to cancel payment submission")
        return
      }

      setPayments((prev) => {
        const newPayments = { ...prev }
        delete newPayments[registrationId]
        return newPayments
      })
    } catch (err) {
      console.error("Error in handleCancelPayment:", err)
      setError("An unexpected error occurred")
    } finally {
      setCancellingPaymentId(null)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your registrations...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 overflow-x-hidden">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2 break-words">Your Registrations</h1>
            <p className="text-lg text-muted-foreground">Track your conference registrations and purchases</p>
          </div>
        </section>

        <section className="py-12 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            {error && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-800 break-words">{error}</p>
                </CardContent>
              </Card>
            )}

            {registrations.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-muted-foreground mb-6">You don&apos;t have any registrations yet.</p>
                  <Link href="/pricing">
                    <Button>Register for ISAPM 2026</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="font-display text-2xl font-bold">
                    {registrations.length} Registration{registrations.length !== 1 ? "s" : ""}
                  </h2>
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                      Add New Registration
                    </Button>
                  </Link>
                </div>

                {registrations.map((registration) => {
                  const payment = payments[registration.id]

                  return (
                    <Card key={registration.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 max-w-full">
                          <div className="min-w-0 flex-1 max-w-full">
                            <CardTitle className="break-words text-lg sm:text-xl">
                              {registration.first_name} {registration.last_name}
                            </CardTitle>
                            <CardDescription className="break-all text-xs sm:text-sm">
                              Order ID: {registration.id}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
                            {!payment && (
                              <Badge variant="secondary" className={statusColors[registration.status] || ""}>
                                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                              </Badge>
                            )}
                            {payment && (
                              <Badge variant="secondary" className={paymentStatusColors[payment.payment_status] || ""}>
                                {payment.payment_status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                                {payment.payment_status === "verified" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {payment.payment_status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                                Payment{" "}
                                {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6 overflow-hidden max-w-full">
                          <div className="min-w-0 max-w-full">
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Registration Details</h3>
                            <div className="space-y-2 text-sm">
                              <p className="break-words">
                                <span className="font-medium">Type:</span> {registration.registration_type}
                              </p>
                              <p className="break-words">
                                <span className="font-medium">Institution:</span> {registration.institution}
                              </p>
                              <p className="break-words">
                                <span className="font-medium">Position:</span> {registration.position}
                              </p>
                              <p className="break-all">
                                <span className="font-medium">Contact:</span> {registration.email}
                              </p>
                            </div>
                          </div>

                          <div className="min-w-0 max-w-full">
                            <h3 className="font-semibold text-sm text-muted-foreground mb-3">Payment Information</h3>
                            <div className="space-y-2 text-sm">
                              <p className="break-words">
                                <span className="font-medium">Amount:</span>{" "}
                                {registration.amount && registration.currency
                                  ? `${registration.currency} ${registration.amount.toLocaleString()}`
                                  : "TBD"}
                              </p>
                              <p className="break-words">
                                <span className="font-medium">Order Date:</span>{" "}
                                {new Date(registration.order_date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {payment && (
                                <p className="break-words">
                                  <span className="font-medium">Payment Submitted:</span>{" "}
                                  {new Date(payment.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground pt-2 break-words">
                                {!payment &&
                                  registration.status === "pending" &&
                                  "Payment not yet submitted. Please submit your payment proof."}
                                {payment?.payment_status === "pending" &&
                                  "Your payment is pending verification by our team."}
                                {payment?.payment_status === "verified" &&
                                  "Your payment has been verified. You're all set!"}
                                {payment?.payment_status === "rejected" &&
                                  "Your payment was rejected. Please resubmit with correct information."}
                                {registration.status === "completed" && "Your registration is complete."}
                                {registration.status === "cancelled" && "This registration has been cancelled."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {payment?.payment_status === "rejected" && payment.rejection_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-full overflow-hidden">
                            <div className="flex items-start gap-2">
                              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-red-900 mb-1">Payment Rejected</p>
                                <p className="text-sm text-red-800 break-words">{payment.rejection_reason}</p>
                                <p className="text-xs text-red-700 mt-2 break-words">
                                  Please review the reason and resubmit your payment with correct information.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {payment?.payment_proof_url && (
                          <div className="bg-muted/50 border rounded-lg p-4 max-w-full overflow-hidden">
                            <p className="font-semibold text-sm mb-2">Payment Proof</p>
                            <div className="flex items-center gap-3">
                              <div className="relative w-24 h-24 border rounded overflow-hidden flex-shrink-0">
                                <img
                                  src={payment.payment_proof_url || "/placeholder.svg"}
                                  alt="Payment Proof Thumbnail"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedImageUrl(payment.payment_proof_url!)
                                  setShowImageDialog(true)
                                }}
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <ImageIcon className="w-4 h-4" />
                                View Full Size
                              </button>
                            </div>
                          </div>
                        )}

                        {registration.status === "pending" && (
                          <div className="pt-4 border-t border-border">
                            <div className="flex flex-col gap-2 w-full">
                              {payment?.payment_status === "verified" && (
                                <Link href={`/badge/${registration.id}`} className="w-full">
                                  <Button className="w-full bg-green-600 hover:bg-green-700">
                                    <Download className="w-4 h-4 mr-2" />
                                    Print Card
                                  </Button>
                                </Link>
                              )}

                              {payment?.payment_status !== "verified" && (
                                <Link
                                  href={payment ? `/payment/${registration.id}/details` : `/payment/${registration.id}`}
                                  className="w-full"
                                >
                                  <Button variant={payment ? "outline" : "default"} className="w-full">
                                    {!payment && "Submit Payment Proof"}
                                    {payment?.payment_status === "pending" && "View Payment Details"}
                                    {payment?.payment_status === "rejected" && "Resubmit Payment Proof"}
                                  </Button>
                                </Link>
                              )}

                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                {payment?.payment_status === "pending" && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="border-orange-200 text-orange-700 hover:bg-orange-50 w-full bg-transparent"
                                        disabled={cancellingPaymentId === payment.id}
                                      >
                                        {cancellingPaymentId === payment.id ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Cancelling...
                                          </>
                                        ) : (
                                          "Cancel Submission"
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Payment Submission?</AlertDialogTitle>
                                        <AlertDialogDescription className="break-words">
                                          This will remove your payment submission. You will need to submit payment
                                          proof again if you want to continue with this registration.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="w-full sm:w-auto">
                                          Keep Submission
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleCancelPayment(registration.id, payment.id)}
                                          className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
                                        >
                                          Yes, Cancel Submission
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}

                                {!payment && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="border-red-200 text-red-700 hover:bg-red-50 w-full bg-transparent"
                                        disabled={deletingId === registration.id}
                                      >
                                        {deletingId === registration.id ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : (
                                          <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                          </>
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Registration?</AlertDialogTitle>
                                        <AlertDialogDescription className="break-words">
                                          This action cannot be undone. This will permanently delete your registration
                                          for {registration.first_name} {registration.last_name}.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteRegistration(registration.id)}
                                          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                        >
                                          Yes, Delete Registration
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

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
