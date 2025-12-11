// Webinar CMS Types

export type ContentType = "link" | "material" | "recording" | "resource"
export type HistoryAction = "created" | "updated" | "deleted" | "restored"

export interface WebinarContent {
  id: string
  webinar_id: string
  content_type: ContentType
  title: string
  description: string | null
  url: string
  file_type: string | null
  file_size: number | null
  sort_order: number
  is_public: boolean
  is_active: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface WebinarContentHistory {
  id: string
  content_id: string | null
  webinar_id: string
  action: HistoryAction
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
  change_reason: string | null
  // Joined data
  profiles?: {
    full_name: string | null
  }
}

export interface CreateContentInput {
  webinar_id: string
  content_type: ContentType
  title: string
  description?: string
  url: string
  file_type?: string
  file_size?: number
  sort_order?: number
  is_public?: boolean
}

export interface UpdateContentInput {
  title?: string
  description?: string
  url?: string
  file_type?: string
  file_size?: number
  sort_order?: number
  is_public?: boolean
  is_active?: boolean
}

// Content type display configuration
export const CONTENT_TYPE_CONFIG: Record<
  ContentType,
  {
    label: string
    icon: string
    description: string
    color: string
  }
> = {
  link: {
    label: "Links",
    icon: "Link",
    description: "Join links, meeting URLs, external resources",
    color: "blue",
  },
  material: {
    label: "Materials",
    icon: "FileText",
    description: "Presentations, handouts, documents",
    color: "emerald",
  },
  recording: {
    label: "Recordings",
    icon: "Video",
    description: "Session recordings, highlights",
    color: "purple",
  },
  resource: {
    label: "Resources",
    icon: "BookOpen",
    description: "References, articles, additional resources",
    color: "amber",
  },
}

// File type display configuration
export const FILE_TYPE_CONFIG: Record<
  string,
  {
    label: string
    icon: string
    color: string
  }
> = {
  pdf: { label: "PDF", icon: "FileText", color: "red" },
  pptx: { label: "PowerPoint", icon: "Presentation", color: "orange" },
  ppt: { label: "PowerPoint", icon: "Presentation", color: "orange" },
  doc: { label: "Word", icon: "FileText", color: "blue" },
  docx: { label: "Word", icon: "FileText", color: "blue" },
  xls: { label: "Excel", icon: "Table", color: "green" },
  xlsx: { label: "Excel", icon: "Table", color: "green" },
  mp4: { label: "Video", icon: "Video", color: "purple" },
  mp3: { label: "Audio", icon: "Music", color: "pink" },
  zip: { label: "Archive", icon: "Archive", color: "gray" },
  youtube: { label: "YouTube", icon: "Youtube", color: "red" },
  zoom: { label: "Zoom", icon: "Video", color: "blue" },
  link: { label: "Link", icon: "ExternalLink", color: "gray" },
}

export function getFileTypeFromUrl(url: string): string {
  // Check for known platforms
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("zoom.us")) return "zoom"
  if (url.includes("drive.google.com")) return "link"

  // Extract extension from URL
  const extension = url.split(".").pop()?.toLowerCase().split("?")[0]
  if (extension && FILE_TYPE_CONFIG[extension]) return extension

  return "link"
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
