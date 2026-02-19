"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  WebinarContent,
  WebinarContentHistory,
  CreateContentInput,
  UpdateContentInput,
  ContentType,
} from "@/lib/webinar-cms/types"

// Check if user is admin
async function checkAdminAccess(): Promise<{ isAdmin: boolean; userId: string | null; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, userId: null, error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    return { isAdmin: false, userId: user.id, error: "Admin access required" }
  }

  return { isAdmin: true, userId: user.id }
}

// Log history entry
async function logHistory(
  contentId: string | null,
  webinarId: string,
  action: "created" | "updated" | "deleted" | "restored",
  changedBy: string,
  fieldChanged?: string,
  oldValue?: string,
  newValue?: string,
  changeReason?: string,
): Promise<void> {
  const supabase = await createClient()

  await supabase.from("webinar_content_history").insert({
    content_id: contentId,
    webinar_id: webinarId,
    action,
    field_changed: fieldChanged || null,
    old_value: oldValue || null,
    new_value: newValue || null,
    changed_by: changedBy,
    change_reason: changeReason || null,
  })
}

// Get all content for a webinar (admin view)
export async function getWebinarContentAdmin(
  webinarId: string,
): Promise<{ success: boolean; content?: WebinarContent[]; error?: string }> {
  const { isAdmin, error } = await checkAdminAccess()
  if (!isAdmin) return { success: false, error }

  const supabase = await createClient()
  const { data, error: dbError } = await supabase
    .from("webinar_content")
    .select("*")
    .eq("webinar_id", webinarId)
    .order("content_type")
    .order("sort_order")

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  return { success: true, content: data as WebinarContent[] }
}

// Get active content for a webinar (user view - checks access)
export async function getWebinarContentForUser(
  webinarId: string,
): Promise<{ success: boolean; content?: WebinarContent[]; hasAccess: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, hasAccess: false, error: "Not authenticated" }
  }

  // Check if user has access to this webinar
  // 1. Check direct purchase
  const { data: purchaseData } = await supabase
    .from("orders")
    .select(`
      id,
      order_items!inner(event_id, item_type),
      order_payments!inner(payment_status)
    `)
    .eq("user_id", user.id)
    .eq("order_items.event_id", webinarId)
    .eq("order_items.item_type", "webinar")
    .eq("order_payments.payment_status", "verified")
    .limit(1)

  // 2. Check symposium grant
  const { data: grantData } = await supabase
    .from("symposium_webinar_grants")
    .select("id")
    .eq("user_id", user.id)
    .eq("webinar_id", webinarId)
    .eq("status", "active")
    .limit(1)

  const hasAccess = (purchaseData && purchaseData.length > 0) || (grantData && grantData.length > 0)

  // Fetch content based on access
  let query = supabase
    .from("webinar_content")
    .select("*")
    .eq("webinar_id", webinarId)
    .eq("is_active", true)
    .order("content_type")
    .order("sort_order")

  if (!hasAccess) {
    // Only public content for users without access
    query = query.eq("is_public", true)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    return { success: false, hasAccess, error: dbError.message }
  }

  return { success: true, content: data as WebinarContent[], hasAccess }
}

