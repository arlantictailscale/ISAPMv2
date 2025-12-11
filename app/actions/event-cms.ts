"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  Event,
  EventResource,
  EventSpeaker,
  EventHistory,
  EventFilters,
  CreateEventInput,
  UpdateEventInput,
  CreateResourceInput,
  CreateSpeakerInput,
} from "@/lib/event-cms/types"

// ============================================
// HELPER FUNCTIONS
// ============================================

async function isAdmin(): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  return profile?.role === "admin"
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id || null
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 100)
}

async function logEventHistory(
  eventId: string,
  action: EventHistory["action"],
  changes: Record<string, { old: unknown; new: unknown }>,
  reason?: string,
) {
  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  await supabase.from("event_history").insert({
    event_id: eventId,
    action,
    changes,
    changed_by: userId,
    change_reason: reason,
  })
}

// ============================================
// EVENT CRUD
// ============================================

export async function getEvents(filters?: EventFilters): Promise<{ data: Event[]; error: string | null }> {
  const supabase = await createServerSupabaseClient()

  let query = supabase.from("events").select("*").eq("is_active", true).order("created_at", { ascending: false })

  if (filters?.event_type) {
    query = query.eq("event_type", filters.event_type)
  }
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  if (filters?.is_featured !== undefined) {
    query = query.eq("is_featured", filters.is_featured)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  if (filters?.date_from) {
    query = query.gte("start_date", filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte("start_date", filters.date_to)
  }

  const { data, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data as Event[], error: null }
}

export async function getEventById(id: string): Promise<{ data: Event | null; error: string | null }> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("events").select("*").eq("id", id).single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Event, error: null }
}

export async function getEventBySlug(slug: string): Promise<{ data: Event | null; error: string | null }> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).eq("is_active", true).single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Event, error: null }
}

export async function createEvent(input: CreateEventInput): Promise<{ data: Event | null; error: string | null }> {
  if (!(await isAdmin())) {
    return { data: null, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  // Generate slug if not provided
  const slug = input.slug || generateSlug(input.title)

  // Check for duplicate slug
  const { data: existing } = await supabase.from("events").select("id").eq("slug", slug).single()

  if (existing) {
    return { data: null, error: "An event with this slug already exists" }
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      ...input,
      slug,
      pricing: input.pricing || { participant_types: [] },
      settings: input.settings || {},
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Log history
  await logEventHistory(data.id, "created", {
    event: { old: null, new: data.title },
  })

  revalidatePath("/admin/event-cms")
  return { data: data as Event, error: null }
}

export async function updateEvent(input: UpdateEventInput): Promise<{ data: Event | null; error: string | null }> {
  if (!(await isAdmin())) {
    return { data: null, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  // Get current event for history comparison
  const { data: currentEvent } = await supabase.from("events").select("*").eq("id", input.id).single()

  if (!currentEvent) {
    return { data: null, error: "Event not found" }
  }

  // Check slug uniqueness if changed
  if (input.slug && input.slug !== currentEvent.slug) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", input.slug)
      .neq("id", input.id)
      .single()

    if (existing) {
      return { data: null, error: "An event with this slug already exists" }
    }
  }

  const { id, ...updateData } = input

  const { data, error } = await supabase
    .from("events")
    .update({
      ...updateData,
      updated_by: userId,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Log changes
  const changes: Record<string, { old: unknown; new: unknown }> = {}
  for (const key of Object.keys(updateData)) {
    const oldVal = currentEvent[key as keyof typeof currentEvent]
    const newVal = updateData[key as keyof typeof updateData]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal, new: newVal }
    }
  }

  if (Object.keys(changes).length > 0) {
    await logEventHistory(id, "updated", changes)
  }

  revalidatePath("/admin/event-cms")
  return { data: data as Event, error: null }
}

export async function deleteEvent(id: string): Promise<{ success: boolean; error: string | null }> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()

  // Get event title for history
  const { data: event } = await supabase.from("events").select("title").eq("id", id).single()

  // Soft delete
  const { error } = await supabase
    .from("events")
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  await logEventHistory(id, "deleted", {
    event: { old: event?.title, new: null },
  })

  revalidatePath("/admin/event-cms")
  return { success: true, error: null }
}

export async function restoreEvent(id: string): Promise<{ success: boolean; error: string | null }> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()

  const { data: event } = await supabase.from("events").select("title").eq("id", id).single()

  const { error } = await supabase.from("events").update({ is_active: true, deleted_at: null }).eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  await logEventHistory(id, "restored", {
    event: { old: null, new: event?.title },
  })

  revalidatePath("/admin/event-cms")
  return { success: true, error: null }
}

export async function duplicateEvent(id: string): Promise<{ data: Event | null; error: string | null }> {
  if (!(await isAdmin())) {
    return { data: null, error: "Unauthorized" }
  }

  const { data: original, error: fetchError } = await getEventById(id)

  if (fetchError || !original) {
    return { data: null, error: fetchError || "Event not found" }
  }

  // Create copy with new slug
  const newSlug = `${original.slug}-copy-${Date.now()}`
  const newTitle = `${original.title} (Copy)`

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at, updated_at, created_by, updated_by, ...eventData } = original

  return createEvent({
    ...eventData,
    title: newTitle,
    slug: newSlug,
    status: "draft",
  })
}

// ============================================
// EVENT RESOURCES
// ============================================

export async function getEventResources(eventId: string): Promise<{ data: EventResource[]; error: string | null }> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("event_resources")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data as EventResource[], error: null }
}

