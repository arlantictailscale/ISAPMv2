import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSponsoredPaymentSubmittedEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Payment proof upload request received")

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const orderId = formData.get("orderId") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const bankName = formData.get("bankName") as string
    const accountName = formData.get("accountName") as string
    const transactionRef = formData.get("transactionRef") as string
    const additionalNotes = formData.get("additionalNotes") as string
    const userId = formData.get("userId") as string
    const sponsorName = formData.get("sponsorName") as string

    const isSponsored = paymentMethod === "Sponsored"

    console.log("[v0] Form data extracted:", {
      hasFile: !!file,
      orderId,
      userId,
      paymentMethod,
      isSponsored,
      sponsorName: isSponsored ? sponsorName : undefined,
      fileType: file?.type,
      fileSize: file?.size,
    })

    if (!isSponsored && !file) {
      console.error("[v0] No file provided for non-sponsored payment")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!orderId || !userId) {
      console.error("[v0] Missing required information:", { orderId, userId })
      return NextResponse.json({ error: "Missing required information" }, { status: 400 })
    }

    if (isSponsored && !sponsorName?.trim()) {
      console.error("[v0] Missing sponsor name for sponsored payment")
      return NextResponse.json({ error: "Sponsor name is required for sponsored payments" }, { status: 400 })
    }

    let blobUrl: string | null = null

    if (file && !isSponsored) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
      if (!allowedTypes.includes(file.type)) {
        console.error("[v0] Invalid file type:", file.type)
        return NextResponse.json({ error: "Only .jpg and .png files are allowed" }, { status: 400 })
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        console.error("[v0] File too large:", file.size)
        return NextResponse.json({ error: "File size must not exceed 5MB" }, { status: 400 })
      }

      console.log("[v0] Uploading to Vercel Blob...")

      try {
        const extension = file.name.split(".").pop() || "jpg"
        const blob = await put(`payment-proofs/${orderId}-${Date.now()}.${extension}`, file, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        blobUrl = blob.url
        console.log("[v0] File uploaded to blob:", blob.url)
      } catch (blobError) {
        console.error("[v0] Blob upload error:", blobError)
        return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 })
      }
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

    const paymentData = {
      payment_proof_url: blobUrl,
      payment_status: "pending",
      payment_method: paymentMethod,
      bank_name: isSponsored ? null : bankName,
      account_name: isSponsored ? null : accountName,
      transaction_reference: isSponsored ? null : transactionRef,
      notes: additionalNotes,
      sponsor_name: isSponsored ? sponsorName : null,
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Checking for existing payment...")
    const { data: existingPayment } = await supabase
      .from("order_payments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle()

    if (existingPayment) {
      console.log("[v0] Updating existing payment record...")
      const { error: updateError } = await supabase.from("order_payments").update(paymentData).eq("order_id", orderId)

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
        ...paymentData,
      })

      if (insertError) {
        console.error("[v0] Error inserting payment proof:", insertError)
        return NextResponse.json({ error: "Failed to save payment proof" }, { status: 500 })
      }

      console.log("[v0] Payment record created successfully")
    }

    if (isSponsored) {
      try {
        // Fetch order details with items for the email
        const { data: orderWithItems } = await supabase
          .from("orders")
          .select(`
            *,
            order_items (*)
          `)
          .eq("id", orderId)
          .single()

        if (orderWithItems) {
          await sendSponsoredPaymentSubmittedEmail({
            email: orderWithItems.email,
            userName: orderWithItems.full_name,
            orderId: orderId,
            sponsorName: sponsorName,
            orderItems: orderWithItems.order_items || [],
            totalAmount: orderWithItems.total_amount,
            currency: orderWithItems.currency,
          })
          console.log("[v0] Sponsored payment submitted email sent to:", orderWithItems.email)
        }
      } catch (emailError) {
        console.error("[v0] Failed to send sponsored payment submitted email:", emailError)
        // Don't fail the request if email fails
      }
    }

    revalidatePath("/my-purchases")
    revalidatePath(`/payment/order/${orderId}`)

    console.log("[v0] Payment proof upload completed successfully")
    return NextResponse.json({ url: blobUrl, success: true })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
