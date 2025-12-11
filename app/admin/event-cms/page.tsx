"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Users,
  FileText,
  ImageIcon,
  Link,
  Video,
  History,
  ChevronLeft,
  X,
  Star,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  duplicateEvent,
  getEventResources,
  createEventResource,
  updateEventResource,
  deleteEventResource,
  getEventSpeakers,
  createEventSpeaker,
  updateEventSpeaker,
  deleteEventSpeaker,
  getEventHistory,
  getEventStats,
} from "@/app/actions/event-cms"
import type {
  Event,
  EventResource,
  EventSpeaker,
  EventHistory,
  EventFilters,
  CreateEventInput,
  CreateResourceInput,
  CreateSpeakerInput,
  EventType,
  EventStatus,
  ResourceType,
  ParticipantPricing,
} from "@/lib/event-cms/types"
import { EVENT_TYPES, EVENT_STATUSES, RESOURCE_TYPES, SPEAKER_ROLES, PARTICIPANT_TYPES } from "@/lib/event-cms/types"

// Format date for display
function formatDate(date: string | undefined): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

// Format time for display
function formatTime(time: string | undefined): string {
  if (!time) return "-"
  return time.substring(0, 5)
}

// Get status badge color
function getStatusColor(status: EventStatus): string {
  const statusObj = EVENT_STATUSES.find((s) => s.value === status)
  return statusObj?.color || "bg-gray-100 text-gray-700"
}

