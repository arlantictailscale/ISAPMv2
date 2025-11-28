"use server"

import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

export async function reuploadPaymentProof(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const registrationId = formData.get("registrationId") as string

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

    if (!registrationId) {
      return { error: "Registration ID is required" }
    }

    // Get user info for tracking
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    // Verify user owns this registration
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("id")
      .eq("id", registrationId)
      .eq("user_id", user.id)
      .single()

    if (regError || !registration) {
      return { error: "Registration not found or unauthorized" }
    }

    const timestamp = Date.now()
    const uniqueId = `${registrationId}-${user.id.substring(0, 8)}-${timestamp}`
    const fileExtension = file.name.split(".").pop()

    // Upload to Vercel Blob using server-side token
    const blob = await put(`payment-proofs/reupload/${uniqueId}.${fileExtension}`, file, {
      access: "public",
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createSupabaseAdmin(supabaseUrl, supabaseServiceKey)

    // Update payments table with new proof URL and reset status to pending
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        payment_proof_url: blob.url,
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("registration_id", registrationId)

    if (updateError) {
      console.error("[v0] Error updating payment proof:", updateError)
      return { error: "Failed to save payment proof reference" }
    }

    console.log("[v0] Payment proof reuploaded successfully:", {
      uniqueId,
      registrationId,
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
    console.error("[v0] Error reuploading payment proof:", error)
    return { error: "Failed to reupload payment proof" }
  }
}
