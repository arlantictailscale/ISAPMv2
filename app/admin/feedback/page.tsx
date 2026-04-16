"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { format, formatDistanceToNow, isToday, isThisWeek, isThisMonth } from "date-fns"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Search,
  Download,
  RefreshCw,
  MessageSquare,
  Mail,
  User,
  Calendar,
  Tag,
  Eye,
  CheckCircle,
  Circle,
  FileSpreadsheet,
  Filter,
  X,
} from "lucide-react"

interface Feedback {
  id: string
  name: string
  email: string | null
  message: string
  category: string
  is_read: boolean
  created_at: string
  updated_at: string
}

const CATEGORY_OPTIONS = [
  { id: "all", label: "All Categories" },
  { id: "general", label: "General" },
  { id: "registration", label: "Registration" },
  { id: "event", label: "Event" },
  { id: "website", label: "Website" },
  { id: "other", label: "Other" },
]

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  registration: "bg-blue-100 text-blue-700",
  event: "bg-purple-100 text-purple-700",
  website: "bg-teal-100 text-teal-700",
  other: "bg-orange-100 text-orange-700",
}

export default function AdminFeedbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role !== "admin") {
        toast.error("Unauthorized access")
        router.push("/dashboard")
        return
      }
      await loadFeedback()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadFeedback = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading feedback:", error)
      toast.error("Failed to load feedback")
      return
    }

    setFeedback(data || [])
  }

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("feedback")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Failed to mark as read")
      return
    }

    setFeedback((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_read: true } : f))
    )
    if (selectedFeedback?.id === id) {
      setSelectedFeedback((prev) => prev ? { ...prev, is_read: true } : null)
    }
  }

  const markAsUnread = async (id: string) => {
    const { error } = await supabase
      .from("feedback")
      .update({ is_read: false, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Failed to mark as unread")
      return
    }

    setFeedback((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_read: false } : f))
    )
    if (selectedFeedback?.id === id) {
      setSelectedFeedback((prev) => prev ? { ...prev, is_read: false } : null)
    }
  }

  const openDetail = (item: Feedback) => {
    setSelectedFeedback(item)
    setIsDetailOpen(true)
    if (!item.is_read) {
      markAsRead(item.id)
    }
  }

  // Filtered feedback
  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          item.name.toLowerCase().includes(query) ||
          item.email?.toLowerCase().includes(query) ||
          item.message.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false
      }

      // Status filter
      if (statusFilter === "read" && !item.is_read) return false
      if (statusFilter === "unread" && item.is_read) return false

      // Date filter
      if (dateFilter !== "all") {
        const date = new Date(item.created_at)
        if (dateFilter === "today" && !isToday(date)) return false
        if (dateFilter === "week" && !isThisWeek(date)) return false
        if (dateFilter === "month" && !isThisMonth(date)) return false
      }

      return true
    })
  }, [feedback, searchQuery, categoryFilter, statusFilter, dateFilter])

  // Stats
  const stats = useMemo(() => {
    return {
      total: feedback.length,
      unread: feedback.filter((f) => !f.is_read).length,
      today: feedback.filter((f) => isToday(new Date(f.created_at))).length,
    }
  }, [feedback])

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredFeedback.map((item) => ({
      Name: item.name,
      Email: item.email || "-",
      Category: item.category,
      Message: item.message,
      Status: item.is_read ? "Read" : "Unread",
      "Submitted At": format(new Date(item.created_at), "yyyy-MM-dd HH:mm"),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Feedback")
    XLSX.writeFile(wb, `feedback_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`)
    toast.success("Exported to Excel successfully")
  }

  // Export to CSV
  const exportToCSV = () => {
    const exportData = filteredFeedback.map((item) => ({
      Name: item.name,
      Email: item.email || "-",
      Category: item.category,
      Message: item.message.replace(/"/g, '""'),
      Status: item.is_read ? "Read" : "Unread",
      "Submitted At": format(new Date(item.created_at), "yyyy-MM-dd HH:mm"),
    }))

    const headers = Object.keys(exportData[0] || {}).join(",")
    const rows = exportData.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    )
    const csv = [headers, ...rows].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `feedback_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`
    link.click()
    toast.success("Exported to CSV successfully")
  }

  // Sync to Google Sheets
  const syncToGoogleSheets = async () => {
    setIsSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Not authenticated")
        return
      }

      const response = await fetch("/api/admin/sync-feedback-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Sync failed")
      }

      const result = await response.json()
      toast.success(result.message || `Synced ${result.syncedCount} feedback entries to Google Sheets`)
    } catch (error: any) {
      console.error("Sync error:", error)
      toast.error(error.message || "Failed to sync to Google Sheets")
    } finally {
      setIsSyncing(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setDateFilter("all")
  }

  const hasActiveFilters = searchQuery || categoryFilter !== "all" || statusFilter !== "all" || dateFilter !== "all"

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Feedback Management</h1>
            <p className="text-muted-foreground mt-1">View and manage user feedback submissions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg hidden sm:block">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg hidden sm:block">
                    <Circle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.unread}</p>
                    <p className="text-xs text-muted-foreground">Unread</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg hidden sm:block">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.today}</p>
                    <p className="text-xs text-muted-foreground">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button onClick={() => loadFeedback()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export </span>Excel
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export </span>CSV
              </Button>
            </div>

            <Button
              onClick={syncToGoogleSheets}
              variant="default"
              size="sm"
              disabled={isSyncing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Sync to Sheets
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filter row */}
                <div className="flex flex-wrap gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
                    <SelectTrigger className="w-full sm:w-[130px]">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Results count */}
                <p className="text-sm text-muted-foreground">
                  Showing {filteredFeedback.length} of {feedback.length} entries
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          {filteredFeedback.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No feedback found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasActiveFilters ? "Try adjusting your filters" : "Feedback submissions will appear here"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !item.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""
                  }`}
                  onClick={() => openDetail(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{item.name}</span>
                          {!item.is_read && (
                            <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>

                        {item.email && (
                          <p className="text-sm text-muted-foreground truncate mb-1">
                            {item.email}
                          </p>
                        )}

                        <p className="text-sm text-gray-700 line-clamp-2">{item.message}</p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general}>
                            {item.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex sm:flex-col items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDetail(item)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback Detail
            </DialogTitle>
            <DialogDescription>
              Submitted {selectedFeedback && format(new Date(selectedFeedback.created_at), "PPpp")}
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4 mt-4">
              {/* Sender Info */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{selectedFeedback.name}</p>
                  {selectedFeedback.email ? (
                    <a
                      href={`mailto:${selectedFeedback.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedFeedback.email}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">No email provided</p>
                  )}
                </div>
              </div>

              {/* Category & Status */}
              <div className="flex items-center gap-2">
                <Badge className={CATEGORY_COLORS[selectedFeedback.category] || CATEGORY_COLORS.general}>
                  {selectedFeedback.category}
                </Badge>
                <Badge variant={selectedFeedback.is_read ? "secondary" : "default"}>
                  {selectedFeedback.is_read ? "Read" : "Unread"}
                </Badge>
              </div>

              {/* Message */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Message</h4>
                <div className="p-3 bg-white border rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedFeedback.is_read ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsUnread(selectedFeedback.id)}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Mark as Unread
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead(selectedFeedback.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Read
                  </Button>
                )}

                {selectedFeedback.email && (
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                  >
                    <a href={`mailto:${selectedFeedback.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Reply
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
