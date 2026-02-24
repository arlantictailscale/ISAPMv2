"use client"

import React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Loader2,
  Mail,
  Send,
  Users,
  Calendar,
  FileText,
  Eye,
  Save,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Video,
  Building2,
  Search,
  X,
  Plus,
  History,
  LayoutTemplate,
} from "lucide-react"
import { toast } from "sonner"

// Types
interface Recipient {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  institution: string | null
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  created_at: string
  updated_at: string
}

interface BroadcastHistory {
  id: string
  subject: string
  recipient_count: number
  segment: string
  sent_at: string
  status: "sent" | "failed" | "partial"
}

interface SegmentOption {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  filter: string
}

const SEGMENT_OPTIONS: SegmentOption[] = [
  {
    id: "all",
    label: "All Users",
    description: "Send to all registered users",
    icon: <Users className="w-4 h-4" />,
    filter: "all",
  },
  {
    id: "symposium",
    label: "Symposium Registrants",
    description: "Users who purchased symposium tickets",
    icon: <Ticket className="w-4 h-4" />,
    filter: "symposium",
  },
  {
    id: "workshop",
    label: "Workshop Registrants",
    description: "Users who purchased workshop tickets",
    icon: <ShoppingBag className="w-4 h-4" />,
    filter: "workshop",
  },
  {
    id: "webinar",
    label: "Webinar Registrants",
    description: "Users who purchased webinar access",
    icon: <Video className="w-4 h-4" />,
    filter: "webinar",
  },
  {
    id: "cpd",
    label: "CPD Registrants",
    description: "Users who purchased CPD courses",
    icon: <FileText className="w-4 h-4" />,
    filter: "cpd",
  },
  {
    id: "hotel",
    label: "Hotel Bookings",
    description: "Users with hotel reservations",
    icon: <Building2 className="w-4 h-4" />,
    filter: "hotel",
  },
  {
    id: "verified",
    label: "Verified Payments",
    description: "Users with verified payment status",
    icon: <CheckCircle className="w-4 h-4" />,
    filter: "verified",
  },
  {
    id: "pending",
    label: "Pending Payments",
    description: "Users with pending payment verification",
    icon: <Clock className="w-4 h-4" />,
    filter: "pending",
  },
]

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "reminder",
    name: "Event Reminder",
    subject: "Reminder: ISAPM 8th National Meeting 2026 is Coming Soon!",
    content: `Dear {{name}},

This is a friendly reminder that the ISAPM 8th National Meeting 2026 is approaching!

Event Details:
- Date: April 16-19, 2026
- Venue: The Singhasari Resort, Batu, Malang, Indonesia

Please make sure to:
1. Complete your registration if you haven't already
2. Book your hotel accommodation
3. Review the event schedule

We look forward to seeing you there!

Best regards,
ISAPM 2026 Team`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "announcement",
    name: "General Announcement",
    subject: "Important Announcement from ISAPM 2026",
    content: `Dear {{name}},

We have an important announcement for you regarding ISAPM 8th National Meeting 2026.

{{message}}

If you have any questions, please don't hesitate to contact us.

Best regards,
ISAPM 2026 Team`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "schedule_update",
    name: "Schedule Update",
    subject: "Schedule Update: ISAPM 8th National Meeting 2026",
    content: `Dear {{name}},

We would like to inform you about an update to the event schedule for ISAPM 8th National Meeting 2026.

{{message}}

Please check the updated schedule on our website for more details.

Thank you for your understanding.

Best regards,
ISAPM 2026 Team`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function AdminEmailBroadcastPage() {
  const router = useRouter()
  const supabase = createClient()

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false)
  
  // Email composition
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [selectedSegment, setSelectedSegment] = useState<string>("all")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(true)
  
  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [newTemplateName, setNewTemplateName] = useState("")
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  
  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  
  // Preview & Confirmation
  const [showPreview, setShowPreview] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // History
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastHistory[]>([])

  // Quota tracking (Resend Free Plan)
  const [quotaStatus, setQuotaStatus] = useState<{
    sent_today: number
    remaining_today: number
    daily_limit: number
    reset_time: string
    can_send: boolean
    is_over_quota: boolean
  } | null>(null)
  const [quotaError, setQuotaError] = useState<string | null>(null)

  // Check admin access
  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      setIsLoading(true)
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

      if (!profile || profile.role !== "admin") {
        toast.error("Unauthorized access")
        router.push("/")
        return
      }

      await loadRecipients("all")
      await loadBroadcastHistory()
      await getQuotaStatus()
    } catch (err) {
      console.error("Error checking admin status:", err)
      toast.error("Failed to load admin panel")
    } finally {
      setIsLoading(false)
    }
  }

  const getQuotaStatus = async () => {
    try {
      const response = await fetch("/api/admin/quota-status")
      if (!response.ok) {
        console.error("[v0] Failed to fetch quota status:", response.statusText)
        setQuotaError("Could not load email quota")
        return
      }
      const data = await response.json()
      setQuotaStatus(data.quota)
      setQuotaError(null)
    } catch (error) {
      console.error("[v0] Error fetching quota status:", error)
      setQuotaError("Failed to load quota information")
    }
  }

  const loadRecipients = useCallback(async (segment: string) => {
    setIsLoadingRecipients(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/admin/email-recipients?segment=${segment}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch recipients")

      const data = await response.json()
      setRecipients(data.recipients || [])
      setFilteredRecipients(data.recipients || [])
      setSelectedRecipients(new Set((data.recipients || []).map((r: Recipient) => r.id)))
      setSelectAll(true)
    } catch (err) {
      console.error("Error loading recipients:", err)
      toast.error("Failed to load recipients")
    } finally {
      setIsLoadingRecipients(false)
    }
  }, [supabase])

  const loadBroadcastHistory = async () => {
    // In a real app, this would fetch from the database
    // For now, we'll use localStorage or an empty array
    const stored = localStorage.getItem("broadcast_history")
    if (stored) {
      setBroadcastHistory(JSON.parse(stored))
    }
  }

  // Handle segment change
  useEffect(() => {
    if (selectedSegment) {
      loadRecipients(selectedSegment)
    }
  }, [selectedSegment, loadRecipients])

  // Filter recipients by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecipients(recipients)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredRecipients(
        recipients.filter(
          (r) =>
            r.email.toLowerCase().includes(query) ||
            (r.full_name && r.full_name.toLowerCase().includes(query)) ||
            (r.institution && r.institution.toLowerCase().includes(query))
        )
      )
    }
  }, [searchQuery, recipients])

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setContent(template.content)
    }
  }

  // Toggle recipient selection
  const toggleRecipient = (id: string) => {
    const newSelected = new Set(selectedRecipients)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRecipients(newSelected)
    setSelectAll(newSelected.size === filteredRecipients.length)
  }

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRecipients(new Set())
    } else {
      setSelectedRecipients(new Set(filteredRecipients.map((r) => r.id)))
    }
    setSelectAll(!selectAll)
  }

  // Save template
  const saveTemplate = () => {
    if (!newTemplateName.trim() || !subject.trim() || !content.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    const newTemplate: EmailTemplate = {
      id: `custom_${Date.now()}`,
      name: newTemplateName,
      subject,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setTemplates([...templates, newTemplate])
    setShowSaveTemplateDialog(false)
    setNewTemplateName("")
    toast.success("Template saved successfully")
  }

  // Delete template
  const deleteTemplate = (templateId: string) => {
    if (DEFAULT_TEMPLATES.find((t) => t.id === templateId)) {
      toast.error("Cannot delete default templates")
      return
    }
    setTemplates(templates.filter((t) => t.id !== templateId))
    if (selectedTemplate === templateId) {
      setSelectedTemplate("")
    }
    toast.success("Template deleted")
  }

  // Generate preview HTML
  const generatePreviewHtml = (recipientName: string = "John Doe") => {
    const processedContent = content
      .replace(/\{\{name\}\}/g, recipientName)
      .replace(/\{\{message\}\}/g, "[Your message here]")
      .replace(/\n/g, "<br>")

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; }
            .header { background: linear-gradient(135deg, #00A9E0 0%, #0088B8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; padding: 25px 20px; color: #666; font-size: 12px; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
            </div>
            <div class="content">
              <p>${processedContent}</p>
            </div>
            <div class="footer">
              <p><strong>ISAPM 8th National Meeting 2026</strong></p>
              <p>Email: admin@isapm2026.org | Phone: +6289602626709</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Send broadcast
  const sendBroadcast = async () => {
    console.log("[v0] sendBroadcast called")
    
    if (!subject.trim() || !content.trim()) {
      toast.error("Please fill in subject and content")
      return
    }

    if (selectedRecipients.size === 0) {
      toast.error("Please select at least one recipient")
      return
    }

    setIsSending(true)
    setShowConfirmDialog(false)
    console.log("[v0] Starting email send process")

    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log("[v0] Session:", session ? "exists" : "null")
      
      if (!session) {
        toast.error("Session expired")
        setIsSending(false)
        return
      }

      // Use unfiltered recipients list to ensure all selected recipients are included
      // (filteredRecipients may be filtered by search, which would exclude selected users)
      const recipientList = recipients.filter((r) => selectedRecipients.has(r.id))
      console.log("[v0] Recipient count:", recipientList.length)

      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("[v0] Request timeout - aborting")
        controller.abort()
      }, 120000) // 2 minute timeout

      console.log("[v0] Sending request to API...")
      const response = await fetch("/api/admin/send-broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject,
          content,
          recipients: recipientList,
          segment: selectedSegment,
          scheduled: isScheduled ? { date: scheduledDate, time: scheduledTime } : null,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("[v0] Response received, status:", response.status)

      const result = await response.json()
      console.log("[v0] Response body:", result)

      // Handle queued broadcasts (202 Accepted)
      if (response.status === 202) {
        console.log("[v0] Broadcast queued due to rate limits")
        toast.info(result.message || "Broadcast queued due to rate limits. Will resume tomorrow.")
        await getQuotaStatus() // Refresh quota
        return
      }

      if (!response.ok) {
        // Enhanced error messages for rate limits and quotas
        if (response.status === 429 && result.quota_status) {
          const quota = result.quota_status
          const msg = `Daily email limit reached (${quota.used_today}/${quota.limit}). Remaining emails will be queued for tomorrow.`
          toast.error(msg)
          await getQuotaStatus() // Refresh quota
          return
        }
        throw new Error(result.error || "Failed to send broadcast")
      }

      // Success - broadcast was sent
      console.log(`[v0] Broadcast completed: ${result.stats?.sent} sent, ${result.stats?.failed} failed, ${result.stats?.queued} queued`)
      
      // Add to history
      const historyEntry: BroadcastHistory = {
        id: `broadcast_${Date.now()}`,
        subject,
        recipient_count: recipientList.length,
        segment: SEGMENT_OPTIONS.find((s) => s.id === selectedSegment)?.label || selectedSegment,
        sent_at: new Date().toISOString(),
        status: "sent",
      }
      const newHistory = [historyEntry, ...broadcastHistory].slice(0, 20)
      setBroadcastHistory(newHistory)
      localStorage.setItem("broadcast_history", JSON.stringify(newHistory))

      // Show success with queuing info if applicable
      let successMsg = `Broadcast sent to ${result.stats?.sent || recipientList.length} recipients!`
      if (result.stats?.queued > 0) {
        successMsg += ` ${result.stats.queued} emails queued for tomorrow.`
      }
      toast.success(successMsg)
      console.log("[v0] Email broadcast successful")
      
      // Refresh quota status
      await getQuotaStatus()
      
      // Reset form
      setSubject("")
      setContent("")
      setSelectedTemplate("")
    } catch (err) {
      console.error("[v0] Error sending broadcast:", err)
      if (err instanceof Error) {
        console.error("[v0] Error name:", err.name)
        console.error("[v0] Error message:", err.message)
        console.error("[v0] Error stack:", err.stack)
      }
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("Request timed out after 2 minutes. Please try again or contact support if the issue persists.")
      } else if (err instanceof SyntaxError) {
        toast.error("Invalid response from server. Please check that the server is running and try again.")
        console.error("[v0] Response parsing error - server may be down or returned invalid JSON")
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to send broadcast")
      }
    } finally {
      console.log("[v0] Setting isSending to false")
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading email broadcast panel...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        {/* Header */}
        <section className="py-8 px-4 bg-gradient-to-br from-cyan-500/10 via-primary/5 to-purple-500/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-primary text-white">
                  <Mail className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold">Email Broadcast</h1>
                  <p className="text-muted-foreground">Send targeted email notifications to users</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => loadRecipients(selectedSegment)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="compose" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="compose" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Compose
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-2">
                  <LayoutTemplate className="w-4 h-4" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="w-4 h-4" />
                  History
                </TabsTrigger>
              </TabsList>

              {/* Compose Tab */}
              <TabsContent value="compose" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Recipients */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Recipients
                      </CardTitle>
                      <CardDescription>Select target audience for your email</CardDescription>
                      
                      {/* Daily Quota Warning */}
                      {quotaStatus && (
                        <div className={`mt-4 p-3 rounded-md border ${
                          quotaStatus.is_over_quota 
                            ? 'bg-red-50 border-red-200' 
                            : quotaStatus.remaining_today < 50
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-start gap-2">
                            {quotaStatus.is_over_quota ? (
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            ) : quotaStatus.remaining_today < 50 ? (
                              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                quotaStatus.is_over_quota 
                                  ? 'text-red-900' 
                                  : quotaStatus.remaining_today < 50
                                  ? 'text-yellow-900'
                                  : 'text-blue-900'
                              }`}>
                                Daily Email Quota: {quotaStatus.sent_today} / {quotaStatus.daily_limit}
                              </p>
                              <p className={`text-xs mt-1 ${
                                quotaStatus.is_over_quota 
                                  ? 'text-red-800' 
                                  : quotaStatus.remaining_today < 50
                                  ? 'text-yellow-800'
                                  : 'text-blue-800'
                              }`}>
                                {quotaStatus.is_over_quota 
                                  ? `Daily limit reached. Remaining broadcasts will be queued for tomorrow at ${new Date(quotaStatus.reset_time).toLocaleTimeString()}`
                                  : quotaStatus.remaining_today < 50
                                  ? `Only ${quotaStatus.remaining_today} emails remaining today. Large broadcasts will be queued.`
                                  : `${quotaStatus.remaining_today} emails available today`
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {quotaError && (
                        <div className="mt-4 p-3 rounded-md bg-gray-50 border border-gray-200">
                          <p className="text-xs text-gray-600">{quotaError}</p>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Segment Selection */}
                      <div className="space-y-2">
                        <Label>Target Segment</Label>
                        <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select segment" />
                          </SelectTrigger>
                          <SelectContent>
                            {SEGMENT_OPTIONS.map((segment) => (
                              <SelectItem key={segment.id} value={segment.id}>
                                <div className="flex items-center gap-2">
                                  {segment.icon}
                                  <span>{segment.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {SEGMENT_OPTIONS.find((s) => s.id === selectedSegment)?.description}
                        </p>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search recipients..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setSearchQuery("")}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Recipients List */}
                      <div className="border rounded-lg">
                        <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={toggleSelectAll}
                              id="select-all"
                            />
                            <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                              Select All
                            </Label>
                          </div>
                          <Badge variant="secondary">
                            {selectedRecipients.size} / {filteredRecipients.length}
                          </Badge>
                        </div>
                        <ScrollArea className="h-[300px]">
                          {isLoadingRecipients ? (
                            <div className="flex items-center justify-center h-full">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : filteredRecipients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                              <Users className="w-8 h-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">No recipients found</p>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {filteredRecipients.map((recipient) => (
                                <div
                                  key={recipient.id}
                                  className="p-3 hover:bg-muted/50 flex items-center gap-3 cursor-pointer"
                                  onClick={() => toggleRecipient(recipient.id)}
                                >
                                  <Checkbox
                                    checked={selectedRecipients.has(recipient.id)}
                                    onCheckedChange={() => toggleRecipient(recipient.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {recipient.full_name || 
                                       (recipient.first_name && recipient.last_name 
                                         ? `${recipient.first_name} ${recipient.last_name}` 
                                         : recipient.email.split("@")[0])}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {recipient.email}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right Column - Email Composer */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Compose Email
                      </CardTitle>
                      <CardDescription>Write your email content</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Template Selection */}
                      <div className="space-y-2">
                        <Label>Use Template (Optional)</Label>
                        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template or write custom" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom Email</SelectItem>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subject */}
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          placeholder="Enter email subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                          id="content"
                          placeholder="Write your email content here...

Use {{name}} to personalize with recipient's name.
Use {{message}} as a placeholder for custom messages."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="min-h-[250px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Available variables: {"{{name}}"} - Recipient name, {"{{message}}"} - Custom message
                        </p>
                      </div>

                      {/* Schedule Option */}
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="schedule"
                            checked={isScheduled}
                            onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
                          />
                          <Label htmlFor="schedule" className="flex items-center gap-2 cursor-pointer">
                            <Clock className="w-4 h-4" />
                            Schedule for later
                          </Label>
                        </div>
                        {isScheduled && (
                          <div className="grid grid-cols-2 gap-4 pl-6">
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Time</Label>
                              <Input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setShowPreview(true)}
                          disabled={!subject || !content}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowSaveTemplateDialog(true)}
                          disabled={!subject || !content}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save as Template
                        </Button>
                        <div className="flex-1" />
                        <Button
                          onClick={() => setShowConfirmDialog(true)}
                          disabled={!subject || !content || selectedRecipients.size === 0 || isSending}
                          className="bg-gradient-to-r from-cyan-500 to-primary hover:from-cyan-600 hover:to-primary/90"
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          {isScheduled ? "Schedule" : "Send"} to {selectedRecipients.size} Recipients
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LayoutTemplate className="w-5 h-5 text-primary" />
                      Email Templates
                    </CardTitle>
                    <CardDescription>Manage your saved email templates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              {!DEFAULT_TEMPLATES.find((t) => t.id === template.id) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteTemplate(template.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <CardDescription className="text-xs truncate">{template.subject}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                              {template.content.substring(0, 150)}...
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-transparent"
                              onClick={() => {
                                handleTemplateSelect(template.id)
                                toast.success("Template loaded")
                              }}
                            >
                              Use Template
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      Broadcast History
                    </CardTitle>
                    <CardDescription>View previously sent email broadcasts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {broadcastHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No broadcasts sent yet</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Segment</TableHead>
                            <TableHead className="text-center">Recipients</TableHead>
                            <TableHead>Sent At</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {broadcastHistory.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">{entry.subject}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{entry.segment}</Badge>
                              </TableCell>
                              <TableCell className="text-center">{entry.recipient_count}</TableCell>
                              <TableCell>
                                {new Date(entry.sent_at).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </TableCell>
                              <TableCell>
                                {entry.status === "sent" ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Sent
                                  </Badge>
                                ) : entry.status === "failed" ? (
                                  <Badge variant="destructive">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Partial
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>Preview how your email will look to recipients</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <div
              className="bg-white"
              dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>Save this email as a reusable template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="Enter template name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Email Broadcast</DialogTitle>
            <DialogDescription>
              Please review the details before sending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Subject</p>
                <p className="font-medium">{subject}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recipients</p>
                <p className="font-medium">{selectedRecipients.size} users</p>
              </div>
              <div>
                <p className="text-muted-foreground">Segment</p>
                <p className="font-medium">
                  {SEGMENT_OPTIONS.find((s) => s.id === selectedSegment)?.label}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Schedule</p>
                <p className="font-medium">
                  {isScheduled ? `${scheduledDate} at ${scheduledTime}` : "Send immediately"}
                </p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This action will send emails to {selectedRecipients.size} recipients. This cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={sendBroadcast} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confirm & Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
