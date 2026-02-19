"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Calendar, MapPin, Clock, Users, Filter, Grid3X3, List, ExternalLink, Edit2 } from "lucide-react"
import Link from "next/link"
import { eventPricingData } from "@/lib/data/event-pricing"

interface EventData {
  id: string
  label: string
  shortLabel?: string
  date: string
  type: "cpd" | "workshop" | "symposium" | "webinar"
  source: "db" | "static"
  participantCount?: number
  resourceCount?: number
}

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
    case "cpd":
      return "🎓"
    case "workshop":
      return "🛠️"
    case "symposium":
      return "👥"
    case "webinar":
      return "🎥"
    default:
      return "📅"
  }
}

function getEventColorScheme(type: string) {
  switch (type) {
    case "cpd":
      return {
        gradient: "from-purple-600 to-purple-800",
        bg: "bg-purple-50",
        badge: "bg-purple-100 text-purple-800",
        border: "border-purple-200",
      }
    case "workshop":
      return {
        gradient: "from-blue-600 to-blue-800",
        bg: "bg-blue-50",
        badge: "bg-blue-100 text-blue-800",
        border: "border-blue-200",
      }
    case "symposium":
      return {
        gradient: "from-orange-600 to-orange-800",
        bg: "bg-orange-50",
        badge: "bg-orange-100 text-orange-800",
        border: "border-orange-200",
      }
    case "webinar":
      return {
        gradient: "from-green-600 to-green-800",
        bg: "bg-green-50",
        badge: "bg-green-100 text-green-800",
        border: "border-green-200",
      }
    default:
      return {
        gradient: "from-gray-600 to-gray-800",
        bg: "bg-gray-50",
        badge: "bg-gray-100 text-gray-800",
        border: "border-gray-200",
      }
  }
}

export function EventsDashboard() {
  const supabase = createClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [events, setEvents] = useState<EventData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState("name")

  // Load events from static data
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true)

        // Convert pricing data to event format
        const staticEvents: EventData[] = eventPricingData.map((event) => ({
          id: event.id,
          label: event.label,
          shortLabel: event.shortLabel,
          date: event.date,
          type: getEventType(event.id),
          source: "static",
          participantCount: event.participantTypes?.length || 0,
          resourceCount: 0,
        }))

        setEvents(staticEvents)
      } catch (error) {
        console.error("Error loading events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()

    // Subscribe to real-time updates (optional - for future DB integration)
    const channel = supabase
      .channel("events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        loadEvents()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = events.filter((event) => {
      const matchesSearch =
        event.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.shortLabel?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === "all" || event.type === filterType

      return matchesSearch && matchesType
    })

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "type":
          return a.type.localeCompare(b.type)
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "recent":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        default: // name
          return a.label.localeCompare(b.label)
      }
    })

    return filtered
  }, [events, searchTerm, filterType, sortBy])

  // Calculate summary stats
  const stats = useMemo(() => {
    return {
      total: events.length,
      cpd: events.filter((e) => e.type === "cpd").length,
      workshop: events.filter((e) => e.type === "workshop").length,
      symposium: events.filter((e) => e.type === "symposium").length,
      webinar: events.filter((e) => e.type === "webinar").length,
    }
  }, [events])

  const getEventCMSLink = (eventId: string) => {
    return `/admin/event-cms?edit=${eventId}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive view of all symposium events and workshops
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Events</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-600">{stats.cpd}</p>
              <p className="text-sm text-muted-foreground mt-1">CPD Courses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">{stats.workshop}</p>
              <p className="text-sm text-muted-foreground mt-1">Workshops</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-600">{stats.symposium}</p>
              <p className="text-sm text-muted-foreground mt-1">Symposiums</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{stats.webinar}</p>
              <p className="text-sm text-muted-foreground mt-1">Webinars</p>
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
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
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
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {filteredEvents.map((event) => {
            const colors = getEventColorScheme(event.type)
            const icon = getEventIcon(event.type)

            if (viewMode === "list") {
              return (
                <Card key={event.id} className={`border ${colors.border}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-2">{event.label}</h3>
                            <Badge className={`${colors.badge} text-xs mt-1`}>
                              {event.type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="line-clamp-1">{event.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{event.participantCount || 0} participant types</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={getEventCMSLink(event.id)}>
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            return (
              <Card
                key={event.id}
                className={`overflow-hidden border ${colors.border} hover:shadow-lg transition-shadow`}
              >
                <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                <CardHeader className={`${colors.bg} pb-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-3xl">{icon}</span>
                      <div className="flex-1">
                        <CardTitle className="text-sm leading-tight line-clamp-2">
                          {event.label}
                        </CardTitle>
                        {event.shortLabel && (
                          <CardDescription className="text-xs mt-1">{event.shortLabel}</CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge className={`${colors.badge} text-xs shrink-0`}>
                      {event.type.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Date */}
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{event.date}</span>
                  </div>

                  {/* Info Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className={`${colors.bg} rounded p-2 text-center`}>
                      <div className="text-lg font-bold text-foreground">{event.participantCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Participant Types</div>
                    </div>
                    <div className={`${colors.bg} rounded p-2 text-center`}>
                      <div className="text-lg font-bold text-foreground">{event.source === "db" ? "DB" : "Static"}</div>
                      <div className="text-xs text-muted-foreground">Source</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button asChild className="w-full mt-4" size="sm">
                    <Link href={getEventCMSLink(event.id)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Event
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Results Summary */}
      {filteredEvents.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      )}
    </div>
  )
}
