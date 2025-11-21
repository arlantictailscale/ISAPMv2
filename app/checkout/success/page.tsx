import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const orderId = searchParams.orderId

  if (!orderId) {
    redirect("/cart")
  }

  // Verify order belongs to user
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).single()

  if (!order) {
    redirect("/cart")
  }

  return (
    <div className="min-h-screen bg-muted/30 py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
            <CardDescription>
              Your order has been created. Please proceed to payment to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono font-medium">{order.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-primary">Rp {order.total_amount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{order.status.replace("_", " ")}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                You will be redirected to the payment page to upload your payment proof.
              </p>

              <Link href={`/payment/order/${order.id}`} className="block">
                <Button size="lg" className="w-full">
                  Proceed to Payment
                </Button>
              </Link>

              <Link href="/dashboard" className="block">
                <Button variant="outline" size="lg" className="w-full bg-transparent">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
