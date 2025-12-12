"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Search,
  GraduationCap,
  Wrench,
  Users,
  FileText,
  LinkIcon,
  Video,
  ExternalLink,
  Download,
  Building,
  DoorOpen,
} from "lucide-react"
import Link from "next/link"

interface EventResource {
  id: string
  event_id: string
  resource_type: string
  title: string
  description: string | null
  url: string
  file_type: string | null
  file_size: number | null
  is_public: boolean
  is_active: boolean
}

interface DBEventDetails {
  id: string
  slug: string
  title: string
  short_title: string
  event_type: string
  start_date: string | null
  end_date: string | null
  start_time: string | null
  end_time: string | null
  timezone: string | null
  location: string | null
  venue: string | null
  room: string | null
  description: string | null
}

interface MyEventsSearchProps {
  allEventItems: { order: any; item: any }[]
  dbEvents: DBEventDetails[]
  resources: EventResource[]
  fallbackEventDetails: Record<string, any>
}

function getEventIcon(type: string) {
  switch (type) {
    case "cpd":
      return GraduationCap
    case "workshop":
      return Wrench
    case "symposium":
      return Users
    default:
      return Calendar
  }
}

function getEventColorScheme(type: string) {
  switch (type) {
    case "cpd":
      return {
        gradient: "from-purple-600 to-purple-800",
        bg: "bg-purple-50",
        icon: "text-purple-600",
        badge: "bg-purple-100 text-purple-700",
      }
    case "workshop":
      return {
        gradient: "from-orange-500 to-orange-700",
        bg: "bg-orange-50",
        icon: "text-orange-600",
        badge: "bg-orange-100 text-orange-700",
      }
    case "symposium":
      return {
        gradient: "from-teal-600 to-teal-800",
        bg: "bg-teal-50",
        icon: "text-teal-600",
        badge: "bg-teal-100 text-teal-700",
      }
    default:
      return {
        gradient: "from-slate-600 to-slate-800",
        bg: "bg-slate-50",
        icon: "text-slate-600",
        badge: "bg-slate-100 text-slate-700",
      }
  }
}

function formatEventDate(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "TBA"
  const start = new Date(startDate)
  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }
  const end = new Date(endDate)
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`
  }
  return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
}

function formatEventTime(startTime: string | null, endTime: string | null, timezone: string | null): string {
  if (!startTime) return "TBA"
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    return `${hours}:${minutes}`
  }
  const tz = timezone || "WIB"
  if (!endTime) return `${formatTime(startTime)} ${tz}`
  return `${formatTime(startTime)} - ${formatTime(endTime)} ${tz}`
}

export function MyEventsSearch({ allEventItems, dbEvents, resources, fallbackEventDetails }: MyEventsSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  function getEventDetails(eventId: string) {
    const dbEvent = dbEvents.find((e) => e.slug === eventId)
    const fallback = fallbackEventDetails[eventId]

    if (dbEvent) {
      return {
        title: dbEvent.title || fallback?.title || eventId,
        shortTitle: dbEvent.short_title || fallback?.shortTitle || eventId,
        date: formatEventDate(dbEvent.start_date, dbEvent.end_date),
        time: formatEventTime(dbEvent.start_time, dbEvent.end_time, dbEvent.timezone),
        location: dbEvent.location || fallback?.location || "TBA",
        venue: dbEvent.venue || fallback?.venue || "TBA",
        room: dbEvent.room || "",
        type: (dbEvent.event_type || fallback?.type || "workshop") as "cpd" | "workshop" | "symposium",
        description: dbEvent.description || fallback?.description || "",
      }
    }

    return (
      fallback || {
        title: eventId,
        shortTitle: eventId,
        date: "TBA",
        time: "TBA",
        location: "TBA",
        venue: "TBA",
        room: "",
        type: "workshop" as const,
        description: "",
      }
    )
  }

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return allEventItems
    const query = searchQuery.toLowerCase()
    return allEventItems.filter(({ item }) => {
      const details = getEventDetails(item.event_id)
      return (
        details.title.toLowerCase().includes(query) ||
        details.shortTitle.toLowerCase().includes(query) ||
        item.event_label?.toLowerCase().includes(query)
      )
    })
  }, [allEventItems, searchQuery, dbEvents])

  return (
    <>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Event Cards */}
      <div className="space-y-6">
        {filteredItems.map(({ order, item }, index) => {
          const details = getEventDetails(item.event_id)
          const colors = getEventColorScheme(details.type)
          const EventIcon = getEventIcon(details.type)
          const eventResources = resources.filter((r) => r.event_id === item.event_id)
          const materials = eventResources.filter((r) => r.resource_type === "document")
          const links = eventResources.filter((r) => r.resource_type === "link")
          const videos = eventResources.filter((r) => r.resource_type === "video")

          return (
            <Card key={`${order.id}-${item.id}-${index}`} className="overflow-hidden shadow-lg">
              {/* Event Header */}
              <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-white/20 text-white border-white/30 mb-3">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Registered
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-balance">{details.shortTitle}</h2>
                    <p className="text-white/90 text-sm sm:text-base line-clamp-2">{details.title}</p>
                  </div>
                  <div className="shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                      <EventIcon className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Event Details Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                  <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                    <Calendar className={`w-5 h-5 ${colors.icon}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-semibold text-sm">{details.date}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                    <Clock className={`w-5 h-5 ${colors.icon}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-semibold text-sm">{details.time}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                    <MapPin className={`w-5 h-5 ${colors.icon}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-semibold text-sm">{details.location}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                    <Building className={`w-5 h-5 ${colors.icon}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Venue</p>
                      <p className="font-semibold text-sm">{details.venue}</p>
                    </div>
                  </div>
                  {details.room && (
                    <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                      <DoorOpen className={`w-5 h-5 ${colors.icon}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">Room</p>
                        <p className="font-semibold text-sm">{details.room}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resources Section */}
                {eventResources.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Event Resources
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Materials */}
                      {materials.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Materials ({materials.length})
                          </h4>
                          {materials.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                            >
                              <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                              <span className="text-sm truncate flex-1">{resource.title}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Links */}
                      {links.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Links ({links.length})
                          </h4>
                          {links.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                            >
                              <LinkIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                              <span className="text-sm truncate flex-1">{resource.title}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Videos */}
                      {videos.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            Videos ({videos.length})
                          </h4>
                          {videos.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                            >
                              <Video className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                              <span className="text-sm truncate flex-1">{resource.title}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/payment/order/${order.id}`}>View Order Details</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/venue">View Venue</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
