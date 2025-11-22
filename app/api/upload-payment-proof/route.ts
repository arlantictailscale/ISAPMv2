import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const orderId = formData.get("orderId") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const bankName = formData.get("bankName") as string
    const accountName = formData.get("accountName") as string
    const transactionRef = formData.get("transactionRef") as string
    const additionalNotes = formData.get("additionalNotes") as string
    const userId = formData.get("userId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!orderId || !userId) {
      return NextResponse.json({ error: "Missing required information" }, { status: 400 })
    }

    // Validate file type
    if (file.type !== "image/jpeg" && file.type !== "image/jpg" && file.type !== "image/png") {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Validate file size (1MB)
    if (file.size > 1048576) {
      return NextResponse.json({ error: "File size must not exceed 1MB" }, { status: 400 })
    }

    console.log("[v0] Uploading payment proof for order:", orderId)

    const blob = await put(`payment-proofs/${orderId}-${Date.now()}.jpg`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("[v0] File uploaded to blob:", blob.url)

    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("total_amount, currency")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("[v0] Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const { data: existingPayment } = await supabase
      .from("order_payments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle()

    if (existingPayment) {
      const { error: updateError } = await supabase
        .from("order_payments")
        .update({
          payment_proof_url: blob.url,
          payment_status: "pending",
          payment_method: paymentMethod,
          bank_name: bankName,
          account_name: accountName,
          transaction_reference: transactionRef,
          notes: additionalNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      if (updateError) {
        console.error("[v0] Error updating payment proof:", updateError)
        return NextResponse.json({ error: "Failed to save payment proof" }, { status: 500 })
      }

      console.log("[v0] Payment record updated successfully")
    } else {
      const { error: insertError } = await supabase.from("order_payments").insert({
        order_id: orderId,
        user_id: userId,
        amount: order.total_amount,
        currency: order.currency,
        payment_proof_url: blob.url,
        payment_status: "pending",
        payment_method: paymentMethod,
        bank_name: bankName,
        account_name: accountName,
        transaction_reference: transactionRef,
        notes: additionalNotes,
      })

      if (insertError) {
        console.error("[v0] Error inserting payment proof:", insertError)
        return NextResponse.json({ error: "Failed to save payment proof" }, { status: 500 })
      }

      console.log("[v0] Payment record created successfully")
    }

    return NextResponse.json({ url: blob.url, success: true })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
