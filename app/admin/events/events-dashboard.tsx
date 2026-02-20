"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Filter,
  Grid3X3,
  List,
  ExternalLink,
  Edit2,
  Gift,
  Ticket,
  Building,
  DoorOpen,
  FileText,
  LinkIcon,
  Video,
  Download,
  GraduationCap,
  Wrench,
  Presentation,
  Mic,
  Image,
} from "lucide-react"
import Link from "next/link"
import { eventPricingData } from "@/lib/data/event-pricing"
import { WEBINARS, formatWebinarDate } from "@/lib/data/webinars"

// ── Types ────────────────────────────────────────────────────────────

interface EventResource {
  id: string
  event_id: string
  resource_type: "document" | "link" | "video" | "image"
  title: string
  description: string | null
  url: string
  file_type: string | null
  file_size: number | null
  sort_order: number
  is_public: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DBEvent {
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

interface WebinarContentItem {
  id: string
  webinar_id: string
  content_type: "link" | "material" | "recording" | "resource"
  title: string
  description: string | null
  url: string
  file_type: string | null
  file_size: number | null
  sort_order: number
  is_public: boolean
  is_active: boolean
}

interface WebinarSpeakerInfo {
  name: string
  topic: string
  organization: string
}

interface MergedEvent {
  id: string
  slug: string
  label: string
  shortLabel: string
  date: string
  time: string
  location: string
  venue: string
  room: string
  description: string
  type: "cpd" | "workshop" | "symposium" | "webinar"
  source: "db" | "static"
  participantCount: number
  dbUuid: string | null
  resources: EventResource[]
  webinarContent: WebinarContentItem[]
  speakers: WebinarSpeakerInfo[]
}

// ── Static events from CMS (same as event-cms-client.tsx) ────────────

const STATIC_EVENTS = [
  { id: "cpd", slug: "cpd", title: "CPD (Continuing Professional Development) Courses", short_title: "CPD Courses", event_type: "cpd" },
  { id: "ws1", slug: "ws1", title: "WS 1 (Regenerative Pain Therapy)", short_title: "Regenerative Pain Therapy", event_type: "workshop" },
  { id: "ws2", slug: "ws2", title: "WS 2 (Basic Interventional Pain Management)", short_title: "Basic Interventional Pain", event_type: "workshop" },
  { id: "ws3", slug: "ws3", title: "WS 3 (Pediatric Essential Pain Management)", short_title: "Pediatric Pain Management", event_type: "workshop" },
  { id: "ws4", slug: "ws4", title: "WS 4 (Adjunct Therapy for Pain Management)", short_title: "Adjunct Therapy", event_type: "workshop" },
  { id: "ws5", slug: "ws5", title: "WS 5 (Developing a Pain Clinic)", short_title: "Developing a Pain Clinic", event_type: "workshop" },
  { id: "ws6", slug: "ws6", title: "WS 6 (Cancer Pain)", short_title: "Cancer Pain", event_type: "workshop" },
  { id: "ws7", slug: "ws7", title: "WS 7 (Advanced Intervention of Pain Management)", short_title: "Advanced Intervention", event_type: "workshop" },
  { id: "symposium", slug: "symposium", title: "ISAPM 8th National Meeting Symposium", short_title: "Symposium", event_type: "symposium" },
]

// ── Helpers ──────────────────────────────────────────────────────────

function getEventType(eventId: string): "cpd" | "workshop" | "symposium" | "webinar" {
  const id = eventId?.toLowerCase()
  if (id === "cpd") return "cpd"
  if (id === "symposium") return "symposium"
  if (id?.startsWith("ws")) return "workshop"
  if (id?.startsWith("webinar")) return "webinar"
  return "workshop"
}

function getEventIcon(type: string) {
  switch (type) {
    case "cpd": return GraduationCap
    case "workshop": return Wrench
    case "symposium": return Users
    case "webinar": return Calendar
    default: return Calendar
  }
}

function getEventColorScheme(type: string) {
  switch (type) {
    case "cpd":
      return { gradient: "from-purple-600 to-purple-800", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700", border: "border-purple-200", icon: "text-purple-600" }
    case "workshop":
      return { gradient: "from-orange-500 to-orange-700", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700", border: "border-orange-200", icon: "text-orange-600" }
    case "symposium":
      return { gradient: "from-teal-600 to-teal-800", bg: "bg-teal-50", badge: "bg-teal-100 text-teal-700", border: "border-teal-200", icon: "text-teal-600" }
    case "webinar":
      return { gradient: "from-green-600 to-green-800", bg: "bg-green-50", badge: "bg-green-100 text-green-700", border: "border-green-200", icon: "text-green-600" }
    default:
      return { gradient: "from-slate-600 to-slate-800", bg: "bg-slate-50", badge: "bg-slate-100 text-slate-700", border: "border-slate-200", icon: "text-slate-600" }
  }
}

function formatEventDate(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "TBA"
  const start = new Date(startDate)
  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  }
  const end = new Date(endDate)
  const startDay = start.toLocaleDateString("en-US", { weekday: "long" })
  const endDay = end.toLocaleDateString("en-US", { weekday: "long" })
  if (start.getMonth() === end.getMonth()) {
    return `${startDay} - ${endDay}, ${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`
  }
  return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
}

function formatEventTime(startTime: string | null, endTime: string | null, timezone: string | null): string {
  if (!startTime) return "TBA"
  const formatTime = (t: string) => {
    const [h, m] = t.split(":")
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }
  const tz = timezone || "WIB (UTC+7)"
  if (!endTime) return `${formatTime(startTime)} ${tz}`
  return `${formatTime(startTime)} - ${formatTime(endTime)} ${tz}`
}

// ── Component ────────────────────────────────────────────────────────

export function EventsDashboard() {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState("name")
  const [dbEvents, setDbEvents] = useState<DBEvent[]>([])
  const [resources, setResources] = useState<EventResource[]>([])
  const [webinarContent, setWebinarContent] = useState<WebinarContentItem[]>([])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Fetch all DB events
      const { data: eventsData } = await supabase.from("events").select("*")
      setDbEvents(eventsData || [])

      // Fetch all active resources
      if (eventsData && eventsData.length > 0) {
        const eventUuids = eventsData.map((e: DBEvent) => e.id)
        const { data: resourcesData } = await supabase
          .from("event_resources")
          .select("*")
          .in("event_id", eventUuids)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
        setResources(resourcesData || [])
      } else {
        setResources([])
      }

      // Fetch webinar content from webinar_content table
      const { data: webinarContentData } = await supabase
        .from("webinar_content")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
      setWebinarContent(webinarContentData || [])
    } catch (error) {
      console.error("Error loading events:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()

    // Subscribe to real-time updates
    const eventsChannel = supabase
      .channel("admin-events-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        loadData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_resources" }, () => {
        loadData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "webinar_content" }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      eventsChannel.unsubscribe()
    }
  }, [loadData, supabase])

  // Merge static pricing data + STATIC_EVENTS + DB data
  const mergedEvents = useMemo<MergedEvent[]>(() => {
    const result: MergedEvent[] = []
    const processedIds = new Set<string>()

    // Process all events from eventPricingData (includes webinars)
    for (const pricing of eventPricingData) {
      const eventId = pricing.id
      processedIds.add(eventId)

      const staticMeta = STATIC_EVENTS.find((se) => se.id === eventId)
      const dbEvent = dbEvents.find((db) => db.slug === eventId)
      const eventType = getEventType(eventId)

      const dbUuid = dbEvent?.id || null
      const eventResources = dbUuid ? resources.filter((r) => r.event_id === dbUuid) : []

      // Enrich webinar events with WEBINARS static config data
      const webinarData = WEBINARS.find((w) => w.id === eventId)
      const webinarItems = webinarData ? webinarContent.filter((wc) => wc.webinar_id === webinarData.id) : []
      const speakers: WebinarSpeakerInfo[] = webinarData
        ? webinarData.speakers.map((s) => ({ name: s.name, topic: s.topic, organization: s.organization }))
        : []

      // For webinars: use DB data > webinar static config > pricing data > fallback
      let date = pricing.date
      let time = "TBA"
      let description = ""
      let location = "TBA"
      let venue = "TBA"

      if (dbEvent) {
        date = formatEventDate(dbEvent.start_date, dbEvent.end_date)
        time = formatEventTime(dbEvent.start_time, dbEvent.end_time, dbEvent.timezone)
        description = dbEvent.description || ""
        location = dbEvent.location || "TBA"
        venue = dbEvent.venue || "TBA"
      } else if (webinarData) {
        date = formatWebinarDate(webinarData.date)
        time = `${webinarData.time} ${webinarData.timezone}`
        description = webinarData.description
        location = "Online"
        venue = "Zoom Webinar"
      }

      // If DB has empty fields but webinar static has values, fill from webinar
      if (dbEvent && webinarData) {
        if (!dbEvent.description && webinarData.description) description = webinarData.description
        if (date === "TBA" && webinarData.date) date = formatWebinarDate(webinarData.date)
        if (time === "TBA" && webinarData.time) time = `${webinarData.time} ${webinarData.timezone}`
      }

      result.push({
        id: eventId,
        slug: eventId,
        label: dbEvent?.title || staticMeta?.title || pricing.label,
        shortLabel: dbEvent?.short_title || staticMeta?.short_title || pricing.shortLabel || pricing.label,
        date,
        time,
        location,
        venue,
        room: dbEvent?.room || "",
        description,
        type: eventType,
        source: dbEvent ? "db" : "static",
        participantCount: pricing.participantTypes?.length || 0,
        dbUuid,
        resources: eventResources,
        webinarContent: webinarItems,
        speakers,
      })
    }

    // Process STATIC_EVENTS not already in pricing data (e.g. if any were missing)
    for (const se of STATIC_EVENTS) {
      if (processedIds.has(se.id)) continue
      processedIds.add(se.id)

      const dbEvent = dbEvents.find((db) => db.slug === se.id)
      const dbUuid = dbEvent?.id || null
      const eventResources = dbUuid ? resources.filter((r) => r.event_id === dbUuid) : []

      result.push({
        id: se.id,
        slug: se.slug,
        label: dbEvent?.title || se.title,
        shortLabel: dbEvent?.short_title || se.short_title,
        date: dbEvent ? formatEventDate(dbEvent.start_date, dbEvent.end_date) : "TBA",
        time: dbEvent ? formatEventTime(dbEvent.start_time, dbEvent.end_time, dbEvent.timezone) : "TBA",
        location: dbEvent?.location || "TBA",
        venue: dbEvent?.venue || "TBA",
        room: dbEvent?.room || "",
        description: dbEvent?.description || "",
        type: getEventType(se.id),
        source: dbEvent ? "db" : "static",
        participantCount: 0,
        dbUuid,
        resources: eventResources,
        webinarContent: [],
        speakers: [],
      })
    }

    return result
  }, [dbEvents, resources, webinarContent])

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = mergedEvents.filter((event) => {
      const matchesSearch =
        event.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.shortLabel?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === "all" || event.type === filterType
      return matchesSearch && matchesType
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "type":
          return a.type.localeCompare(b.type)
        case "date":
          return a.date.localeCompare(b.date)
        case "recent":
          return b.date.localeCompare(a.date)
        default:
          return a.label.localeCompare(b.label)
      }
    })