// Resource type icon
function ResourceIcon({ type }: { type: ResourceType }) {
  switch (type) {
    case "document":
      return <FileText className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "link":
      return <Link className="h-4 w-4" />
    case "video":
      return <Video className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export default function EventCMSPage() {
  const router = useRouter()

  // State
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [resources, setResources] = useState<EventResource[]>([])
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([])
  const [history, setHistory] = useState<EventHistory[]>([])
  const [stats, setStats] = useState<{
    total: number
    byType: Record<string, number>
    byStatus: Record<string, number>
  }>({
    total: 0,
    byType: {},
    byStatus: {},
  })

  // UI State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [view, setView] = useState<"list" | "edit">("list")

  // Filters
  const [filters, setFilters] = useState<EventFilters>({})
  const [searchQuery, setSearchQuery] = useState("")

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResourceDialog, setShowResourceDialog] = useState(false)
  const [showSpeakerDialog, setShowSpeakerDialog] = useState(false)
  const [editingResource, setEditingResource] = useState<EventResource | null>(null)
  const [editingSpeaker, setEditingSpeaker] = useState<EventSpeaker | null>(null)

  // Form State
  const [formData, setFormData] = useState<CreateEventInput>({
    event_type: "webinar",
    title: "",
    status: "draft",
  })
  const [resourceForm, setResourceForm] = useState<CreateResourceInput>({
    event_id: "",
    resource_type: "document",
    title: "",
    url: "",
  })
  const [speakerForm, setSpeakerForm] = useState<CreateSpeakerInput>({
    event_id: "",
    name: "",
  })

  // Load events
  const loadEvents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getEvents({ ...filters, search: searchQuery })
    if (error) {
      setError(error)
    } else {
      setEvents(data)
    }
    setLoading(false)
  }, [filters, searchQuery])

  // Load stats
  const loadStats = useCallback(async () => {
    const data = await getEventStats()
    setStats(data)
  }, [])

  // Load event details
  const loadEventDetails = useCallback(async (eventId: string) => {
    const [eventRes, resourcesRes, speakersRes, historyRes] = await Promise.all([
      getEventById(eventId),
      getEventResources(eventId),
      getEventSpeakers(eventId),
      getEventHistory(eventId),
    ])

    if (eventRes.data) {
      setSelectedEvent(eventRes.data)
      setFormData({
        event_type: eventRes.data.event_type,
        title: eventRes.data.title,
        short_title: eventRes.data.short_title || "",
        slug: eventRes.data.slug,
        description: eventRes.data.description || "",
        short_description: eventRes.data.short_description || "",
        start_date: eventRes.data.start_date || "",
        end_date: eventRes.data.end_date || "",
        start_time: eventRes.data.start_time || "",
        end_time: eventRes.data.end_time || "",
        timezone: eventRes.data.timezone,
        location: eventRes.data.location || "",
        venue: eventRes.data.venue || "",
        address: eventRes.data.address || "",
        is_online: eventRes.data.is_online,
        online_url: eventRes.data.online_url || "",
        status: eventRes.data.status,
        is_featured: eventRes.data.is_featured,
        thumbnail_url: eventRes.data.thumbnail_url || "",
        hero_image_url: eventRes.data.hero_image_url || "",
        pricing: eventRes.data.pricing,
        settings: eventRes.data.settings,
        meta_title: eventRes.data.meta_title || "",
        meta_description: eventRes.data.meta_description || "",
      })
    }
    setResources(resourcesRes.data)
    setSpeakers(speakersRes.data)
    setHistory(historyRes.data)
  }, [])

  useEffect(() => {
    loadEvents()
    loadStats()
  }, [loadEvents, loadStats])

  // Handlers
  const handleCreateEvent = async () => {
    setSaving(true)
    setError(null)

    const { data, error } = await createEvent(formData)

    if (error) {
      setError(error)
    } else if (data) {
      setShowCreateDialog(false)
      setFormData({ event_type: "webinar", title: "", status: "draft" })
      loadEvents()
      loadStats()
      // Open the new event for editing
      setSelectedEvent(data)
      setView("edit")
      loadEventDetails(data.id)
    }
    setSaving(false)
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return

    setSaving(true)
    setError(null)

    const { error } = await updateEvent({ id: selectedEvent.id, ...formData })

    if (error) {
      setError(error)
    } else {
      loadEvents()
      loadEventDetails(selectedEvent.id)
    }
    setSaving(false)
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    setSaving(true)
    const { error } = await deleteEvent(selectedEvent.id)

    if (error) {
      setError(error)
    } else {
      setShowDeleteDialog(false)
      setView("list")
      setSelectedEvent(null)
      loadEvents()
      loadStats()
    }
    setSaving(false)
  }

  const handleDuplicateEvent = async (eventId: string) => {
    setSaving(true)
    const { data, error } = await duplicateEvent(eventId)

    if (error) {
      setError(error)
    } else if (data) {
      loadEvents()
      loadStats()
    }
    setSaving(false)
  }

  const handleSaveResource = async () => {
    if (!selectedEvent) return

    setSaving(true)
    setError(null)

    if (editingResource) {
      const { error } = await updateEventResource(editingResource.id, resourceForm)
      if (error) setError(error)
    } else {
      const { error } = await createEventResource({ ...resourceForm, event_id: selectedEvent.id })
      if (error) setError(error)
    }

    if (!error) {
      setShowResourceDialog(false)
      setEditingResource(null)
      setResourceForm({ event_id: "", resource_type: "document", title: "", url: "" })
      loadEventDetails(selectedEvent.id)
    }
    setSaving(false)
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!selectedEvent) return

    const { error } = await deleteEventResource(resourceId)
    if (error) {
      setError(error)
    } else {
      loadEventDetails(selectedEvent.id)
    }
  }

  const handleSaveSpeaker = async () => {
    if (!selectedEvent) return

    setSaving(true)
    setError(null)

    if (editingSpeaker) {
      const { error } = await updateEventSpeaker(editingSpeaker.id, speakerForm)
      if (error) setError(error)
    } else {
      const { error } = await createEventSpeaker({ ...speakerForm, event_id: selectedEvent.id })
      if (error) setError(error)
    }

    if (!error) {
      setShowSpeakerDialog(false)
      setEditingSpeaker(null)
      setSpeakerForm({ event_id: "", name: "" })
      loadEventDetails(selectedEvent.id)
    }
    setSaving(false)
  }

  const handleDeleteSpeaker = async (speakerId: string) => {
    if (!selectedEvent) return

    const { error } = await deleteEventSpeaker(speakerId)
    if (error) {
      setError(error)
    } else {
      loadEventDetails(selectedEvent.id)
    }
  }

  const openEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setView("edit")
    loadEventDetails(event.id)
  }

  const openEditResource = (resource: EventResource) => {
    setEditingResource(resource)
    setResourceForm({
      event_id: resource.event_id,
      resource_type: resource.resource_type,
      title: resource.title,
      description: resource.description || "",
      url: resource.url,
      file_type: resource.file_type || "",
      file_size: resource.file_size || 0,
      sort_order: resource.sort_order,
      is_public: resource.is_public,
    })
    setShowResourceDialog(true)
  }

  const openEditSpeaker = (speaker: EventSpeaker) => {
    setEditingSpeaker(speaker)
    setSpeakerForm({
      event_id: speaker.event_id,
      name: speaker.name,
      title: speaker.title || "",
      credentials: speaker.credentials || "",
      role: speaker.role || "",
      organization: speaker.organization || "",
      bio: speaker.bio || "",
      photo_url: speaker.photo_url || "",
      sort_order: speaker.sort_order,
    })
    setShowSpeakerDialog(true)
  }

  // Pricing handlers
  const addParticipantType = () => {
    const currentPricing = formData.pricing || { participant_types: [] }
    setFormData({
      ...formData,
      pricing: {
        ...currentPricing,
        participant_types: [
          ...currentPricing.participant_types,
          { type: "", label: "", early: 0, normal: 0, onsite: 0 },
        ],
      },
    })
  }

  const updateParticipantType = (index: number, field: keyof ParticipantPricing, value: string | number) => {
    const currentPricing = formData.pricing || { participant_types: [] }
    const updated = [...currentPricing.participant_types]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({
      ...formData,
      pricing: { ...currentPricing, participant_types: updated },
    })
  }

  const removeParticipantType = (index: number) => {
    const currentPricing = formData.pricing || { participant_types: [] }
    const updated = currentPricing.participant_types.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      pricing: { ...currentPricing, participant_types: updated },
    })
  }

  // LIST VIEW
  if (view === "list") {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Event CMS</h1>
            <p className="text-muted-foreground">Manage all events, resources, and speakers</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.byStatus.active || 0}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.byStatus.draft || 0}</div>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.byStatus.coming_soon || 0}</div>
              <p className="text-xs text-muted-foreground">Coming Soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={filters.event_type || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, event_type: v === "all" ? undefined : (v as EventType) })
                }
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status || "all"}
                onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? undefined : (v as EventStatus) })}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {EVENT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadEvents}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Events Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No events found. Create your first event to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {event.is_featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">{event.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{EVENT_TYPES.find((t) => t.value === event.event_type)?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.start_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(event.status)}>
                          {EVENT_STATUSES.find((s) => s.value === event.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditEvent(event)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/events/${event.slug}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Page
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateEvent(event.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedEvent(event)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Event Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Enter the basic details to create a new event.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(v) => setFormData({ ...formData, event_type: v as EventType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea
                  value={formData.short_description || ""}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brief description of the event"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} disabled={saving || !formData.title}>
                {saving ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedEvent?.title}"? This action can be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteEvent} disabled={saving}>
                {saving ? "Deleting..." : "Delete Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // EDIT VIEW
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView("list")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{selectedEvent?.title || "Edit Event"}</h1>
          <p className="text-muted-foreground">
            {selectedEvent?.slug} • {EVENT_TYPES.find((t) => t.value === selectedEvent?.event_type)?.label}
          </p>
        </div>
        <Badge className={getStatusColor(selectedEvent?.status || "draft")}>
          {EVENT_STATUSES.find((s) => s.value === selectedEvent?.status)?.label}
        </Badge>
        <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button onClick={handleUpdateEvent} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="datetime">Date & Time</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
          <TabsTrigger value="speakers">Speakers ({speakers.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Basic information about the event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(v) => setFormData({ ...formData, event_type: v as EventType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as EventStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Short Title</Label>
                  <Input
                    value={formData.short_title || ""}
                    onChange={(e) => setFormData({ ...formData, short_title: e.target.value })}
                    placeholder="Abbreviated title for menus"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  <Input
                    value={formData.slug || ""}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="event-url-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea
                  value={formData.short_description || ""}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brief summary for cards and previews"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Complete event description with details"
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_featured || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label>Featured Event</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Thumbnail URL</Label>
                  <Input
                    value={formData.thumbnail_url || ""}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Image URL</Label>
                  <Input
                    value={formData.hero_image_url || ""}
                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Date & Time Tab */}
        <TabsContent value="datetime">
          <Card>
            <CardHeader>
              <CardTitle>Date & Time</CardTitle>
              <CardDescription>When the event takes place</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date || ""}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.start_time || ""}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.end_time || ""}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={formData.timezone || "Asia/Jakarta"}
                    onValueChange={(v) => setFormData({ ...formData, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Jakarta">WIB (Jakarta)</SelectItem>
                      <SelectItem value="Asia/Makassar">WITA (Makassar)</SelectItem>
                      <SelectItem value="Asia/Jayapura">WIT (Jayapura)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Where the event takes place</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_online || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
                />
                <Label>Online Event</Label>
              </div>

              {formData.is_online && (
                <div className="space-y-2">
                  <Label>Online URL (Zoom, Meet, etc.)</Label>
                  <Input
                    value={formData.online_url || ""}
                    onChange={(e) => setFormData({ ...formData, online_url: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Bali, Indonesia"
                />
              </div>

              <div className="space-y-2">
                <Label>Venue</Label>
                <Input
                  value={formData.venue || ""}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="e.g., Grand Ballroom, Hotel XYZ"
                />
              </div>

              <div className="space-y-2">
                <Label>Full Address</Label>
                <Textarea
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete street address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Set pricing for different participant types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {(formData.pricing?.participant_types || []).map((pt, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Participant Type {index + 1}</h4>
                      <Button variant="ghost" size="icon" onClick={() => removeParticipantType(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type ID</Label>
                        <Select value={pt.type} onValueChange={(v) => updateParticipantType(index, "type", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {PARTICIPANT_TYPES.map((type) => (
                              <SelectItem key={type.type} value={type.type}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Display Label</Label>
                        <Input
                          value={pt.label}
                          onChange={(e) => updateParticipantType(index, "label", e.target.value)}
                          placeholder="e.g., Specialist Doctor"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Early Bird Price (Rp)</Label>
                        <Input
                          type="number"
                          value={pt.early || 0}
                          onChange={(e) => updateParticipantType(index, "early", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Normal Price (Rp)</Label>
                        <Input
                          type="number"
                          value={pt.normal || 0}
                          onChange={(e) => updateParticipantType(index, "normal", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Onsite Price (Rp)</Label>
                        <Input
                          type="number"
                          value={pt.onsite || 0}
                          onChange={(e) => updateParticipantType(index, "onsite", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addParticipantType}>
                <Plus className="h-4 w-4 mr-2" />
                Add Participant Type
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Documents, links, videos, and other materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resources.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No resources added yet.</p>
                ) : (
                  resources.map((resource) => (
                    <div key={resource.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-muted rounded">
                        <ResourceIcon type={resource.resource_type} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{resource.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{resource.url}</div>
                      </div>
                      <Badge variant={resource.is_public ? "default" : "secondary"}>
                        {resource.is_public ? "Public" : "Private"}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openEditResource(resource)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteResource(resource.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => {
                  setEditingResource(null)
                  setResourceForm({ event_id: "", resource_type: "document", title: "", url: "" })
                  setShowResourceDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Speakers Tab */}
        <TabsContent value="speakers">
          <Card>
            <CardHeader>
              <CardTitle>Speakers</CardTitle>
              <CardDescription>Presenters, moderators, and panelists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {speakers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No speakers added yet.</p>
                ) : (
                  speakers.map((speaker) => (
                    <div key={speaker.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {speaker.title} {speaker.name}
                          {speaker.credentials && (
                            <span className="text-muted-foreground">, {speaker.credentials}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {speaker.role} • {speaker.organization}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEditSpeaker(speaker)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSpeaker(speaker.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => {
                  setEditingSpeaker(null)
                  setSpeakerForm({ event_id: "", name: "" })
                  setShowSpeakerDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Speaker
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings & SEO</CardTitle>
              <CardDescription>Additional configuration and search optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Meta Title (SEO)</Label>
                <Input
                  value={formData.meta_title || ""}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Custom page title for search engines"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description (SEO)</Label>
                <Textarea
                  value={formData.meta_description || ""}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Description shown in search results"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
              <CardDescription>Track all modifications to this event</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No history records yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((record) => (
                    <div key={record.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="p-2 bg-muted rounded">
                        <History className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              record.action === "created"
                                ? "default"
                                : record.action === "deleted"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {record.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">by {record.changed_by_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(record.changed_at).toLocaleString("id-ID")}
                        </div>
                        {Object.keys(record.changes).length > 0 && (
                          <div className="mt-2 text-sm">
                            {Object.entries(record.changes).map(([field, { old: oldVal, new: newVal }]) => (
                              <div key={field} className="text-muted-foreground">
                                <span className="font-medium">{field}:</span>{" "}
                                {oldVal !== null && <span className="line-through">{String(oldVal)}</span>}{" "}
                                {newVal !== null && <span className="text-foreground">{String(newVal)}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resource Dialog */}
      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resource Type</Label>
              <Select
                value={resourceForm.resource_type}
                onValueChange={(v) => setResourceForm({ ...resourceForm, resource_type: v as ResourceType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                placeholder="Resource title"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={resourceForm.description || ""}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={resourceForm.is_public || false}
                onCheckedChange={(checked) => setResourceForm({ ...resourceForm, is_public: checked })}
              />
              <Label>Public (visible to all)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResourceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveResource} disabled={saving || !resourceForm.title || !resourceForm.url}>
              {saving ? "Saving..." : "Save Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Speaker Dialog */}
      <Dialog open={showSpeakerDialog} onOpenChange={setShowSpeakerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSpeaker ? "Edit Speaker" : "Add Speaker"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={speakerForm.title || ""}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, title: e.target.value })}
                  placeholder="Dr., Prof., etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={speakerForm.name}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Credentials</Label>
                <Input
                  value={speakerForm.credentials || ""}
                  onChange={(e) => setSpeakerForm({ ...speakerForm, credentials: e.target.value })}
                  placeholder="MD, PhD, SpAn, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={speakerForm.role || ""}
                  onValueChange={(v) => setSpeakerForm({ ...speakerForm, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEAKER_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input
                value={speakerForm.organization || ""}
                onChange={(e) => setSpeakerForm({ ...speakerForm, organization: e.target.value })}
                placeholder="Hospital, University, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Bio (optional)</Label>
              <Textarea
                value={speakerForm.bio || ""}
                onChange={(e) => setSpeakerForm({ ...speakerForm, bio: e.target.value })}
                placeholder="Brief biography"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Photo URL (optional)</Label>
              <Input
                value={speakerForm.photo_url || ""}
                onChange={(e) => setSpeakerForm({ ...speakerForm, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSpeakerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSpeaker} disabled={saving || !speakerForm.name}>
              {saving ? "Saving..." : "Save Speaker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action can be undone from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent} disabled={saving}>
              {saving ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
