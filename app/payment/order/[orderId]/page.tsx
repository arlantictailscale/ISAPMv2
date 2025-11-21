"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

export default function OrderPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)

  useEffect(() => {
    checkAuthAndLoadOrder()
  }, [orderId])

  const checkAuthAndLoadOrder = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderError) throw orderError

      if (orderData.user_id !== user.id) {
        toast.error("Unauthorized access")
        router.push("/dashboard")
        return
      }

      setOrder(orderData)

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)

      if (itemsError) throw itemsError
      setOrderItems(itemsData || [])
    } catch (error: any) {
      console.error("[v0] Error loading order:", error)
      toast.error("Failed to load booking details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentFile(e.target.files[0])
    }
  }

  const handleUploadProof = async () => {
    if (!paymentFile) {
      toast.error("Please select a file to upload")
      return
    }

    try {
      setIsUploading(true)

      const fileExt = paymentFile.name.split(".").pop()
      const fileName = `${user.id}/${orderId}-${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, paymentFile)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("payment-proofs").getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_proof_url: publicUrl,
          status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (updateError) throw updateError

      toast.success("Payment proof uploaded successfully!")
      checkAuthAndLoadOrder()
    } catch (error: any) {
      console.error("[v0] Upload error:", error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      not_submitted: { label: "Not Submitted", variant: "secondary", icon: Clock },
      pending: { label: "Pending Review", variant: "default", icon: Clock },
      verified: { label: "Verified", variant: "default", icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
    }

    const config = statusConfig[status] || statusConfig.not_submitted
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen">
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">Hotel Booking Payment</h1>
              <p className="text-muted-foreground">Order ID: {orderId}</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Booking Details</CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {orderItems.map((item: any) => (
                  <div key={item.id} className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {item.hotel_room_type || item.event_label || "Hotel Room"}
                        </h3>
                        <p className="text-sm text-muted-foreground">The Singhasari Resort & Convention Batu, Malang</p>
                      </div>
                      <p className="font-bold text-lg">
                        Rp {(item.unit_price * (item.nights || 1)).toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm bg-muted p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Guest Name:</span>
                        <span className="font-medium">{order.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{order.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{order.phone}</span>
                      </div>
                      {item.check_in_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-in:</span>
                          <span className="font-medium">
                            {new Date(item.check_in_date).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      )}
                      {item.check_out_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check-out:</span>
                          <span className="font-medium">
                            {new Date(item.check_out_date).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                      )}
                      {item.nights && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Number of Nights:</span>
                          <span className="font-medium">{item.nights}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-primary">Rp {order.total_amount.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Please transfer to the following account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Bank:</span>
                    <span>BCA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Account Number:</span>
                    <span className="font-mono">1234567890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Account Name:</span>
                    <span>ISAPM 2026</span>
                  </div>
                </div>

                {order.status === "not_submitted" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentProof">Upload Payment Proof</Label>
                      <Input id="paymentProof" type="file" accept="image/*" onChange={handleFileChange} />
                    </div>
                    <Button onClick={handleUploadProof} disabled={!paymentFile || isUploading} className="w-full">
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
                )}

                {order.payment_proof_url && (
                  <div className="space-y-2">
                    <Label>Submitted Payment Proof</Label>
                    <div className="border rounded-lg p-4">
                      <Image
                        src={order.payment_proof_url || "/placeholder.svg"}
                        alt="Payment proof"
                        width={400}
                        height={300}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {order.status === "rejected" && order.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-900">Rejection Reason:</p>
                    <p className="text-red-700">{order.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={() => router.push("/my-orders")} variant="outline" className="w-full">
              Back to My Bookings
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
