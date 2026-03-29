"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  Star,
  ExternalLink,
  Search,
  Upload,
  ImageIcon,
  Clock,
  Newspaper,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import Image from "next/image"

interface NewsItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  image_url: string | null
  is_published: boolean
  is_featured: boolean
  published_at: string | null
  scheduled_for: string | null
  author_id: string | null
  author_name: string | null
  category: string
  tags: string[] | null
  view_count: number
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: "announcement", label: "Announcement" },
  { value: "update", label: "Update" },
  { value: "press", label: "Press Release" },
  { value: "event", label: "Event" },
  { value: "registration", label: "Registration" },
]

const categoryColors: Record<string, string> = {
  announcement: "bg-teal-100 text-teal-700",
  update: "bg-blue-100 text-blue-700",
  press: "bg-purple-100 text-purple-700",
  event: "bg-amber-100 text-amber-700",
  registration: "bg-green-100 text-green-700",
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default function NewsCMSPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image_url: "",
    is_published: false,
    is_featured: false,
    published_at: "",
    scheduled_for: "",
    author_name: "",
    category: "announcement",
    tags: "",
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchNews()
    }
  }, [isAdmin])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }

  const fetchNews = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch news items",
        variant: "destructive",
      })
    } else {
      setNewsItems(data || [])
    }
    setLoading(false)
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-news-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, image_url: data.url }))
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      image_url: "",
      is_published: false,
      is_featured: false,
      published_at: "",
      scheduled_for: "",
      author_name: "",
      category: "announcement",
      tags: "",
    })
  }

  const handleAdd = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    
    try {
      const slug = formData.slug || generateSlug(formData.title)
      
      const { data: { user } } = await supabase.auth.getUser()

      console.log("[v0] Creating news article with slug:", slug)

      const { error } = await supabase.from("news").insert({
        title: formData.title,
        slug,
        excerpt: formData.excerpt || null,
        content: formData.content,
        image_url: formData.image_url || null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        published_at: formData.is_published ? (formData.published_at || new Date().toISOString()) : null,
        scheduled_for: formData.scheduled_for || null,
        author_id: user?.id,
        author_name: formData.author_name || null,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : null,
      })

      console.log("[v0] Insert result - error:", error)

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "News article created successfully",
        })
        setIsAddDialogOpen(false)
        resetForm()
        fetchNews()
      }
    } catch (err: any) {
      console.error("[v0] handleAdd error:", err)
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedNews || !formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    const { error } = await supabase
      .from("news")
      .update({
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt || null,
        content: formData.content,
        image_url: formData.image_url || null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        published_at: formData.is_published ? (formData.published_at || new Date().toISOString()) : null,
        scheduled_for: formData.scheduled_for || null,
        author_name: formData.author_name || null,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedNews.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "News article updated successfully",
      })
      setIsEditDialogOpen(false)
      resetForm()
      setSelectedNews(null)
      fetchNews()
    }
    setIsProcessing(false)
  }

  const handleDelete = async () => {
    if (!selectedNews) return

    setIsProcessing(true)
    
    // Delete image from Blob if it exists
    if (selectedNews.image_url) {
      try {
        await fetch("/api/delete-blob", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: selectedNews.image_url }),
        })
      } catch (error) {
        console.error("Error deleting image:", error)
        // Continue with deletion even if image delete fails
      }
    }

    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", selectedNews.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "News article deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setSelectedNews(null)
      fetchNews()
    }
    setIsProcessing(false)
  }

  const openEditDialog = (news: NewsItem) => {
    setSelectedNews(news)
    setFormData({
      title: news.title,
      slug: news.slug,
      excerpt: news.excerpt || "",
      content: news.content,
      image_url: news.image_url || "",
      is_published: news.is_published,
      is_featured: news.is_featured,
      published_at: news.published_at ? news.published_at.slice(0, 16) : "",
      scheduled_for: news.scheduled_for ? news.scheduled_for.slice(0, 16) : "",
      author_name: news.author_name || "",
      category: news.category,
      tags: news.tags?.join(", ") || "",
    })
    setIsEditDialogOpen(true)
  }

  const togglePublish = async (news: NewsItem) => {
    const { error } = await supabase
      .from("news")
      .update({
        is_published: !news.is_published,
        published_at: !news.is_published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", news.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: news.is_published ? "News unpublished" : "News published",
      })
      fetchNews()
    }
  }

  const toggleFeatured = async (news: NewsItem) => {
    const { error } = await supabase
      .from("news")
      .update({
        is_featured: !news.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq("id", news.id)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: news.is_featured ? "Removed from featured" : "Added to featured",
      })
      fetchNews()
    }
  }

  // Filter news items
  const filteredNews = newsItems.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || news.category === filterCategory
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "published" && news.is_published) ||
      (filterStatus === "draft" && !news.is_published)
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-teal-600" />
                News CMS
              </h1>
              <p className="text-slate-600 mt-1">
                Manage news articles, announcements, and updates
              </p>
            </div>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              Add News Article
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-slate-800">{newsItems.length}</p>
                <p className="text-sm text-slate-600">Total Articles</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-green-600">
                  {newsItems.filter(n => n.is_published).length}
                </p>
                <p className="text-sm text-slate-600">Published</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-amber-600">
                  {newsItems.filter(n => !n.is_published).length}
                </p>
                <p className="text-sm text-slate-600">Drafts</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-teal-600">
                  {newsItems.filter(n => n.is_featured).length}
                </p>
                <p className="text-sm text-slate-600">Featured</p>
              </CardContent>
            </Card>
          </div>

          {/* News List */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {filteredNews.length === 0 ? (
                <div className="p-12 text-center">
                  <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No news articles found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredNews.map((news) => (
                    <div key={news.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex gap-4">
                        {news.image_url ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
                            <Image
                              src={news.image_url}
                              alt={news.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 hidden sm:flex">
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={categoryColors[news.category] || "bg-slate-100"}>
                                  {CATEGORIES.find(c => c.value === news.category)?.label || news.category}
                                </Badge>
                                {news.is_published ? (
                                  <Badge className="bg-green-100 text-green-700">Published</Badge>
                                ) : (
                                  <Badge variant="secondary">Draft</Badge>
                                )}
                                {news.is_featured && (
                                  <Badge className="bg-amber-100 text-amber-700">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-slate-800 truncate">{news.title}</h3>
                              {news.excerpt && (
                                <p className="text-sm text-slate-600 line-clamp-1 mt-1">{news.excerpt}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                {news.published_at && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(news.published_at), "MMM d, yyyy")}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {news.view_count} views
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFeatured(news)}
                                title={news.is_featured ? "Remove from featured" : "Add to featured"}
                              >
                                <Star className={`w-4 h-4 ${news.is_featured ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePublish(news)}
                                title={news.is_published ? "Unpublish" : "Publish"}
                              >
                                {news.is_published ? (
                                  <EyeOff className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <Eye className="w-4 h-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <a href={`/news/${news.slug}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 text-slate-400" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(news)}
                              >
                                <Pencil className="w-4 h-4 text-slate-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedNews(news); setIsDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          resetForm()
          setSelectedNews(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit News Article" : "Add News Article"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? "Update the news article details" : "Create a new news article"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter article title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Auto-generated from title if empty"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author Name</Label>
                  <Input
                    id="author"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    placeholder="Author name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt / Summary</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the article"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Article content (HTML supported)"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Image URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-slate-50">
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload
                      </div>
                    </Label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                    />
                  </div>
                </div>
                {formData.image_url && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden mt-2">
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="published_at">Publish Date</Label>
                  <Input
                    id="published_at"
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_for">Schedule For</Label>
                  <Input
                    id="scheduled_for"
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publish immediately</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Featured article</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setIsEditDialogOpen(false)
                resetForm()
                setSelectedNews(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEdit : handleAdd}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditDialogOpen ? "Save Changes" : "Create Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete News Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedNews?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  )
}
