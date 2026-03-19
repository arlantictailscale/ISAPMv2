"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendPosterSubmissionConfirmation } from "@/lib/email"

interface SubmitPosterInput {
  title: string
  authors: string
  university: string
  category: string
  topic: string
  fileUrl: string
  abstractUrl: string
  fullTextUrl: string
}

export async function submitPoster(input: SubmitPosterInput): Promise<{ success: boolean; error?: string }> {
  console.log("[v0] submitPoster server action called with:", input)

  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("[v0] submitPoster: No authenticated user", userError)
      return { success: false, error: "You must be logged in to submit a poster" }
    }

    console.log("[v0] submitPoster: User authenticated:", user.id)

    // Use admin client to bypass RLS for insert
    const adminClient = createAdminClient()

    const { data: insertedData, error: insertError } = await adminClient.from("abstracts").insert([
      {
        user_id: user.id,
        email: user.email,
        title: input.title,
        authors: input.authors,
        keywords: input.topic,
        content: input.abstractUrl,
        category: input.category,
        submission_status: "pending",
        file_url: input.fileUrl,
        university: input.university,
        full_text_url: input.fullTextUrl,
      },
    ]).select("id").single()

    if (insertError) {
      console.error("[v0] submitPoster: Insert error:", insertError)
      return { success: false, error: insertError.message }
    }

    console.log("[v0] submitPoster: Insert successful! ID:", insertedData?.id)

    // Send confirmation email directly (not via fetch to avoid server action to API issues)
    try {
      // Get user's full name from profile
      const { data: profile } = await adminClient
        .from("profiles")
        .select("first_name, last_name, full_name")
        .eq("id", user.id)
        .single()
      
      const userName = profile?.full_name || 
        (profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : user.email?.split("@")[0] || "Participant")
      
      console.log("[v0] submitPoster: Sending email directly to", user.email, "for poster:", input.title)
      
      // Call the email function directly instead of using fetch to internal API
      const emailResult = await sendPosterSubmissionConfirmation({
        email: user.email!,
        userName,
        posterTitle: input.title,
        posterId: insertedData?.id || "N/A",
        category: input.category,
        topic: input.topic,
      })

      if (emailResult.success) {
        console.log("[v0] submitPoster: Confirmation email sent successfully!")
      } else {
        console.warn("[v0] submitPoster: Email send failed but submission succeeded:", emailResult.error)
      }
    } catch (emailError) {
      console.warn("[v0] submitPoster: Email error (submission still successful):", emailError)
    }

    revalidatePath("/my-posters")
    revalidatePath("/admin/posters")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("[v0] submitPoster: Unexpected error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
