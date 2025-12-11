"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  LinkIcon,
  FileText,
  Video,
  ImageIcon,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  History,
  ExternalLink,
  Loader2,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  Calendar,
  GraduationCap,
  Stethoscope,
  Users,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDistanceToNow } from "date-fns"

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
  changes: Record<string, unknown>
  changed_by: string
  changed_at: string
  change_reason: string | null
  profiles?: { full_name: string }
}

interface Event {
  id: string
  slug: string
  title: string
  short_title: string
  event_type: string
  status: string
}

const RESOURCE_TYPE_CONFIG: Record<ResourceType, { label: string; description: string }> = {
  document: { label: "Documents", description: "PDFs, slides, handouts, and other downloadable files" },
  link: { label: "Links", description: "External URLs, join links, and references" },
  video: { label: "Videos", description: "Recordings, tutorials, and video content" },
  image: { label: "Images", description: "Photos, diagrams, and visual materials" },
}

const RESOURCE_TYPE_ICONS: Record<ResourceType, React.ElementType> = {
  document: FileText,
  link: LinkIcon,
  video: Video,
  image: ImageIcon,
}

// Static event list based on event-pricing.ts
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

function getEventIcon(eventType: string) {
  if (eventType === "cpd") return GraduationCap
  if (eventType === "workshop") return Stethoscope
  return Users
}

function getEventColor(eventType: string) {
  if (eventType === "cpd") return "bg-purple-100 text-purple-700 border-purple-200"
  if (eventType === "workshop") return "bg-orange-100 text-orange-700 border-orange-200"
  return "bg-teal-100 text-teal-700 border-teal-200"
}