export async function createEventResource(
  input: CreateResourceInput,
): Promise<{ data: EventResource | null; error: string | null }> {
  if (!(await isAdmin())) {
    return { data: null, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from("event_resources")
    .insert({
      ...input,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/admin/event-cms")
  return { data: data as EventResource, error: null }
}

export async function updateEventResource(
  id: string,
  input: Partial<CreateResourceInput>,
): Promise<{ data: EventResource | null; error: string | null }> {
  if (!(await isAdmin())) {
    return { data: null, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from("event_resources")
    .update({ ...input, updated_by: userId })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/admin/event-cms")
  return { data: data as EventResource, error: null }
}

export async function deleteEventResource(id: string): Promise<{ success: boolean; error: string | null }> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from("event_resources").update({ is_active: false }).eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/event-cms")
  return { success: true, error: null }
}

// ============================================
// EVENT SPEAKERS
// ============================================

export async function getEventSpeakers(eventId: string): Promise<{ data: EventSpeaker[]; error: string | null }> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("event_speakers")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data as EventSpeaker[], error: null }
}

export async function createEventSpeaker(
  input: CreateSpeakerInput,
): Promise<{ data: EventSpeaker | null; error: string | null }> {
  if (!(await isAdmin())) {
    return { data: null, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("event_speakers").insert(input).select().single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/admin/event-cms")
  return { data: data as EventSpeaker, error: null }
}

export async function updateEventSpeaker(
  id: string,
  input: Partial<CreateSpeakerInput>,
): Promise<{ data: EventSpeaker | null; error: string | null }> {
  if (!(await isAdmin())) {
    return { data: null, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("event_speakers").update(input).eq("id", id).select().single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/admin/event-cms")
  return { data: data as EventSpeaker, error: null }
}

export async function deleteEventSpeaker(id: string): Promise<{ success: boolean; error: string | null }> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from("event_speakers").update({ is_active: false }).eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/event-cms")
  return { success: true, error: null }
}

// ============================================
// EVENT HISTORY
// ============================================

export async function getEventHistory(eventId: string): Promise<{ data: EventHistory[]; error: string | null }> {
  if (!(await isAdmin())) {
    return { data: [], error: "Unauthorized" }
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("event_history")
    .select(`
      *,
      profiles:changed_by (full_name)
    `)
    .eq("event_id", eventId)
    .order("changed_at", { ascending: false })

  if (error) {
    return { data: [], error: error.message }
  }

  // Map the joined data
  const historyWithNames = data.map((item: Record<string, unknown>) => ({
    ...item,
    changed_by_name: (item.profiles as { full_name: string } | null)?.full_name || "Unknown",
  }))

  return { data: historyWithNames as EventHistory[], error: null }
}

// ============================================
// STATS
// ============================================

export async function getEventStats(): Promise<{
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
}> {
  const supabase = await createServerSupabaseClient()

  const { data: events } = await supabase.from("events").select("event_type, status").eq("is_active", true)

  const stats = {
    total: events?.length || 0,
    byType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  }

  events?.forEach((event) => {
    stats.byType[event.event_type] = (stats.byType[event.event_type] || 0) + 1
    stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1
  })

  return stats
}
