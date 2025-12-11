// Event CMS Types

export type EventType = "webinar" | "workshop" | "symposium" | "cpd" | "meeting" | "other"

export type EventStatus = "draft" | "active" | "coming_soon" | "sold_out" | "completed" | "cancelled"

export type ResourceType = "document" | "image" | "link" | "video" | "other"

export type HistoryAction = "created" | "updated" | "deleted" | "restored" | "status_changed"

// Pricing structure
export interface ParticipantPricing {
  type: string // e.g., 'specialist', 'gp', 'resident', 'student'
  label: string // Display label
  early?: number
  normal?: number
  onsite?: number
}

export interface EventPricing {
  participant_types: ParticipantPricing[]
  currency?: string
  early_bird_deadline?: string
  normal_deadline?: string
}

// Event settings
export interface EventSettings {
  max_participants?: number
  benefits?: string[]
  tags?: string[]
  skp_points?: number
  certificate_available?: boolean
  recording_available?: boolean
  requires_approval?: boolean
  custom_fields?: Record<string, unknown>
}

// Main Event type
export interface Event {
  id: string
  event_type: EventType
  title: string
  short_title?: string
  slug: string
  description?: string
  short_description?: string

  // Date & Time
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  timezone: string

  // Location
  location?: string
  venue?: string
  address?: string
  is_online: boolean
  online_url?: string

  // Status
  status: EventStatus
  is_featured: boolean

  // Images
  thumbnail_url?: string
  hero_image_url?: string

  // Pricing & Settings (stored as JSON)
  pricing: EventPricing
  settings: EventSettings

  // SEO
  meta_title?: string
  meta_description?: string

  // Audit
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  is_active: boolean
  deleted_at?: string
}

// Event Resource
export interface EventResource {
  id: string
  event_id: string
  resource_type: ResourceType
  title: string
  description?: string
  url: string
  file_type?: string
  file_size?: number
  sort_order: number
  is_public: boolean
  is_active: boolean
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

// Event Speaker
export interface EventSpeaker {
  id: string
  event_id: string
  name: string
  title?: string
  credentials?: string
  role?: string
  organization?: string
  bio?: string
  photo_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Event History
export interface EventHistory {
  id: string
  event_id: string
  action: HistoryAction
  changes: Record<string, { old: unknown; new: unknown }>
  changed_by?: string
  changed_at: string
  change_reason?: string
  // Joined data
  changed_by_name?: string
}

// Form types for creating/updating
export interface CreateEventInput {
  event_type: EventType
  title: string
  short_title?: string
  slug?: string
  description?: string
  short_description?: string
  start_date?: string
  end_date?: string
  start_time?: string
  end_time?: string
  timezone?: string
  location?: string
  venue?: string
  address?: string
  is_online?: boolean
  online_url?: string
  status?: EventStatus
  is_featured?: boolean
  thumbnail_url?: string
  hero_image_url?: string
  pricing?: EventPricing
  settings?: EventSettings
  meta_title?: string
  meta_description?: string
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string
}

export interface CreateResourceInput {
  event_id: string
  resource_type: ResourceType
  title: string
  description?: string
  url: string
  file_type?: string
  file_size?: number
  sort_order?: number
  is_public?: boolean
}

export interface CreateSpeakerInput {
  event_id: string
  name: string
  title?: string
  credentials?: string
  role?: string
  organization?: string
  bio?: string
  photo_url?: string
  sort_order?: number
}

// Filter types
export interface EventFilters {
  event_type?: EventType
  status?: EventStatus
  search?: string
  is_featured?: boolean
  date_from?: string
  date_to?: string
}

// Constants
export const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "symposium", label: "Symposium" },
  { value: "workshop", label: "Workshop" },
  { value: "webinar", label: "Webinar" },
  { value: "cpd", label: "CPD" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
]

export const EVENT_STATUSES: { value: EventStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-700" },
  { value: "coming_soon", label: "Coming Soon", color: "bg-blue-100 text-blue-700" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-700" },
  { value: "sold_out", label: "Sold Out", color: "bg-amber-100 text-amber-700" },
  { value: "completed", label: "Completed", color: "bg-purple-100 text-purple-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
]

export const RESOURCE_TYPES: { value: ResourceType; label: string; icon: string }[] = [
  { value: "document", label: "Document", icon: "FileText" },
  { value: "image", label: "Image", icon: "Image" },
  { value: "link", label: "Link", icon: "Link" },
  { value: "video", label: "Video", icon: "Video" },
  { value: "other", label: "Other", icon: "File" },
]

export const SPEAKER_ROLES = ["Keynote Speaker", "Speaker", "Moderator", "Panelist", "Facilitator", "Presenter", "Host"]

export const PARTICIPANT_TYPES = [
  { type: "specialist", label: "Specialist Doctor" },
  { type: "gp", label: "General Practitioner" },
  { type: "resident", label: "Resident" },
  { type: "nurse", label: "Nurse" },
  { type: "student", label: "Student" },
  { type: "other", label: "Other Healthcare Professional" },
]
