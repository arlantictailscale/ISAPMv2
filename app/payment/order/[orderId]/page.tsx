import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PaymentOrderClient from "./payment-order-client"

export default async function PaymentOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (*),
      order_payments (*)
    `,
    )
    .eq("id", orderId)
    .single()

  if (orderError || !orderData) {
    console.error("[v0] Order fetch error:", orderError)
    redirect("/my-purchases")
  }

  const userId = orderData.user_id

  if (!userId) {
    redirect("/auth/login")
  }

  const payment = orderData.order_payments?.[0] || null

  return <PaymentOrderClient order={orderData} userId={userId} payment={payment} />
}
