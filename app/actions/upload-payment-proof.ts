"use server"

import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

export async function uploadPaymentProof(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No file provided" }
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return { error: "Only .jpg, .png, and .pdf files are allowed" }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { error: "File size must not exceed 5MB" }
    }

    const orderId = formData.get("orderId") as string

    if (!orderId) {
      return { error: "Order ID is required" }
    }

    // Get user info for tracking
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    const timestamp = Date.now()
    const uniqueId = `${orderId}-${user.id.substring(0, 8)}-${timestamp}`
    const fileExtension = file.name.split(".").pop()

    // Upload to Vercel Blob using server-side token
    const blob = await put(`payment-proofs/${uniqueId}.${fileExtension}`, file, {
      access: "public",
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

    // Update order_payments table with proof URL and unique identifier
    const { error: updateError } = await supabaseAdmin
      .from("order_payments")
      .update({
        payment_proof_url: blob.url,
        transaction_reference: uniqueId, // Store unique ID for tracking
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[v0] Error updating payment proof:", updateError)
      return { error: "Failed to save payment proof reference" }
    }

    console.log("[v0] Payment proof uploaded successfully:", {
      uniqueId,
      orderId,
      userId: user.id,
      fileUrl: blob.url,
      fileType: file.type,
      fileSize: file.size,
    })

    return {
      url: blob.url,
      uniqueId,
      success: true,
    }
  } catch (error) {
    console.error("[v0] Error uploading payment proof:", error)
    return { error: "Failed to upload payment proof" }
  }
}
