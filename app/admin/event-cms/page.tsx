"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  MapPin,
  FileText,
  LinkIcon,
  Video,
  ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  History,
  ExternalLink,
  Download,
  GraduationCap,
  Wrench,
  Users,
  Save,
  Building,
  DoorOpen,
} from "lucide-react"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

type ResourceType = "document" | "link" | "video" | "image"

interface EventResource {
  id: string
  event_id: string
  resource_type: ResourceType
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

interface EventHistory {
  id: string
  event_id: string
  action: string
  changes: Record<string, { old: string; new: string }>
  change_reason: string | null
  changed_by: string
  changed_at: string
}

interface EventDetails {
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
  room: string | null // Added room field
  description: string | null
}

// Static events list for selection
const STATIC_EVENTS = [
  {
    id: "cpd",
    slug: "cpd",
    title: "CPD (Continuing Professional Development) Courses",
    short_title: "CPD Courses",
    event_type: "cpd",
  },
  {
    id: "ws1",
    slug: "ws1",
    title: "WS 1 (Regenerative Pain Therapy)",
    short_title: "Regenerative Pain Therapy",
    event_type: "workshop",
  },
  {
    id: "ws2",
    slug: "ws2",
    title: "WS 2 (Basic Interventional Pain Management)",
    short_title: "Basic Interventional Pain",
    event_type: "workshop",
  },
  {
    id: "ws3",
    slug: "ws3",
    title: "WS 3 (Pediatric Essential Pain Management)",
    short_title: "Pediatric Pain Management",
    event_type: "workshop",
  },
  {
    id: "ws4",
    slug: "ws4",
    title: "WS 4 (Adjunct Therapy for Pain Management)",
    short_title: "Adjunct Therapy",
    event_type: "workshop",
  },
  {
    id: "ws5",
    slug: "ws5",
    title: "WS 5 (Developing a Pain Clinic)",
    short_title: "Developing a Pain Clinic",
    event_type: "workshop",
  },
  { id: "ws6", slug: "ws6", title: "WS 6 (Cancer Pain)", short_title: "Cancer Pain", event_type: "workshop" },
  {
    id: "ws7",
    slug: "ws7",
    title: "WS 7 (Advanced Intervention of Pain Management)",
    short_title: "Advanced Intervention",
    event_type: "workshop",
  },
  {
    id: "symposium",
    slug: "symposium",
    title: "ISAPM 8th National Meeting Symposium",
    short_title: "Symposium",
    event_type: "symposium",
  },
]

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

function getEventColor(type: string) {
  switch (type) {
    case "cpd":
      return "bg-purple-100 text-purple-700 border-purple-200"
    case "workshop":
      return "bg-orange-100 text-orange-700 border-orange-200"
    case "symposium":
      return "bg-teal-100 text-teal-700 border-teal-200"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

function getResourceIcon(type: ResourceType) {
  switch (type) {
    case "document":
      return FileText
    case "link":
      return LinkIcon
    case "video":
      return Video
    case "image":
      return ImageIcon
    default:
      return FileText
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatEventDate(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "TBA"
  const start = new Date(startDate)
  if (!endDate || startDate === endDate) {
    return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }
  const end = new Date(endDate)
  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })}-${end.getDate()}, ${end.getFullYear()}`
  }
  return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
}

function formatEventTime(startTime: string | null, endTime: string | null, timezone: string | null): string {
  if (!startTime) return "TBA"
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const h = Number.parseInt(hours)
    const ampm = h >= 12 ? "PM" : "AM"
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }
  const tz = timezone || "WIB"
  if (!endTime) return `${formatTime(startTime)} ${tz}`
  return `${formatTime(startTime)} - ${formatTime(endTime)} ${tz}`
}

export default function EventCMSPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>("cpd")
  const [resources, setResources] = useState<EventResource[]>([])
  const [history, setHistory] = useState<EventHistory[]>([])
  const [activeTab, setActiveTab] = useState<ResourceType | "details" | "history">("details")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<EventResource | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    file_type: "",
    file_size: 0,
    sort_order: 0,
    is_public: false,
  })

  const [detailsForm, setDetailsForm] = useState({
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    timezone: "WIB",
    location: "",
    venue: "",
    room: "", // Added room field
    description: "",
  })

  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)
  const [isSavingDetails, setIsSavingDetails] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  useEffect(() => {
    if (isAdmin && selectedEvent) {
      loadEventData()
    }
  }, [selectedEvent, isAdmin])

  async function checkAdminAndLoadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (profile?.role === "admin") {
        setIsAdmin(true)
        await loadEventData()
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadEventData() {
    try {
      const { data: eventData } = await supabase.from("events").select("*").eq("slug", selectedEvent).single()

      if (eventData) {
        setEventDetails(eventData)
        setDetailsForm({
          start_date: eventData.start_date || "",
          end_date: eventData.end_date || "",
          start_time: eventData.start_time || "",
          end_time: eventData.end_time || "",
          timezone: eventData.timezone || "WIB",
          location: eventData.location || "",
          venue: eventData.venue || "",
          room: eventData.room || "", // Load room from database
          description: eventData.description || "",
        })
      } else {
        // Reset form if no event data exists
        const staticEvent = STATIC_EVENTS.find((e) => e.slug === selectedEvent)
        setEventDetails(null)
        setDetailsForm({
          start_date: "",
          end_date: "",
          start_time: "",
          end_time: "",
          timezone: "WIB",
          location: "",
          venue: "",
          room: "", // Reset room field
          description: "",
        })
      }

      // Load resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from("event_resources")
        .select("*")
        .eq("event_id", selectedEvent)
        .order("sort_order", { ascending: true })

      if (resourcesError) throw resourcesError
      setResources(resourcesData || [])

      // Load history
      const { data: historyData } = await supabase
        .from("event_history")
        .select("*")
        .eq("event_id", selectedEvent)
        .order("changed_at", { ascending: false })
        .limit(50)

      setHistory(historyData || [])
    } catch (error) {
      console.error("Error loading event data:", error)
    }
  }

  async function saveEventDetails() {
    setIsSavingDetails(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const staticEvent = STATIC_EVENTS.find((e) => e.slug === selectedEvent)
      if (!staticEvent) throw new Error("Event not found")

      const eventPayload = {
        slug: selectedEvent,
        title: staticEvent.title,
        short_title: staticEvent.short_title,
        event_type: staticEvent.event_type,
        start_date: detailsForm.start_date || null,
        end_date: detailsForm.end_date || null,
        start_time: detailsForm.start_time || null,
        end_time: detailsForm.end_time || null,
        timezone: detailsForm.timezone || "WIB",
        location: detailsForm.location || null,
        venue: detailsForm.venue || null,
        room: detailsForm.room || null, // Save room to database
        description: detailsForm.description || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }

      if (eventDetails?.id) {
        // Update existing event
        const { error } = await supabase.from("events").update(eventPayload).eq("id", eventDetails.id)

        if (error) throw error

        // Log history
        await supabase.from("event_history").insert({
          event_id: eventDetails.id,
          action: "updated",
          changes: {
            details: { old: "previous values", new: "updated values" },
          },
          changed_by: user.id,
        })
      } else {
        // Create new event
        const { data: newEvent, error } = await supabase
          .from("events")
          .insert({
            ...eventPayload,
            created_by: user.id,
            is_active: true,
            status: "active",
          })
          .select()
          .single()

        if (error) throw error

        // Log history
        if (newEvent) {
          await supabase.from("event_history").insert({
            event_id: newEvent.id,
            action: "created",
            changes: { details: { old: "", new: "created" } },
            changed_by: user.id,
          })
        }
      }

      await loadEventData()
      alert("Event details saved successfully!")
    } catch (error) {
      console.error("Error saving event details:", error)
      alert("Failed to save event details")
    } finally {
      setIsSavingDetails(false)
    }
  }

  async function handleAddResource() {
    if (!formData.title || !formData.url) return

    setIsProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Ensure event exists first
      let eventId = eventDetails?.id
      if (!eventId) {
        const staticEvent = STATIC_EVENTS.find((e) => e.slug === selectedEvent)
        const { data: newEvent, error: eventError } = await supabase
          .from("events")
          .insert({
            slug: selectedEvent,
            title: staticEvent?.title || selectedEvent,
            short_title: staticEvent?.short_title || selectedEvent,
            event_type: staticEvent?.event_type || "workshop",
            created_by: user.id,
            is_active: true,
            status: "active",
          })
          .select()
          .single()

        if (eventError) throw eventError
        eventId = newEvent.id
      }

      const { error } = await supabase.from("event_resources").insert({
        event_id: eventId, // This is now the UUID from the database
        resource_type: activeTab as ResourceType,
        title: formData.title,
        description: formData.description || null,
        url: formData.url,
        file_type: formData.file_type || null,
        file_size: formData.file_size || null,
        sort_order: formData.sort_order,
        is_public: formData.is_public,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      })

      if (error) throw error

      await loadEventData()
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error adding resource:", error)
      alert("Failed to add resource")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleEditResource() {
    if (!selectedResource || !formData.title || !formData.url) return

    setIsProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("event_resources")
        .update({
          title: formData.title,
          description: formData.description || null,
          url: formData.url,
          file_type: formData.file_type || null,
          file_size: formData.file_size || null,
          sort_order: formData.sort_order,
          is_public: formData.is_public,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedResource.id)

      if (error) throw error

      await loadEventData()
      setIsEditDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error updating resource:", error)
      alert("Failed to update resource")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDelete() {
    if (!selectedResource) return

    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from("event_resources")
        .update({ is_active: false })
        .eq("id", selectedResource.id)

      if (error) throw error

      await loadEventData()
      setIsDeleteDialogOpen(false)
      setSelectedResource(null)
    } catch (error) {
      console.error("Error deleting resource:", error)
      alert("Failed to delete resource")
    } finally {
      setIsProcessing(false)
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      url: "",
      file_type: "",
      file_size: 0,
      sort_order: resources.length,
      is_public: false,
    })
    setSelectedResource(null)
  }

  function openAddDialog() {
    resetForm()
    setFormData((prev) => ({ ...prev, sort_order: resources.length }))
    setIsAddDialogOpen(true)
  }

  function openEditDialog(resource: EventResource) {
    setSelectedResource(resource)
    setFormData({
      title: resource.title,
      description: resource.description || "",
      url: resource.url,
      file_type: resource.file_type || "",
      file_size: resource.file_size || 0,
      sort_order: resource.sort_order,
      is_public: resource.is_public,
    })
    setIsEditDialogOpen(true)
  }

  function openDeleteDialog(resource: EventResource) {
    setSelectedResource(resource)
    setIsDeleteDialogOpen(true)
  }

  const activeResources = resources.filter((r) => r.resource_type === activeTab && r.is_active)

  const selectedEventData = STATIC_EVENTS.find((e) => e.slug === selectedEvent)
  const EventIcon = selectedEventData ? getEventIcon(selectedEventData.event_type) : Calendar

  if (loading && !isAdmin) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </main>
        <Footer />
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-20 min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">You do not have permission to access this page.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Event CMS</h1>
            <p className="text-muted-foreground">Manage event details, resources, and materials</p>
          </div>

          {/* Event Selector */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Label className="text-sm font-medium whitespace-nowrap">Select Event:</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-full sm:w-[400px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATIC_EVENTS.map((event) => {
                      const Icon = getEventIcon(event.event_type)
                      return (
                        <SelectItem key={event.slug} value={event.slug}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{event.short_title}</span>
                            <Badge variant="outline" className={`ml-2 text-xs ${getEventColor(event.event_type)}`}>
                              {event.event_type.toUpperCase()}
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Selected Event Info */}
          {selectedEventData && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getEventColor(selectedEventData.event_type)}`}>
                    <EventIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedEventData.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {eventDetails ? (
                        <>
                          {formatEventDate(eventDetails.start_date, eventDetails.end_date)} |{" "}
                          {formatEventTime(eventDetails.start_time, eventDetails.end_time, eventDetails.timezone)} |{" "}
                          {eventDetails.location || "Location TBA"}
                        </>
                      ) : (
                        "Date, time, and location not set"
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="details" className="gap-2">
                <Calendar className="w-4 h-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="document" className="gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                Links
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-2">
                <Video className="w-4 h-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={detailsForm.start_date}
                        onChange={(e) => setDetailsForm((prev) => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={detailsForm.end_date}
                        onChange={(e) => setDetailsForm((prev) => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Time Fields */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={detailsForm.start_time}
                        onChange={(e) => setDetailsForm((prev) => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={detailsForm.end_time}
                        onChange={(e) => setDetailsForm((prev) => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={detailsForm.timezone}
                        onValueChange={(v) => setDetailsForm((prev) => ({ ...prev, timezone: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WIB">WIB (UTC+7)</SelectItem>
                          <SelectItem value="WITA">WITA (UTC+8)</SelectItem>
                          <SelectItem value="WIT">WIT (UTC+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location Fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={detailsForm.location}
                        onChange={(e) => setDetailsForm((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Malang, East Java"
                      />
                    </div>
                    <div>
                      <Label htmlFor="venue" className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Venue
                      </Label>
                      <Input
                        id="venue"
                        value={detailsForm.venue}
                        onChange={(e) => setDetailsForm((prev) => ({ ...prev, venue: e.target.value }))}
                        placeholder="e.g., Hotel Singhasari"
                      />
                    </div>
                  </div>

                  {/* Room Field */}
                  <div>
                    <Label htmlFor="room" className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4" />
                      Room
                    </Label>
                    <Input
                      id="room"
                      value={detailsForm.room}
                      onChange={(e) => setDetailsForm((prev) => ({ ...prev, room: e.target.value }))}
                      placeholder="e.g., Ballroom A, Conference Room 1"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={detailsForm.description}
                      onChange={(e) => setDetailsForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Event description..."
                      rows={4}
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={saveEventDetails} disabled={isSavingDetails}>
                      {isSavingDetails ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tabs */}
            {["document", "link", "video", "image"].map((type) => (
              <TabsContent key={type} value={type}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {type === "document" && <FileText className="w-5 h-5" />}
                      {type === "link" && <LinkIcon className="w-5 h-5" />}
                      {type === "video" && <Video className="w-5 h-5" />}
                      {type === "image" && <ImageIcon className="w-5 h-5" />}
                      {type.charAt(0).toUpperCase() + type.slice(1)}s
                    </CardTitle>
                    <Button onClick={openAddDialog} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {activeResources.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No {type}s added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeResources.map((resource) => {
                          const Icon = getResourceIcon(resource.resource_type)
                          return (
                            <div
                              key={resource.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="p-2 rounded-lg bg-slate-100">
                                  <Icon className="w-4 h-4 text-slate-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{resource.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {resource.file_type && (
                                      <Badge variant="outline" className="text-xs">
                                        {resource.file_type.toUpperCase()}
                                      </Badge>
                                    )}
                                    {resource.file_size && <span>{formatFileSize(resource.file_size)}</span>}
                                    <Badge variant={resource.is_public ? "default" : "secondary"} className="text-xs">
                                      {resource.is_public ? "Public" : "Private"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    {type === "document" ? (
                                      <Download className="w-4 h-4" />
                                    ) : (
                                      <ExternalLink className="w-4 h-4" />
                                    )}
                                  </a>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(resource)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => openDeleteDialog(resource)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Change History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No history records yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((record) => (
                        <div key={record.id} className="flex items-start gap-3 p-4 border rounded-lg">
                          <div className="p-2 rounded-lg bg-slate-100">
                            <History className="w-4 h-4 text-slate-600" />
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
                              <span className="text-xs text-muted-foreground">{formatDate(record.changed_at)}</span>
                            </div>
                            {record.change_reason && (
                              <p className="text-sm text-muted-foreground mt-1">{record.change_reason}</p>
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
        </div>
      </main>
      <Footer />

      {/* Add Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add{" "}
              {activeTab !== "details" && activeTab !== "history"
                ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                : "Resource"}
            </DialogTitle>
            <DialogDescription>Add a new resource to this event.</DialogDescription>
          </DialogHeader>
          <ResourceForm formData={formData} setFormData={setFormData} resourceType={activeTab as ResourceType} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddResource} disabled={isProcessing || !formData.title || !formData.url}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update the resource details.</DialogDescription>
          </DialogHeader>
          <ResourceForm
            formData={formData}
            setFormData={setFormData}
            resourceType={selectedResource?.resource_type || "document"}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditResource} disabled={isProcessing || !formData.title || !formData.url}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedResource?.title}&quot;? This action can be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Resource Form Component
function ResourceForm({
  formData,
  setFormData,
  resourceType,
}: {
  formData: {
    title: string
    description: string
    url: string
    file_type: string
    file_size: number
    sort_order: number
    is_public: boolean
  }
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>
  resourceType: ResourceType
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Presentation Slides"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="url">URL *</Label>
        <Input
          id="url"
          value={formData.url}
          onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
          placeholder={
            resourceType === "link"
              ? "https://zoom.us/j/..."
              : resourceType === "video"
                ? "https://youtube.com/watch?v=..."
                : "https://storage.example.com/file.pdf"
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="file_type">File Type</Label>
          <Select value={formData.file_type} onValueChange={(v) => setFormData((prev) => ({ ...prev, file_type: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="doc">Word Document</SelectItem>
              <SelectItem value="ppt">PowerPoint</SelectItem>
              <SelectItem value="xls">Excel</SelectItem>
              <SelectItem value="zip">ZIP Archive</SelectItem>
              <SelectItem value="mp4">Video (MP4)</SelectItem>
              <SelectItem value="jpg">Image (JPG)</SelectItem>
              <SelectItem value="png">Image (PNG)</SelectItem>
              <SelectItem value="url">External Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="file_size">File Size (MB)</Label>
          <Input
            id="file_size"
            type="number"
            value={formData.file_size ? formData.file_size / (1024 * 1024) : ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                file_size: Number.parseFloat(e.target.value) * 1024 * 1024 || 0,
              }))
            }
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="is_public">Public Access</Label>
          <p className="text-xs text-muted-foreground">Allow anyone to view this resource</p>
        </div>
        <Switch
          id="is_public"
          checked={formData.is_public}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_public: checked }))}
        />
      </div>
    </div>
  )
}