export default function EventCMSPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [activeTab, setActiveTab] = useState<ResourceType | "history">("document")
  const [resources, setResources] = useState<EventResource[]>([])
  const [history, setHistory] = useState<EventHistory[]>([])
  const [dbEvents, setDbEvents] = useState<Event[]>([])

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<EventResource | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    file_type: "",
    file_size: 0,
    sort_order: 0,
    is_public: false,
  })

  // Check admin access
  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (profile?.role !== "admin") {
        router.push("/")
        return
      }

      setIsAdmin(true)
      setLoading(false)

      // Load events from database
      const { data: events } = await supabase
        .from("events")
        .select("id, slug, title, short_title, event_type, status")
        .eq("is_active", true)
        .order("event_type")
        .order("title")

      if (events && events.length > 0) {
        setDbEvents(events as Event[])
      }
    }

    checkAccess()
  }, [router])

  // Load resources when event changes
  useEffect(() => {
    if (selectedEvent && isAdmin) {
      loadResources()
      loadHistory()
    }
  }, [selectedEvent, isAdmin])

  async function loadResources() {
    setLoading(true)
    const supabase = createClient()

    // First check if this event exists in the database
    const { data: eventData } = await supabase.from("events").select("id").eq("slug", selectedEvent).single()

    if (eventData) {
      const { data, error } = await supabase
        .from("event_resources")
        .select("*")
        .eq("event_id", eventData.id)
        .order("resource_type")
        .order("sort_order")

      if (!error && data) {
        setResources(data as EventResource[])
      }
    } else {
      setResources([])
    }

    setLoading(false)
  }

  async function loadHistory() {
    const supabase = createClient()

    // First check if this event exists in the database
    const { data: eventData } = await supabase.from("events").select("id").eq("slug", selectedEvent).single()

    if (eventData) {
      const { data, error } = await supabase
        .from("event_history")
        .select(`*, profiles:changed_by(full_name)`)
        .eq("event_id", eventData.id)
        .order("changed_at", { ascending: false })
        .limit(50)

      if (!error && data) {
        setHistory(data as EventHistory[])
      }
    } else {
      setHistory([])
    }
  }

  // Get or create event in database
  async function getOrCreateEvent(slug: string): Promise<string | null> {
    const supabase = createClient()

    // Check if event exists
    const { data: existingEvent } = await supabase.from("events").select("id").eq("slug", slug).single()

    if (existingEvent) {
      return existingEvent.id
    }

    // Create event from static data
    const staticEvent = STATIC_EVENTS.find((e) => e.slug === slug)
    if (!staticEvent) return null

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: newEvent, error } = await supabase
      .from("events")
      .insert({
        slug: staticEvent.slug,
        title: staticEvent.title,
        short_title: staticEvent.short_title,
        event_type: staticEvent.event_type,
        status: "active",
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating event:", error)
      return null
    }

    return newEvent?.id || null
  }

  async function handleCreate() {
    if (!selectedEvent || !formData.title || !formData.url) return
    setIsProcessing(true)

    try {
      const eventId = await getOrCreateEvent(selectedEvent)
      if (!eventId) {
        toast({ title: "Error", description: "Failed to get or create event", variant: "destructive" })
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("event_resources").insert({
        event_id: eventId,
        resource_type: activeTab as ResourceType,
        title: formData.title,
        description: formData.description || null,
        url: formData.url,
        file_type: formData.file_type || null,
        file_size: formData.file_size || null,
        sort_order: formData.sort_order || 0,
        is_public: formData.is_public,
        is_active: true,
        created_by: user?.id,
        updated_by: user?.id,
      })

      if (error) throw error

      // Log history
      await supabase.from("event_history").insert({
        event_id: eventId,
        action: "resource_created",
        changes: { resource_title: formData.title, resource_type: activeTab },
        changed_by: user?.id,
      })

      toast({ title: "Success", description: "Resource created successfully" })
      setIsAddDialogOpen(false)
      resetForm()
      loadResources()
      loadHistory()
    } catch (error) {
      toast({ title: "Error", description: "Failed to create resource", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleUpdate() {
    if (!selectedResource || !formData.title || !formData.url) return
    setIsProcessing(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("event_resources")
        .update({
          title: formData.title,
          description: formData.description || null,
          url: formData.url,
          file_type: formData.file_type || null,
          file_size: formData.file_size || null,
          sort_order: formData.sort_order || 0,
          is_public: formData.is_public,
          updated_by: user?.id,
        })
        .eq("id", selectedResource.id)

      if (error) throw error

      toast({ title: "Success", description: "Resource updated successfully" })
      setIsEditDialogOpen(false)
      resetForm()
      loadResources()
    } catch (error) {
      toast({ title: "Error", description: "Failed to update resource", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDelete() {
    if (!selectedResource) return
    setIsProcessing(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("event_resources")
        .update({ is_active: false })
        .eq("id", selectedResource.id)

      if (error) throw error

      toast({ title: "Success", description: "Resource deleted successfully" })
      setIsDeleteDialogOpen(false)
      setSelectedResource(null)
      loadResources()
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete resource", variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleRestore(resource: EventResource) {
    setIsProcessing(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("event_resources").update({ is_active: true }).eq("id", resource.id)

      if (error) throw error

      toast({ title: "Success", description: "Resource restored successfully" })
      loadResources()
    } catch (error) {
      toast({ title: "Error", description: "Failed to restore resource", variant: "destructive" })
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
      sort_order: 0,
      is_public: false,
    })
    setSelectedResource(null)
  }

  function openAddDialog() {
    resetForm()
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

  const resourcesByType = resources.filter(
    (r) => r.resource_type === activeTab && (activeTab === "history" || r.is_active || !r.is_active),
  )

  const activeResources = resources.filter((r) => r.resource_type === activeTab && r.is_active)
  const inactiveResources = resources.filter((r) => r.resource_type === activeTab && !r.is_active)

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

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-slate-50 to-background">
        {/* Header */}
        <section className="py-8 px-4 border-b bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Event CMS</h1>
                <p className="text-muted-foreground">Manage event resources and materials</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select an event..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpd" className="py-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                        <span>CPD Courses</span>
                      </div>
                    </SelectItem>
                    {STATIC_EVENTS.filter((e) => e.event_type === "workshop").map((event) => (
                      <SelectItem key={event.slug} value={event.slug} className="py-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-orange-600" />
                          <span>{event.short_title}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="symposium" className="py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-600" />
                        <span>Symposium</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {selectedEvent && (
                  <Button variant="outline" size="icon" onClick={loadResources}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {selectedEvent ? (
          <section className="py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Event Info Card */}
              {selectedEventData && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedEventData.event_type === "cpd"
                            ? "bg-purple-100"
                            : selectedEventData.event_type === "workshop"
                              ? "bg-orange-100"
                              : "bg-teal-100"
                        }`}
                      >
                        <EventIcon
                          className={`w-6 h-6 ${
                            selectedEventData.event_type === "cpd"
                              ? "text-purple-600"
                              : selectedEventData.event_type === "workshop"
                                ? "text-orange-600"
                                : "text-teal-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <Badge className={getEventColor(selectedEventData.event_type)}>
                          {selectedEventData.event_type.toUpperCase()}
                        </Badge>
                        <h2 className="text-xl font-bold mt-2">{selectedEventData.title}</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                          Manage resources, materials, and content for this event
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Resources</p>
                        <p className="text-2xl font-bold">{resources.filter((r) => r.is_active).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Content Tabs */}
              <Card>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ResourceType | "history")}>
                  <CardHeader className="pb-0">
                    <TabsList className="grid w-full grid-cols-5">
                      {(Object.keys(RESOURCE_TYPE_CONFIG) as ResourceType[]).map((type) => {
                        const Icon = RESOURCE_TYPE_ICONS[type]
                        const config = RESOURCE_TYPE_CONFIG[type]
                        return (
                          <TabsTrigger key={type} value={type} className="gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{config.label}</span>
                          </TabsTrigger>
                        )
                      })}
                      <TabsTrigger value="history" className="gap-2">
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">History</span>
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {/* Resource Type Tabs */}
                    {(Object.keys(RESOURCE_TYPE_CONFIG) as ResourceType[]).map((type) => (
                      <TabsContent key={type} value={type} className="mt-0">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{RESOURCE_TYPE_CONFIG[type].label}</h3>
                              <p className="text-sm text-muted-foreground">{RESOURCE_TYPE_CONFIG[type].description}</p>
                            </div>
                            <Button onClick={openAddDialog}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add {RESOURCE_TYPE_CONFIG[type].label.slice(0, -1)}
                            </Button>
                          </div>

                          {loading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                            </div>
                          ) : activeResources.length === 0 && inactiveResources.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                              {React.createElement(RESOURCE_TYPE_ICONS[type], {
                                className: "w-12 h-12 mx-auto mb-4 text-slate-300",
                              })}
                              <p className="text-muted-foreground mb-4">
                                No {RESOURCE_TYPE_CONFIG[type].label.toLowerCase()} added yet
                              </p>
                              <Button variant="outline" onClick={openAddDialog}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add First {RESOURCE_TYPE_CONFIG[type].label.slice(0, -1)}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {activeResources.map((item) => (
                                <ResourceItem
                                  key={item.id}
                                  item={item}
                                  onEdit={() => openEditDialog(item)}
                                  onDelete={() => openDeleteDialog(item)}
                                  onRestore={() => handleRestore(item)}
                                />
                              ))}
                              {inactiveResources.length > 0 && (
                                <>
                                  <div className="pt-4 pb-2">
                                    <p className="text-sm text-muted-foreground">Deleted Resources</p>
                                  </div>
                                  {inactiveResources.map((item) => (
                                    <ResourceItem
                                      key={item.id}
                                      item={item}
                                      onEdit={() => openEditDialog(item)}
                                      onDelete={() => openDeleteDialog(item)}
                                      onRestore={() => handleRestore(item)}
                                    />
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    ))}

                    {/* History Tab */}
                    <TabsContent value="history" className="mt-0">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium">Change History</h3>
                          <p className="text-sm text-muted-foreground">Track all changes made to event resources</p>
                        </div>

                        {history.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-muted-foreground">No history yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {history.map((entry) => (
                              <HistoryItem key={entry.id} entry={entry} />
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </section>
        ) : (
          <section className="py-12 px-4">
            <div className="max-w-7xl mx-auto">
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-xl font-semibold mb-2">Select an Event</h3>
                  <p className="text-muted-foreground">
                    Choose an event from the dropdown above to manage its resources
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>
      <Footer />

      {/* Add Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add New {activeTab !== "history" && RESOURCE_TYPE_CONFIG[activeTab as ResourceType]?.label.slice(0, -1)}
            </DialogTitle>
            <DialogDescription>Add a new resource to this event</DialogDescription>
          </DialogHeader>
          <ResourceForm formData={formData} setFormData={setFormData} resourceType={activeTab as ResourceType} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isProcessing || !formData.title || !formData.url}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update resource details</DialogDescription>
          </DialogHeader>
          <ResourceForm
            formData={formData}
            setFormData={setFormData}
            resourceType={selectedResource?.resource_type as ResourceType}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isProcessing || !formData.title || !formData.url}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
              Update
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
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <Label htmlFor="is_public" className="font-medium">
            Public Access
          </Label>
          <p className="text-sm text-muted-foreground">Visible to everyone, not just registered attendees</p>
        </div>
        <Switch
          id="is_public"
          checked={formData.is_public}
          onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_public: v }))}
        />
      </div>
    </div>
  )
}

// Resource Item Component
function ResourceItem({
  item,
  onEdit,
  onDelete,
  onRestore,
}: {
  item: EventResource
  onEdit: () => void
  onDelete: () => void
  onRestore: () => void
}) {
  const Icon = RESOURCE_TYPE_ICONS[item.resource_type as ResourceType] || FileText

  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg ${
        !item.is_active ? "opacity-50 bg-slate-50" : "bg-card hover:shadow-sm"
      } transition-all`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{item.title}</p>
            {item.is_public ? (
              <Badge variant="outline" className="text-xs gap-1">
                <Eye className="w-3 h-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1">
                <EyeOff className="w-3 h-3" />
                Private
              </Badge>
            )}
            {!item.is_active && (
              <Badge variant="destructive" className="text-xs">
                Deleted
              </Badge>
            )}
          </div>
          {item.description && <p className="text-sm text-muted-foreground truncate">{item.description}</p>}
          <p className="text-xs text-muted-foreground truncate mt-1">{item.url}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button variant="ghost" size="icon" asChild>
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
        {item.is_active ? (
          <>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="icon" onClick={onRestore}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// History Item Component
function HistoryItem({ entry }: { entry: EventHistory }) {
  const actionColors: Record<string, string> = {
    resource_created: "bg-green-100 text-green-700",
    resource_updated: "bg-blue-100 text-blue-700",
    resource_deleted: "bg-red-100 text-red-700",
    resource_restored: "bg-amber-100 text-amber-700",
  }

  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg bg-card">
      <Badge className={actionColors[entry.action] || "bg-slate-100 text-slate-700"}>
        {entry.action.replace(/_/g, " ")}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {entry.changes?.resource_title && <span className="font-medium">{String(entry.changes.resource_title)}</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {entry.profiles?.full_name || "Unknown"} &bull;{" "}
          {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