// Create new content
export async function createWebinarContent(
  input: CreateContentInput,
): Promise<{ success: boolean; content?: WebinarContent; error?: string }> {
  const { isAdmin, userId, error } = await checkAdminAccess()
  if (!isAdmin || !userId) return { success: false, error }

  const supabase = await createClient()

  const { data, error: dbError } = await supabase
    .from("webinar_content")
    .insert({
      webinar_id: input.webinar_id,
      content_type: input.content_type,
      title: input.title,
      description: input.description || null,
      url: input.url,
      file_type: input.file_type || null,
      file_size: input.file_size || null,
      sort_order: input.sort_order || 0,
      is_public: input.is_public || false,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  // Log history
  await logHistory(data.id, input.webinar_id, "created", userId, null, null, JSON.stringify(input))

  revalidatePath("/admin/webinar-cms")
  revalidatePath("/my-webinars")

  return { success: true, content: data as WebinarContent }
}

// Update content
export async function updateWebinarContent(
  contentId: string,
  input: UpdateContentInput,
  changeReason?: string,
): Promise<{ success: boolean; content?: WebinarContent; error?: string }> {
  const { isAdmin, userId, error } = await checkAdminAccess()
  if (!isAdmin || !userId) return { success: false, error }

  const supabase = await createClient()

  // Get current content for history
  const { data: current } = await supabase.from("webinar_content").select("*").eq("id", contentId).single()

  if (!current) {
    return { success: false, error: "Content not found" }
  }

  // Update content
  const { data, error: dbError } = await supabase
    .from("webinar_content")
    .update({
      ...input,
      updated_by: userId,
    })
    .eq("id", contentId)
    .select()
    .single()

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  // Log history for each changed field
  for (const [key, newValue] of Object.entries(input)) {
    const oldValue = current[key as keyof typeof current]
    if (oldValue !== newValue) {
      await logHistory(
        contentId,
        current.webinar_id,
        "updated",
        userId,
        key,
        String(oldValue),
        String(newValue),
        changeReason,
      )
    }
  }

  revalidatePath("/admin/webinar-cms")
  revalidatePath("/my-webinars")

  return { success: true, content: data as WebinarContent }
}

// Soft delete content
export async function deleteWebinarContent(
  contentId: string,
  changeReason?: string,
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId, error } = await checkAdminAccess()
  if (!isAdmin || !userId) return { success: false, error }

  const supabase = await createClient()

  // Get current content for history
  const { data: current } = await supabase.from("webinar_content").select("*").eq("id", contentId).single()

  if (!current) {
    return { success: false, error: "Content not found" }
  }

  // Soft delete
  const { error: dbError } = await supabase.from("webinar_content").update({ is_active: false }).eq("id", contentId)

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  // Log history
  await logHistory(contentId, current.webinar_id, "deleted", userId, null, null, null, changeReason)

  revalidatePath("/admin/webinar-cms")
  revalidatePath("/my-webinars")

  return { success: true }
}

// Restore deleted content
export async function restoreWebinarContent(contentId: string): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId, error } = await checkAdminAccess()
  if (!isAdmin || !userId) return { success: false, error }

  const supabase = await createClient()

  // Get current content
  const { data: current } = await supabase.from("webinar_content").select("*").eq("id", contentId).single()

  if (!current) {
    return { success: false, error: "Content not found" }
  }

  // Restore
  const { error: dbError } = await supabase.from("webinar_content").update({ is_active: true }).eq("id", contentId)

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  // Log history
  await logHistory(contentId, current.webinar_id, "restored", userId)

  revalidatePath("/admin/webinar-cms")
  revalidatePath("/my-webinars")

  return { success: true }
}

// Get content history
export async function getWebinarContentHistory(
  webinarId?: string,
  contentId?: string,
): Promise<{ success: boolean; history?: WebinarContentHistory[]; error?: string }> {
  const { isAdmin, error } = await checkAdminAccess()
  if (!isAdmin) return { success: false, error }

  const supabase = await createClient()

  let query = supabase
    .from("webinar_content_history")
    .select(`
      *,
      profiles:changed_by(full_name)
    `)
    .order("changed_at", { ascending: false })

  if (webinarId) {
    query = query.eq("webinar_id", webinarId)
  }

  if (contentId) {
    query = query.eq("content_id", contentId)
  }

  const { data, error: dbError } = await query.limit(100)

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  return { success: true, history: data as WebinarContentHistory[] }
}

// Reorder content
export async function reorderWebinarContent(
  webinarId: string,
  contentType: ContentType,
  orderedIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const { isAdmin, userId, error } = await checkAdminAccess()
  if (!isAdmin || !userId) return { success: false, error }

  const supabase = await createClient()

  // Update sort_order for each content
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from("webinar_content").update({ sort_order: i, updated_by: userId }).eq("id", orderedIds[i])
  }

  revalidatePath("/admin/webinar-cms")
  revalidatePath("/my-webinars")

  return { success: true }
}

// Bulk create content (useful for initial setup)
export async function bulkCreateWebinarContent(
  items: CreateContentInput[],
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const { isAdmin, userId, error } = await checkAdminAccess()
  if (!isAdmin || !userId) return { success: false, created: 0, errors: [error || "Unauthorized"] }

  let created = 0
  const errors: string[] = []

  for (const item of items) {
    const result = await createWebinarContent(item)
    if (result.success) {
      created++
    } else {
      errors.push(`Failed to create "${item.title}": ${result.error}`)
    }
  }

  return { success: errors.length === 0, created, errors }
}
