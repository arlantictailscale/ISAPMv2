import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSponsoredPaymentSubmittedEmail } from "@/lib/email"
import { sanitizeFileName, UPLOAD_CONFIG } from "@/lib/upload-utils"

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
      // Check MIME type
      if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
        console.error("[v0] Invalid file type:", file.type)
        return NextResponse.json(
          {
            error: "Invalid file type. Only JPG, PNG, and PDF files are allowed.",
            details: { providedType: file.type, allowedTypes: UPLOAD_CONFIG.allowedTypes },
          },
          { status: 400 },
        )
      }

      // Check file size
      if (file.size > UPLOAD_CONFIG.maxFileSize) {
        console.error("[v0] File too large:", file.size)
        return NextResponse.json(
          {
            error: `File size must not exceed ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB`,
            details: { providedSize: file.size, maxSize: UPLOAD_CONFIG.maxFileSize },
          },
          { status: 400 },
        )
      }

      // Check minimum file size (prevent empty/corrupt files)
      if (file.size < 1024) {
        console.error("[v0] File too small:", file.size)
        return NextResponse.json(
          {
            error: "File appears to be empty or corrupt. Please upload a valid payment proof.",
          },
          { status: 400 },
        )
      }

      try {
        const buffer = await file.arrayBuffer()
        const header = new Uint8Array(buffer.slice(0, 8))

        // Check for JPEG (FFD8FF), PNG (89504E47), or PDF (%PDF = 25504446)
        const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
        const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47
        const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46

        if (!isJpeg && !isPng && !isPdf) {
          console.error("[v0] File magic bytes do not match expected format")
          return NextResponse.json(
            {
              error: "File content does not match a valid format. Please upload a genuine JPG, PNG, or PDF file.",
            },
            { status: 400 },
          )
        }
      } catch (validationError) {
        console.error("[v0] Error validating file header:", validationError)
        // Continue with upload if validation fails - better to accept than reject valid files
      }

      console.log("[v0] Uploading to Vercel Blob...")

      try {
        const originalExtension = file.name.split(".").pop() || "jpg"
        const sanitizedName = sanitizeFileName(file.name)
        const timestamp = Date.now()
        const uniqueId = `${orderId}-${timestamp}`

        const blob = await put(`payment-proofs/${uniqueId}.${originalExtension}`, file, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: file.type,
        })
        blobUrl = blob.url
        console.log("[v0] File uploaded to blob:", blob.url, "Original name:", sanitizedName)
      } catch (blobError) {
        console.error("[v0] Blob upload error:", blobError)

        const errorMessage = blobError instanceof Error ? blobError.message : "Unknown error"

        if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
          return NextResponse.json(
            {
              error: "Network error during upload. Please check your connection and try again.",
              retryable: true,
            },
            { status: 503 },
          )
        }

        return NextResponse.json(
          {
            error: "Failed to upload file to storage. Please try again.",
            retryable: true,
          },
          { status: 500 },
        )
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
    return NextResponse.json({
      url: blobUrl,
      success: true,
      message: "Payment proof uploaded successfully",
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        error: "Upload failed. Please try again.",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        retryable: true,
      },
      { status: 500 },
    )
  }
}
