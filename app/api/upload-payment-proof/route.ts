import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/security/rate-limit"
import { validateFile, generateSecureFileName } from "@/lib/security/file-validation"
import { paymentUploadSchema, validateInput } from "@/lib/security/validation"

export async function POST(request: NextRequest) {
  try {
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown"
    const rateLimitResult = checkRateLimit(`upload:${clientIP}`, RATE_LIMITS.upload)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many upload attempts. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        },
      )
    }

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

    const validationResult = validateInput(paymentUploadSchema, {
      orderId,
      userId,
      paymentMethod: paymentMethod || "bank_transfer",
      bankName,
      accountName,
      transactionRef,
      additionalNotes,
    })

    if (!validationResult.success) {
      const errors = validationResult.errors.errors.map((e) => e.message).join(", ")
      console.error("[v0] Validation failed:", errors)
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const fileValidation = await validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedCategories: ["image"],
      requireMagicByteValidation: true,
    })

    if (!fileValidation.valid) {
      console.error("[v0] File validation failed:", fileValidation.error)
      return NextResponse.json({ error: fileValidation.error }, { status: 400 })
    }

    console.log("[v0] Uploading to Vercel Blob...")

    let blob
    try {
      const secureFileName = generateSecureFileName(file.name, `payment-${orderId}`)
      blob = await put(`payment-proofs/${secureFileName}`, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      console.log("[v0] File uploaded to blob:", blob.url)
    } catch (blobError) {
      console.error("[v0] Blob upload error:", blobError)
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.id !== userId) {
      console.warn(`[Security] User ${user.id} attempted to upload payment for user ${userId}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("[v0] Fetching order details...")
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("total_amount, currency, user_id")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("[v0] Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      console.warn(`[Security] User ${user.id} attempted to upload payment for order owned by ${order.user_id}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
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
    return NextResponse.json({ url: blob.url, success: true }, { headers: getRateLimitHeaders(rateLimitResult) })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
