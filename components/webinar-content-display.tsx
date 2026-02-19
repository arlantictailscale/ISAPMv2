"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LinkIcon, FileText, Video, BookOpen, ExternalLink, Download, Play, Loader2, Lock } from "lucide-react"
import { getWebinarContentForUser } from "@/app/actions/webinar-cms"
import type { WebinarContent, ContentType } from "@/lib/webinar-cms/types"
import { FILE_TYPE_CONFIG, formatFileSize } from "@/lib/webinar-cms/types"

const CONTENT_TYPE_ICONS: Record<ContentType, React.ElementType> = {
  link: LinkIcon,
  material: FileText,
  recording: Video,
  resource: BookOpen,
}

const SECTION_CONFIG: Record<ContentType, { title: string; icon: React.ElementType; color: string }> = {
  link: { title: "Join Webinar", icon: LinkIcon, color: "indigo" },
  material: { title: "Materials", icon: FileText, color: "emerald" },
  recording: { title: "Recordings", icon: Video, color: "purple" },
  resource: { title: "Resources", icon: BookOpen, color: "amber" },
}

interface WebinarContentDisplayProps {
  webinarId: string
  variant?: "full" | "compact"
  className?: string
}

export function WebinarContentDisplay({ webinarId, variant = "full", className = "" }: WebinarContentDisplayProps) {
  const [content, setContent] = useState<WebinarContent[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContent() {
      setLoading(true)
      const result = await getWebinarContentForUser(webinarId)
      if (result.success) {
        setContent(result.content || [])
        setHasAccess(result.hasAccess)
      }
      setLoading(false)
    }
    fetchContent()
  }, [webinarId])

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (content.length === 0) {
    return null // No content to display
  }

  // Group content by type
  const contentByType = content.reduce(
    (acc, item) => {
      if (!acc[item.content_type]) {
        acc[item.content_type] = []
      }
      acc[item.content_type].push(item)
      return acc
    },
    {} as Record<ContentType, WebinarContent[]>,
  )

  if (variant === "compact") {
    return (
      <div className={`space-y-3 ${className}`}>
        {(Object.keys(SECTION_CONFIG) as ContentType[]).map((type) => {
          const items = contentByType[type]
          if (!items || items.length === 0) return null

          return (
            <div key={type} className="flex flex-wrap gap-2">
              {items.map((item) => (
                <ContentButton key={item.id} item={item} hasAccess={hasAccess} size="sm" />
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {(Object.keys(SECTION_CONFIG) as ContentType[]).map((type) => {
        const items = contentByType[type]
        if (!items || items.length === 0) return null

        const config = SECTION_CONFIG[type]
        const Icon = config.icon

        return (
          <div
            key={type}
            className={`bg-gradient-to-r from-${config.color}-50 to-${config.color}-50/50 rounded-xl p-5 border border-${config.color}-100`}
          >
            <h3 className={`font-semibold mb-4 flex items-center gap-2 text-${config.color}-700`}>
              <Icon className="w-5 h-5" />
              {config.title}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <ContentItem key={item.id} item={item} hasAccess={hasAccess} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Individual content item display
function ContentItem({ item, hasAccess }: { item: WebinarContent; hasAccess: boolean }) {
  const fileConfig = FILE_TYPE_CONFIG[item.file_type || "link"] || FILE_TYPE_CONFIG.link
  const canAccess = hasAccess || item.is_public

  const getButtonLabel = () => {
    switch (item.content_type) {
      case "link":
        return "Join"
      case "material":
        return "Download"
      case "recording":
        return "Watch"
      case "resource":
        return "View"
      default:
        return "Open"
    }
  }

  const getButtonIcon = () => {
    switch (item.content_type) {
      case "link":
        return ExternalLink
      case "material":
        return Download
      case "recording":
        return Play
      case "resource":
        return ExternalLink
      default:
        return ExternalLink
    }
  }

  const ButtonIcon = getButtonIcon()

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-white/80 rounded-lg border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{item.title}</p>
          <Badge variant="outline" className="text-xs shrink-0">
            {fileConfig.label}
          </Badge>
          {item.file_size && (
            <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(item.file_size)}</span>
          )}
        </div>
        {item.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>}
      </div>
      {canAccess ? (
        <Button size="sm" asChild className="shrink-0">
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ButtonIcon className="w-4 h-4 mr-1" />
            {getButtonLabel()}
          </a>
        </Button>
      ) : (
        <Button size="sm" variant="secondary" disabled className="shrink-0">
          <Lock className="w-4 h-4 mr-1" />
          Locked
        </Button>
      )}
    </div>
  )
}

// Compact button for quick access
function ContentButton({
  item,
  hasAccess,
  size = "default",
}: {
  item: WebinarContent
  hasAccess: boolean
  size?: "default" | "sm"
}) {
  const canAccess = hasAccess || item.is_public

  const getButtonIcon = () => {
    switch (item.content_type) {
      case "link":
        return ExternalLink
      case "material":
        return Download
      case "recording":
        return Play
      case "resource":
        return ExternalLink
      default:
        return ExternalLink
    }
  }

  const ButtonIcon = getButtonIcon()

  if (!canAccess) {
    return (
      <Button size={size} variant="secondary" disabled>
        <Lock className="w-4 h-4 mr-1" />
        {item.title}
      </Button>
    )
  }

  return (
    <Button size={size} variant="outline" asChild>
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <ButtonIcon className="w-4 h-4 mr-1" />
        {item.title}
      </a>
    </Button>
  )
}

// Export for use in webinar detail pages
export function WebinarContentSection({
  webinarId,
  title,
  className = "",
}: {
  webinarId: string
  title?: string
  className?: string
}) {
  return (
    <div className={className}>
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      <WebinarContentDisplay webinarId={webinarId} />
    </div>
  )
}
