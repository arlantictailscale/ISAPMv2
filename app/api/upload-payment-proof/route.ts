import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Payment proof upload request received")

    const formData = await request.formData()
    const file = formData.get("file") as File
    const orderId = formData.get("orderId") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const bankName = formData.get("bankName") as string
    const accountName = formData.get("accountName") as string
    const transactionRef = formData.get("transactionRef") as string
    const additionalNotes = formData.get("additionalNotes") as string
    const userId = formData.get("userId") as string

    console.log("[v0] Form data extracted:", {
      hasFile: !!file,
      orderId,
      userId,
      paymentMethod,
      fileType: file?.type,
      fileSize: file?.size,
    })

    if (!file) {
      console.error("[v0] No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!orderId || !userId) {
      console.error("[v0] Missing required information:", { orderId, userId })
      return NextResponse.json({ error: "Missing required information" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      console.error("[v0] Invalid file type:", file.type)
      return NextResponse.json({ error: "Only .jpg, .png, and .pdf files are allowed" }, { status: 400 })
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error("[v0] File too large:", file.size)
      return NextResponse.json({ error: "File size must not exceed 5MB" }, { status: 400 })
    }

    console.log("[v0] Uploading to Vercel Blob...")

    let blob
    try {
      const extension = file.name.split(".").pop() || "jpg"
      blob = await put(`payment-proofs/${orderId}-${Date.now()}.${extension}`, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      console.log("[v0] File uploaded to blob:", blob.url)
    } catch (blobError) {
      console.error("[v0] Blob upload error:", blobError)
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 })
    }

    const supabase = await createClient()

    console.log("[v0] Fetching order details...")
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("total_amount, currency")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("[v0] Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log("[v0] Checking for existing payment...")
    const { data: existingPayment } = await supabase
      .from("order_payments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle()

    if (existingPayment) {
      console.log("[v0] Updating existing payment record...")
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
      console.log("[v0] Creating new payment record...")
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

    revalidatePath("/my-purchases")
    revalidatePath(`/payment/order/${orderId}`)

    console.log("[v0] Payment proof upload completed successfully")
    return NextResponse.json({ url: blob.url, success: true })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
