"use client"

import React from "react"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  History,
  ExternalLink,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getWebinarContentAdmin,
  createWebinarContent,
  updateWebinarContent,
  deleteWebinarContent,
  restoreWebinarContent,
  getWebinarContentHistory,
} from "@/app/actions/webinar-cms"
import { WEBINARS } from "@/lib/data/webinars"
import {
  type WebinarContent,
  type WebinarContentHistory,
  type ContentType,
  CONTENT_TYPE_CONFIG,
  FILE_TYPE_CONFIG,
  formatFileSize,
  getFileTypeFromUrl,
} from "@/lib/webinar-cms/types"
import { formatDistanceToNow } from "date-fns"

const CONTENT_TYPE_ICONS: Record<ContentType, React.ElementType> = {
  link: LinkIcon,
  material: FileText,
  recording: Video,
  resource: BookOpen,
}

export default function WebinarCMSPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedWebinar, setSelectedWebinar] = useState<string>("")
  const [activeTab, setActiveTab] = useState<ContentType | "history">("link")
  const [content, setContent] = useState<WebinarContent[]>([])
  const [history, setHistory] = useState<WebinarContentHistory[]>([])

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState<WebinarContent | null>(null)
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

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const webinarParam = searchParams.get("webinar")
    if (webinarParam && WEBINARS.some((w) => w.id === webinarParam)) {
      setSelectedWebinar(webinarParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedWebinar && isAdmin) {
      fetchContent()
    }
  }, [selectedWebinar, isAdmin])

  const checkAuth = async () => {
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
      router.push("/dashboard")
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }

  const fetchContent = async () => {
    if (!selectedWebinar) return

    setLoading(true)
    const result = await getWebinarContentAdmin(selectedWebinar)

    if (result.success && result.content) {
      setContent(result.content)
    }

    // Also fetch history
    const historyResult = await getWebinarContentHistory(selectedWebinar)
    if (historyResult.success && historyResult.history) {
      setHistory(historyResult.history)
    }

    setLoading(false)
  }

  const handleWebinarChange = (webinarId: string) => {
    setSelectedWebinar(webinarId)
    router.push(`/admin/webinar-cms?webinar=${webinarId}`)
  }

  const openAddDialog = () => {
    setFormData({
      title: "",
      description: "",
      url: "",
      file_type: "",
      file_size: 0,
      sort_order: contentByType.length,
      is_public: false,
    })
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (item: WebinarContent) => {
    setSelectedContent(item)
    setFormData({
      title: item.title,
      description: item.description || "",
      url: item.url,
      file_type: item.file_type || "",
      file_size: item.file_size || 0,
      sort_order: item.sort_order,
      is_public: item.is_public,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (item: WebinarContent) => {
    setSelectedContent(item)
    setIsDeleteDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!selectedWebinar || activeTab === "history") return

    setIsProcessing(true)
    const result = await createWebinarContent({
      webinar_id: selectedWebinar,
      content_type: activeTab as ContentType,
      title: formData.title,
      description: formData.description || undefined,
      url: formData.url,
      file_type: formData.file_type || getFileTypeFromUrl(formData.url),
      file_size: formData.file_size || undefined,
      sort_order: formData.sort_order,
      is_public: formData.is_public,
    })

    if (result.success) {
      toast({ title: "Content Added", description: `"${formData.title}" has been added successfully.` })
      setIsAddDialogOpen(false)
      fetchContent()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsProcessing(false)
  }

  const handleUpdate = async () => {
    if (!selectedContent) return

    setIsProcessing(true)
    const result = await updateWebinarContent(selectedContent.id, {
      title: formData.title,
      description: formData.description || undefined,
      url: formData.url,
      file_type: formData.file_type || getFileTypeFromUrl(formData.url),
      file_size: formData.file_size || undefined,
      sort_order: formData.sort_order,
      is_public: formData.is_public,
    })

    if (result.success) {
      toast({ title: "Content Updated", description: `"${formData.title}" has been updated.` })
      setIsEditDialogOpen(false)
      setSelectedContent(null)
      fetchContent()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsProcessing(false)
  }

  const handleDelete = async () => {
    if (!selectedContent) return

    setIsProcessing(true)
    const result = await deleteWebinarContent(selectedContent.id)

    if (result.success) {
      toast({ title: "Content Deleted", description: `"${selectedContent.title}" has been deleted.` })
      setIsDeleteDialogOpen(false)
      setSelectedContent(null)
      fetchContent()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsProcessing(false)
  }

  const handleRestore = async (item: WebinarContent) => {
    const result = await restoreWebinarContent(item.id)

    if (result.success) {
      toast({ title: "Content Restored", description: `"${item.title}" has been restored.` })
      fetchContent()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  const selectedWebinarData = useMemo(() => {
    return WEBINARS.find((w) => w.id === selectedWebinar)
  }, [selectedWebinar])

  const contentByType = useMemo(() => {
    if (activeTab === "history") return []
    return content.filter((c) => c.content_type === activeTab)
  }, [content, activeTab])

  const stats = useMemo(() => {
    return {
      links: content.filter((c) => c.content_type === "link" && c.is_active).length,
      materials: content.filter((c) => c.content_type === "material" && c.is_active).length,
      recordings: content.filter((c) => c.content_type === "recording" && c.is_active).length,
      resources: content.filter((c) => c.content_type === "resource" && c.is_active).length,
      deleted: content.filter((c) => !c.is_active).length,
    }
  }, [content])

  if (!isAdmin) return null

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-slate-50 to-background">
        {/* Header */}
        <section className="py-8 px-4 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">Webinar Content Manager</h1>
                <p className="text-slate-300">Manage links, materials, recordings, and resources</p>
              </div>
            </div>
          </div>
        </section>

        {/* Webinar Selector */}
        <section className="py-6 px-4 -mt-4">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground mb-2 block">Select Webinar to Manage</Label>
                    <Select value={selectedWebinar} onValueChange={handleWebinarChange}>
                      <SelectTrigger className="w-full sm:max-w-md">
                        <SelectValue placeholder="Choose a webinar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {WEBINARS.map((webinar) => (
                          <SelectItem key={webinar.id} value={webinar.id}>
                            <div className="flex items-center gap-2">
                              <span>{webinar.shortTitle}</span>
                              <Badge variant="secondary" className="text-xs">
                                {webinar.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedWebinar && (
                    <Button variant="outline" onClick={fetchContent} disabled={loading}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Content Manager */}
        {selectedWebinar ? (
          <section className="py-4 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Webinar Info */}
              {selectedWebinarData && (
                <Card className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                      <div>
                        <h2 className="font-semibold text-lg">{selectedWebinarData.shortTitle}</h2>
                        <p className="text-sm text-muted-foreground line-clamp-1">{selectedWebinarData.title}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          <LinkIcon className="w-3 h-3 mr-1" />
                          {stats.links} Links
                        </Badge>
                        <Badge variant="outline">
                          <FileText className="w-3 h-3 mr-1" />
                          {stats.materials} Materials
                        </Badge>
                        <Badge variant="outline">
                          <Video className="w-3 h-3 mr-1" />
                          {stats.recordings} Recordings
                        </Badge>
                        <Badge variant="outline">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {stats.resources} Resources
                        </Badge>
                        {stats.deleted > 0 && (
                          <Badge variant="destructive">
                            <Trash2 className="w-3 h-3 mr-1" />
                            {stats.deleted} Deleted
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Content Tabs */}
              <Card>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType | "history")}>
                  <CardHeader className="pb-0">
                    <TabsList className="grid w-full grid-cols-5">
                      {(Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map((type) => {
                        const Icon = CONTENT_TYPE_ICONS[type]
                        const config = CONTENT_TYPE_CONFIG[type]
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
                    {/* Content Type Tabs */}
                    {(Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map((type) => (
                      <TabsContent key={type} value={type} className="mt-0">
                        <div className="space-y-4">
                          {/* Add Button */}
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{CONTENT_TYPE_CONFIG[type].label}</h3>
                              <p className="text-sm text-muted-foreground">{CONTENT_TYPE_CONFIG[type].description}</p>
                            </div>
                            <Button onClick={openAddDialog}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add {CONTENT_TYPE_CONFIG[type].label.slice(0, -1)}
                            </Button>
                          </div>

                          {/* Content List */}
                          {loading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                            </div>
                          ) : contentByType.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                              {React.createElement(CONTENT_TYPE_ICONS[type], {
                                className: "w-12 h-12 mx-auto mb-4 text-slate-300",
                              })}
                              <p className="text-muted-foreground mb-4">
                                No {CONTENT_TYPE_CONFIG[type].label.toLowerCase()} added yet
                              </p>
                              <Button variant="outline" onClick={openAddDialog}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add First {CONTENT_TYPE_CONFIG[type].label.slice(0, -1)}
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {contentByType.map((item) => (
                                <ContentItem
                                  key={item.id}
                                  item={item}
                                  onEdit={() => openEditDialog(item)}
                                  onDelete={() => openDeleteDialog(item)}
                                  onRestore={() => handleRestore(item)}
                                />
                              ))}
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
                          <p className="text-sm text-muted-foreground">Track all changes made to webinar content</p>
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
                  <h3 className="text-xl font-semibold mb-2">Select a Webinar</h3>
                  <p className="text-muted-foreground">
                    Choose a webinar from the dropdown above to manage its content
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>
      <Footer />

      {/* Add Content Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add New {activeTab !== "history" && CONTENT_TYPE_CONFIG[activeTab as ContentType]?.label.slice(0, -1)}
            </DialogTitle>
            <DialogDescription>Add a new item to this webinar&apos;s content</DialogDescription>
          </DialogHeader>
          <ContentForm formData={formData} setFormData={setFormData} contentType={activeTab as ContentType} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isProcessing || !formData.title || !formData.url}>
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Content Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>Update this content item</DialogDescription>
          </DialogHeader>
          <ContentForm
            formData={formData}
            setFormData={setFormData}
            contentType={selectedContent?.content_type as ContentType}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isProcessing || !formData.title || !formData.url}>
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedContent?.title}&quot;? This can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Content Form Component
function ContentForm({
  formData,
  setFormData,
  contentType,
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
  contentType: ContentType
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
          onChange={(e) => {
            const url = e.target.value
            setFormData((prev) => ({
              ...prev,
              url,
              file_type: prev.file_type || getFileTypeFromUrl(url),
            }))
          }}
          placeholder={
            contentType === "link"
              ? "https://zoom.us/j/..."
              : contentType === "recording"
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
              <SelectValue placeholder="Auto-detect" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FILE_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
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
          <p className="text-sm text-muted-foreground">Visible to everyone, not just purchasers</p>
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

// Content Item Component
function ContentItem({
  item,
  onEdit,
  onDelete,
  onRestore,
}: {
  item: WebinarContent
  onEdit: () => void
  onDelete: () => void
  onRestore: () => void
}) {
  const fileConfig = FILE_TYPE_CONFIG[item.file_type || "link"] || FILE_TYPE_CONFIG.link

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
        item.is_active ? "bg-card hover:bg-accent/50" : "bg-red-50 border-red-200 opacity-60"
      }`}
    >
      <div className="cursor-move">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">{item.title}</p>
          {!item.is_active && (
            <Badge variant="destructive" className="text-xs">
              Deleted
            </Badge>
          )}
          {item.is_public ? (
            <Badge variant="secondary" className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Public
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <EyeOff className="w-3 h-3 mr-1" />
              Purchasers Only
            </Badge>
          )}
        </div>
        {item.description && <p className="text-sm text-muted-foreground truncate">{item.description}</p>}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {fileConfig.label}
          </Badge>
          {item.file_size && <span>{formatFileSize(item.file_size)}</span>}
          <span className="truncate max-w-[200px]">{item.url}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={onRestore}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// History Item Component
function HistoryItem({ entry }: { entry: WebinarContentHistory }) {
  const actionColors: Record<string, string> = {
    created: "bg-green-100 text-green-700",
    updated: "bg-blue-100 text-blue-700",
    deleted: "bg-red-100 text-red-700",
    restored: "bg-amber-100 text-amber-700",
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
      <Badge className={actionColors[entry.action]}>{entry.action}</Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {entry.field_changed ? (
            <>
              Changed <strong>{entry.field_changed}</strong>
              {entry.old_value && entry.new_value && (
                <>
                  {" "}
                  from &quot;{entry.old_value.substring(0, 50)}&quot; to &quot;{entry.new_value.substring(0, 50)}&quot;
                </>
              )}
            </>
          ) : (
            <>Content {entry.action}</>
          )}
        </p>
        {entry.change_reason && <p className="text-xs text-muted-foreground mt-1">Reason: {entry.change_reason}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          by {entry.profiles?.full_name || "Unknown"} •{" "}
          {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
