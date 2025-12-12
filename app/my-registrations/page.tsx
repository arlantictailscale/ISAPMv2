"use client"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle, Download, ImageIcon } from "lucide-react"
import Link from "next/link"
import { RegistrationActions } from "@/components/registration-actions"

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
  event_name: string
  created_at: string
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

export default async function MyRegistrationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    window.location.href = "/auth/login"
    return null
  }

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", user.id)
    .order("order_date", { ascending: false })

  // Load payments for registrations
  const payments: Record<string, any> = {}
  if (registrations && registrations.length > 0) {
    const registrationIds = registrations.map((r) => r.id)
    const { data: paymentsData } = await supabase.from("payments").select("*").in("registration_id", registrationIds)

    if (paymentsData) {
      paymentsData.forEach((payment) => {
        payments[payment.registration_id] = payment
      })
    }
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
            {!registrations || registrations.length === 0 ? (
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
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg truncate">{registration.event_name}</CardTitle>
                            <CardDescription className="mt-1">
                              Registered on{" "}
                              {new Date(registration.created_at).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 flex-wrap shrink-0">
                            {!payment && (
                              <Badge
                                variant="secondary"
                                className={`${statusColors[registration.status] || ""} whitespace-nowrap`}
                              >
                                {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                              </Badge>
                            )}
                            {payment && (
                              <Badge
                                variant="secondary"
                                className={`${paymentStatusColors[payment.payment_status] || ""} whitespace-nowrap flex items-center gap-1`}
                              >
                                {payment.payment_status === "pending" && <Clock className="w-3 h-3 shrink-0" />}
                                {payment.payment_status === "verified" && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                                {payment.payment_status === "rejected" && <XCircle className="w-3 h-3 shrink-0" />}
                                <span className="text-xs sm:text-sm">
                                  Payment{" "}
                                  {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                                </span>
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
                              <a
                                href={payment.payment_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                              >
                                <ImageIcon className="w-4 h-4" />
                                View Full Size
                              </a>
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

                              {/* Client component for delete/cancel actions */}
                              <RegistrationActions
                                registrationId={registration.id}
                                payment={payment}
                                registrationStatus={registration.status}
                              />
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
    </>
  )
}