    return filtered
  }, [mergedEvents, searchTerm, filterType, sortBy])

  // Stats
  const stats = useMemo(() => ({
    total: mergedEvents.length,
    cpd: mergedEvents.filter((e) => e.type === "cpd").length,
    workshop: mergedEvents.filter((e) => e.type === "workshop").length,
    symposium: mergedEvents.filter((e) => e.type === "symposium").length,
    webinar: mergedEvents.filter((e) => e.type === "webinar").length,
    dbSynced: mergedEvents.filter((e) => e.source === "db").length,
    totalResources: resources.length,
  }), [mergedEvents, resources])

  const getEventCMSLink = (eventId: string) => `/admin/event-cms?edit=${eventId}`

  return (
    <div className="space-y-6 pt-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive view of all symposium events and workshops — synced with Event CMS
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.cpd}</p>
              <p className="text-xs text-muted-foreground mt-1">CPD Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.workshop}</p>
              <p className="text-xs text-muted-foreground mt-1">Workshops</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-600">{stats.symposium}</p>
              <p className="text-xs text-muted-foreground mt-1">Symposiums</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.webinar}</p>
              <p className="text-xs text-muted-foreground mt-1">Webinars</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-sky-600">{stats.dbSynced}</p>
              <p className="text-xs text-muted-foreground mt-1">DB Synced</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-rose-600">{stats.totalResources}</p>
              <p className="text-xs text-muted-foreground mt-1">Resources</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter & Search
            </h2>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cpd">CPD Courses</SelectItem>
                <SelectItem value="workshop">Workshops</SelectItem>
                <SelectItem value="symposium">Symposium</SelectItem>
                <SelectItem value="webinar">Webinars</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="date">Date (Earliest)</SelectItem>
                <SelectItem value="recent">Date (Recent)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || filterType !== "all" ? "No events found matching your filters" : "No events available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
          {filteredEvents.map((event) => {
            const colors = getEventColorScheme(event.type)
            const EventIcon = getEventIcon(event.type)
            const materials = event.resources.filter((r) => r.resource_type === "document")
            const links = event.resources.filter((r) => r.resource_type === "link")
            const videos = event.resources.filter((r) => r.resource_type === "video")

            if (viewMode === "list") {
              return (
                <Card key={event.id} className={`border ${colors.border}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <EventIcon className={`w-6 h-6 ${colors.icon}`} />
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-2">{event.label}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`${colors.badge} text-xs`}>{event.type.toUpperCase()}</Badge>
                              {event.source === "db" && (
                                <Badge variant="outline" className="text-xs text-sky-600 border-sky-200">Synced</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="line-clamp-1">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>{event.resources.length} resources</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={getEventCMSLink(event.id)}>
                          <Edit2 className="w-4 h-4 mr-1" /> Edit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            // Grid card — matches my-events format
            return (
              <Card key={event.id} className="overflow-hidden shadow-lg">
                <CardHeader className={`bg-gradient-to-r ${colors.gradient} p-6 text-white`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className="bg-white/20 text-white border-white/30">
                          <Edit2 className="w-3 h-3 mr-1" />
                          Admin View
                        </Badge>
                        {event.source === "db" ? (
                          <Badge className="bg-white/20 text-white border-white/30">DB Synced</Badge>
                        ) : (
                          <Badge className="bg-white/10 text-white/70 border-white/20">Static Only</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl sm:text-2xl font-bold mb-2 text-balance">
                        {event.shortLabel}
                      </CardTitle>
                      <p className="text-white/90 text-sm sm:text-base line-clamp-2">{event.label}</p>
                    </div>
                    <div className="shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                        <EventIcon className="w-8 h-8" />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Detail pills — same 5-column layout as my-events */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                    <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                      <Calendar className={`w-5 h-5 ${colors.icon} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-semibold text-sm truncate">{event.date}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                      <Clock className={`w-5 h-5 ${colors.icon} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="font-semibold text-sm truncate">{event.time}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                      <MapPin className={`w-5 h-5 ${colors.icon} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-semibold text-sm truncate">{event.location}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                      <Building className={`w-5 h-5 ${colors.icon} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Venue</p>
                        <p className="font-semibold text-sm truncate">{event.venue}</p>
                      </div>
                    </div>
                    {event.room && (
                      <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                        <DoorOpen className={`w-5 h-5 ${colors.icon} shrink-0`} />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Room</p>
                          <p className="font-semibold text-sm truncate">{event.room}</p>
                        </div>
                      </div>
                    )}
                    <div className={`flex items-center gap-3 p-4 ${colors.bg} rounded-xl`}>
                      <Users className={`w-5 h-5 ${colors.icon} shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Participant Types</p>
                        <p className="font-semibold text-sm">{event.participantCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {event.description ? (
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-700 italic">
                        No description yet. Edit in CMS to add event details.
                      </p>
                    </div>
                  )}

                  {/* Speakers section — webinar only */}
                  {event.type === "webinar" && event.speakers.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Mic className="w-4 h-4" /> Speakers
                      </h3>
                      <div className="space-y-2">
                        {event.speakers.map((speaker, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 border rounded-lg bg-slate-50"
                          >
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <Mic className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{speaker.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{speaker.organization}</p>
                              <p className="text-xs text-green-700 mt-0.5 line-clamp-2">{speaker.topic}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Webinar Content section — links, materials, recordings from webinar_content table */}
                  {event.type === "webinar" && event.webinarContent.length > 0 && (
                    <div className="space-y-4 mb-6">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Presentation className="w-4 h-4" /> Webinar Content
                      </h3>

                      {(() => {
                        const wcLinks = event.webinarContent.filter((c) => c.content_type === "link")
                        const wcMaterials = event.webinarContent.filter((c) => c.content_type === "material")
                        const wcRecordings = event.webinarContent.filter((c) => c.content_type === "recording")
                        const wcResources = event.webinarContent.filter((c) => c.content_type === "resource")
                        return (
                          <>
                            {wcLinks.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <LinkIcon className="w-4 h-4" /> Links ({wcLinks.length})
                                </h4>
                                <div className="space-y-2">
                                  {wcLinks.map((item) => (
                                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                                      <ExternalLink className="w-4 h-4 text-green-600" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium block truncate">{item.title}</span>
                                        {item.description && <span className="text-xs text-muted-foreground block truncate">{item.description}</span>}
                                      </div>
                                      {item.is_public && <Badge variant="outline" className="text-xs shrink-0 text-green-600 border-green-200">Public</Badge>}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {wcMaterials.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" /> Materials ({wcMaterials.length})
                                </h4>
                                <div className="space-y-2">
                                  {wcMaterials.map((item) => (
                                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                                      <Download className="w-4 h-4 text-green-600" />
                                      <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
                                      {item.file_type && <Badge variant="outline" className="text-xs shrink-0">{item.file_type.toUpperCase()}</Badge>}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {wcRecordings.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <Video className="w-4 h-4" /> Recordings ({wcRecordings.length})
                                </h4>
                                <div className="space-y-2">
                                  {wcRecordings.map((item) => (
                                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                                      <Video className="w-4 h-4 text-green-600" />
                                      <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {wcResources.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" /> Resources ({wcResources.length})
                                </h4>
                                <div className="space-y-2">
                                  {wcResources.map((item) => (
                                    <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border rounded-lg hover:bg-green-50 transition-colors">
                                      <ExternalLink className="w-4 h-4 text-green-600" />
                                      <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Resources section — same as my-events */}
                  {event.resources.length > 0 && (
                    <div className="space-y-4 mb-6">
                      <h3 className="font-semibold text-foreground">Event Resources</h3>

                      {materials.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Materials
                          </h4>
                          <div className="space-y-2">
                            {materials.map((resource) => (
                              <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <Download className="w-4 h-4 text-muted-foreground" />
                                <span className="flex-1 text-sm font-medium">{resource.title}</span>
                                {resource.file_type && (
                                  <Badge variant="outline" className="text-xs">{resource.file_type.toUpperCase()}</Badge>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {links.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> Links
                          </h4>
                          <div className="space-y-2">
                            {links.map((resource) => (
                              <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                <span className="flex-1 text-sm font-medium">{resource.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {videos.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Video className="w-4 h-4" /> Videos
                          </h4>
                          <div className="space-y-2">
                            {videos.map((resource) => (
                              <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <Video className="w-4 h-4 text-muted-foreground" />
                                <span className="flex-1 text-sm font-medium">{resource.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {event.resources.length === 0 && event.webinarContent.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground mb-4">
                      <FileText className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">No resources available yet.</p>
                    </div>
                  )}

                  {/* Admin actions */}
                  <div className={`flex gap-3 ${event.type === "webinar" ? "flex-col sm:flex-row" : ""}`}>
                    <Button asChild className={event.type === "webinar" ? "flex-1" : "w-full"}>
                      <Link href={getEventCMSLink(event.id)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit in CMS
                      </Link>
                    </Button>
                    {event.type === "webinar" && (
                      <Button asChild variant="outline" className="flex-1 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800">
                        <Link href={`/admin/webinar-cms?webinar=${event.id}`}>
                          <Presentation className="w-4 h-4 mr-2" />
                          Manage Webinar Content
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Results Summary */}
      {filteredEvents.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredEvents.length} of {mergedEvents.length} events
          {stats.dbSynced > 0 && ` (${stats.dbSynced} synced from database)`}
        </div>
      )}
    </div>
  )
}
