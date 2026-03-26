import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Gift } from "lucide-react"
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
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single()

  if (!order) {
    redirect("/cart")
  }

  // Calculate correct total from order items
  const calculatedTotal = (order.order_items || []).reduce((sum: number, item: any) => {
    const nights = item.nights || 1
    return sum + (item.unit_price || 0) * nights
  }, 0)

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
                <span className="font-bold text-primary">Rp {calculatedTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{order.status.replace("_", " ")}</span>
              </div>
            </div>

            {order.order_items?.some((item: any) => item.event_id === "symposium") && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                <Gift className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-teal-800">Bonus Webinars Included!</p>
                  <p className="text-xs text-teal-700 mt-0.5">
                    Your symposium registration includes complimentary access to 4 pre-conference webinars. Access will
                    be granted once your payment is verified.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-amber-800">
                Please complete your payment within <strong>24 hours</strong>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Orders without payment proof will be automatically cancelled after 24 hours.
              </p>
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
