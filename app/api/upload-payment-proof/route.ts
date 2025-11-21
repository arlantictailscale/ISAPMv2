import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const orderId = formData.get("orderId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (file.type !== "image/jpeg" && file.type !== "image/jpg" && file.type !== "image/png") {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Validate file size (1MB)
    if (file.size > 1048576) {
      return NextResponse.json({ error: "File size must not exceed 1MB" }, { status: 400 })
    }

    const blob = await put(`payment-proofs/${orderId}-${Date.now()}.jpg`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Update the order_payments table with the payment proof URL
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from("order_payments")
      .update({
        payment_proof_url: blob.url,
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)

    if (updateError) {
      console.error("[v0] Error updating payment proof:", updateError)
      return NextResponse.json({ error: "Failed to save payment proof" }, { status: 500 })
    }

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
