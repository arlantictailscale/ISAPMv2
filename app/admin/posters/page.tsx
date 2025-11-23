"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import * as XLSX from "xlsx"

interface PosterSubmission {
  id: string
  user_id: string
  title: string
  content: string // Now stores abstract PDF URL or text
  authors: string
  university?: string
  keywords: string
  category: string
  submission_status: string
  file_url: string | null
  created_at: string
  updated_at: string
  rejection_comment: string | null
  can_resubmit: boolean
  user_email?: string
  user_name?: string
  topic?: string
}

export default function AdminPostersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [submissions, setSubmissions] = useState<PosterSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionComment, setRejectionComment] = useState("")
  const [allowResubmit, setAllowResubmit] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingSubmission, setViewingSubmission] = useState<PosterSubmission | null>(null)

  useEffect(() => {
    checkAdminAndFetchSubmissions()
  }, [])

  const checkAdminAndFetchSubmissions = async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profile || profile.role !== "admin") {
        toast.error("Unauthorized access - Admin role required")
        router.push("/")
        return
      }

      await fetchSubmissions()
    } catch (err) {
      console.error("Error checking admin status:", err)
      toast.error("Failed to load admin panel")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true)
      console.log("[v0] Fetching poster submissions for admin via API...")

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("No active session")
      }

      const response = await fetch("/api/admin/posters", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch submissions")
      }

      const { submissions: transformedData } = await response.json()

      console.log("[v0] Fetched submissions via API:", transformedData?.length || 0)

      setSubmissions(transformedData || [])
    } catch (error: any) {
      console.error("[v0] Error fetching poster submissions:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load poster submissions",
        variant: "destructive",
      })
      setSubmissions([])
    } finally {
      setIsLoading(false)
    }
  }

  const updateSubmissionStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id)

      const { error } = await supabase
        .from("abstracts")
        .update({
          submission_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      if (newStatus === "accepted") {
        const submission = submissions.find((s) => s.id === id)
        if (submission) {
          console.log("[v0] Found submission for acceptance:", {
            id: submission.id,
            title: submission.title,
            user_email: submission.user_email,
            user_name: submission.user_name,
            user_id: submission.user_id,
          })

          if (!submission.user_email || submission.user_email === "Unknown") {
            console.error("[v0] Cannot send email - no valid email address found")
            toast.error("Cannot send email - no email address found")
          } else {
            try {
              console.log("[v0] Sending acceptance email to:", submission.user_email)
              const response = await fetch("/api/send-poster-review-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: submission.user_email,
                  userName: submission.user_name || "Participant",
                  posterTitle: submission.title,
                  status: "accepted",
                }),
              })

              const result = await response.json()

              if (!response.ok) {
                console.error("[v0] Failed to send acceptance email:", result)
                toast.error("Failed to send acceptance email")
              } else {
                console.log("[v0] Acceptance email sent successfully")
                toast.success("Acceptance email sent")
              }
            } catch (emailError) {
              console.error("[v0] Error sending acceptance email:", emailError)
              toast.error("Error sending acceptance email")
            }
          }
        } else {
          console.error("[v0] Submission not found in local state")
        }
      }

      toast.success(`Submission ${newStatus}`)
      await fetchSubmissions()
    } catch (err) {
      console.error("Error updating submission:", err)
      toast.error("Failed to update submission status")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRejectWithComment = async () => {
    if (!rejectingId) return

    try {
      setUpdatingId(rejectingId)

      const { error } = await supabase
        .from("abstracts")
        .update({
          submission_status: "rejected",
          rejection_comment: rejectionComment || null,
          can_resubmit: allowResubmit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rejectingId)

      if (error) throw error

      const submission = submissions.find((s) => s.id === rejectingId)
      if (submission) {
        console.log("[v0] Found submission for rejection:", {
          id: submission.id,
          title: submission.title,
          user_email: submission.user_email,
          user_name: submission.user_name,
          user_id: submission.user_id,
        })

        if (!submission.user_email || submission.user_email === "Unknown") {
          console.error("[v0] Cannot send email - no valid email address found")
          toast.error("Cannot send email - no email address found")
        } else {
          try {
            console.log("[v0] Sending rejection email to:", submission.user_email)
            const response = await fetch("/api/send-poster-review-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: submission.user_email,
                userName: submission.user_name || "Participant",
                posterTitle: submission.title,
                status: "rejected",
                rejectionComment: rejectionComment || undefined,
                canResubmit: allowResubmit,
              }),
            })

            const result = await response.json()

            if (!response.ok) {
              console.error("[v0] Failed to send rejection email:", result)
              toast.error("Failed to send rejection email")
            } else {
              console.log("[v0] Rejection email sent successfully")
              toast.success("Rejection email sent")
            }
          } catch (emailError) {
            console.error("[v0] Error sending rejection email:", emailError)
            toast.error("Error sending rejection email")
          }
        }
      } else {
        console.error("[v0] Submission not found in local state")
      }

      toast.success("Submission rejected")
      await fetchSubmissions()

      setRejectingId(null)
      setRejectionComment("")
      setAllowResubmit(true)
    } catch (err) {
      console.error("Error rejecting submission:", err)
      toast.error("Failed to reject submission")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteSubmission = async (id: string) => {
    try {
      setUpdatingId(id)

      const submission = submissions.find((s) => s.id === id)

      if (submission?.file_url) {
        try {
          const deleteResponse = await fetch("/api/delete-blob", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: submission.file_url }),
          })

          if (!deleteResponse.ok) {
            console.error("[v0] Failed to delete blob file")
          }
        } catch (blobError) {
          console.error("[v0] Error deleting blob:", blobError)
          // Continue with submission deletion even if blob deletion fails
        }
      }

      const { error } = await supabase.from("abstracts").delete().eq("id", id)

      if (error) throw error

      toast.success("Submission deleted successfully")
      await fetchSubmissions()
      setDeletingId(null)
    } catch (err) {
      console.error("Error deleting submission:", err)
      toast.error("Failed to delete submission")
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.keywords?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.topic?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || submission.submission_status === filterStatus
    const matchesCategory = filterCategory === "all" || submission.topic === filterCategory

    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            Pending Review
          </Badge>
        )
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            Accepted
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    total: filteredSubmissions.length,
    pending: filteredSubmissions.filter((s) => s.submission_status === "pending").length,
    accepted: filteredSubmissions.filter((s) => s.submission_status === "accepted").length,
    rejected: filteredSubmissions.filter((s) => s.submission_status === "rejected").length,
    emergencies: filteredSubmissions.filter((s) => s.topic === "Emergencies (Kegawatdaruratan)").length,
    pain_management: filteredSubmissions.filter((s) => s.topic === "Pain Management (Manajemen Nyeri)").length,
    icu_management: filteredSubmissions.filter((s) => s.topic === "ICU Management (Manajemen ICU)").length,
    anesthesia_management: filteredSubmissions.filter((s) => s.topic === "Anesthesia Management (Manajemen Anestesi)")
      .length,
  }

  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredSubmissions.map((sub) => ({
        Title: sub.title,
        Authors: sub.authors,
        Topic: sub.topic || "-",
        Category: sub.category,
        Keywords: sub.keywords || "",
        Abstract: sub.content,
        Status: sub.submission_status,
        "Submitted By": sub.user_name || "N/A",
        Email: sub.user_email || "N/A",
        "Has File": sub.file_url ? "Yes" : "No",
        "Can Resubmit": sub.can_resubmit ? "Yes" : "No",
        "Rejection Comment": sub.rejection_comment || "",
        "Submission Date": new Date(sub.created_at).toLocaleDateString(),
        "Last Updated": new Date(sub.updated_at).toLocaleDateString(),
        University: sub.university || "-",
      }))

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "E-Poster Submissions")

      // Set column widths for better readability
      const colWidths = [
        { wch: 50 }, // Title
        { wch: 40 }, // Authors
        { wch: 30 }, // Topic
        { wch: 20 }, // Category
        { wch: 30 }, // Keywords
        { wch: 80 }, // Abstract
        { wch: 15 }, // Status
        { wch: 25 }, // Submitted By
        { wch: 30 }, // Email
        { wch: 10 }, // Has File
        { wch: 12 }, // Can Resubmit
        { wch: 50 }, // Rejection Comment
        { wch: 15 }, // Submission Date
        { wch: 15 }, // Last Updated
        { wch: 30 }, // University
      ]
      ws["!cols"] = colWidths

      // Generate filename with current date
      const filename = `ISAPM2026-Posters-${new Date().toISOString().split("T")[0]}.xlsx`

      // Write file
      XLSX.writeFile(wb, filename)

      toast.success(`Exported ${filteredSubmissions.length} submissions to Excel`)
    } catch (error) {
      console.error("[v0] Error exporting to Excel:", error)
      toast.error("Failed to export to Excel")
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 overflow-x-hidden">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">E-Poster Submissions</h1>
            <p className="text-lg text-muted-foreground">Review and manage all abstract submissions</p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button onClick={exportToExcel} variant="outline" className="whitespace-nowrap gap-2 bg-transparent">
                <FileSpreadsheet className="w-4 h-4" />
                Export to Excel
              </Button>
            </div>

            <Card className="w-full max-w-full overflow-x-hidden">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-x-hidden">
                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium">Status:</Label>
                  <div className="flex flex-wrap gap-2 w-full">
                    <Button
                      variant={filterStatus === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                    >
                      All ({submissions.length})
                    </Button>
                    <Button
                      variant={filterStatus === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("pending")}
                    >
                      Pending ({submissions.filter((s) => s.submission_status === "pending").length})
                    </Button>
                    <Button
                      variant={filterStatus === "accepted" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("accepted")}
                    >
                      Accepted ({submissions.filter((s) => s.submission_status === "accepted").length})
                    </Button>
                    <Button
                      variant={filterStatus === "rejected" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("rejected")}
                    >
                      Rejected ({submissions.filter((s) => s.submission_status === "rejected").length})
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <Label className="text-sm font-medium">Topic:</Label>
                  <div className="flex flex-wrap gap-2 w-full">
                    <Button
                      variant={filterCategory === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterCategory("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterCategory === "Emergencies (Kegawatdaruratan)" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterCategory("Emergencies (Kegawatdaruratan)")}
                    >
                      Emergencies
                    </Button>
                    <Button
                      variant={filterCategory === "Pain Management (Manajemen Nyeri)" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterCategory("Pain Management (Manajemen Nyeri)")}
                    >
                      Pain Mgmt
                    </Button>
                    <Button
                      variant={filterCategory === "ICU Management (Manajemen ICU)" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterCategory("ICU Management (Manajemen ICU)")}
                    >
                      ICU Mgmt
                    </Button>
                    <Button
                      variant={filterCategory === "Anesthesia Management (Manajemen Anestesi)" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterCategory("Anesthesia Management (Manajemen Anestesi)")}
                    >
                      Anesthesia
                    </Button>
                  </div>
                </div>

                {(filterStatus !== "all" || filterCategory !== "all" || searchTerm) && (
                  <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterStatus("all")
                        setFilterCategory("all")
                        setSearchTerm("")
                      }}
                    >
                      Clear Filters
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {filteredSubmissions.length} of {submissions.length} shown
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3 w-full max-w-full overflow-x-hidden">
              {filteredSubmissions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No submissions found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredSubmissions.map((submission) => (
                  <Card key={submission.id} className="w-full max-w-full overflow-x-hidden">
                    <CardContent className="p-4 overflow-x-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 w-full min-w-0">
                        <div className="flex-1 min-w-0 space-y-2 overflow-x-hidden">
                          <h3 className="font-semibold text-base leading-tight break-words overflow-wrap-anywhere">
                            {submission.title}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium">Authors:</span> {submission.authors}
                            </p>
                            {submission.university && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">University:</span> {submission.university}
                              </p>
                            )}
                            <p className="text-muted-foreground">
                              <span className="font-medium">Category:</span> {submission.category}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Submitted:</span>{" "}
                              {new Date(submission.created_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            {submission.user_name && (
                              <p className="text-muted-foreground truncate">
                                <span className="font-medium">Submitter:</span> {submission.user_name}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            {getStatusBadge(submission.submission_status)}
                            {submission.topic && (
                              <Badge variant="secondary" className="text-xs">
                                {submission.topic.split("(")[0].trim()}
                              </Badge>
                            )}
                            {submission.content && submission.content.includes("blob.vercel-storage.com") && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Abstract PDF
                              </Badge>
                            )}
                            {submission.file_url && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Poster File
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => setViewingSubmission(submission)}>
                            View Details
                          </Button>
                          {submission.submission_status === "pending" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => updateSubmissionStatus(submission.id, "accepted")}
                                disabled={updatingId === submission.id}
                              >
                                {updatingId === submission.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setRejectingId(submission.id)}
                                disabled={updatingId === submission.id}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </section>

        <AlertDialog open={!!viewingSubmission} onOpenChange={(open) => !open && setViewingSubmission(null)}>
          <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl break-words overflow-wrap-anywhere">
                {viewingSubmission?.title}
              </AlertDialogTitle>
            </AlertDialogHeader>

            {viewingSubmission && (
              <div className="space-y-4 py-4 overflow-x-hidden">
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(viewingSubmission.submission_status)}
                  {viewingSubmission.topic && <Badge variant="secondary">{viewingSubmission.topic}</Badge>}
                  {viewingSubmission.submission_status === "rejected" && viewingSubmission.can_resubmit && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                      Resubmission Allowed
                    </Badge>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Authors:</Label>
                    <p className="text-sm text-muted-foreground break-words mt-1">{viewingSubmission.authors}</p>
                  </div>
                  {viewingSubmission.university && (
                    <div>
                      <Label className="text-sm font-medium">University/Institution:</Label>
                      <p className="text-sm text-muted-foreground break-words mt-1">{viewingSubmission.university}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Category:</Label>
                    <p className="text-sm text-muted-foreground break-words mt-1">{viewingSubmission.category}</p>
                  </div>
                  {viewingSubmission.keywords && (
                    <div>
                      <Label className="text-sm font-medium">Keywords:</Label>
                      <p className="text-sm text-muted-foreground break-words mt-1">{viewingSubmission.keywords}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Abstract:</Label>
                  {viewingSubmission.content && viewingSubmission.content.includes("blob.vercel-storage.com") ? (
                    <div className="mt-2">
                      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                        <a href={viewingSubmission.content} target="_blank" rel="noopener noreferrer" download>
                          <FileText className="w-4 h-4 mr-2" />
                          Download Abstract PDF
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-1">
                      {viewingSubmission.content}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <Label className="text-sm font-medium">Submitted by:</Label>
                    <p className="text-sm text-muted-foreground break-all mt-1">
                      {viewingSubmission.user_name || "Unknown"}
                      <br />
                      {viewingSubmission.user_email || "No email"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Submission date:</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(viewingSubmission.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {viewingSubmission.rejection_comment && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-red-600">Rejection Reason:</Label>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-1">
                      {viewingSubmission.rejection_comment}
                    </p>
                  </div>
                )}

                {viewingSubmission.file_url && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block">Poster File:</Label>
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                      <a href={viewingSubmission.file_url} target="_blank" rel="noopener noreferrer" download>
                        <FileText className="w-4 h-4 mr-2" />
                        Download Poster File
                      </a>
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {viewingSubmission.submission_status === "pending" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          updateSubmissionStatus(viewingSubmission.id, "accepted")
                          setViewingSubmission(null)
                        }}
                        disabled={updatingId === viewingSubmission.id}
                      >
                        {updatingId === viewingSubmission.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setRejectingId(viewingSubmission.id)
                          setViewingSubmission(null)
                        }}
                        disabled={updatingId === viewingSubmission.id}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {viewingSubmission.submission_status !== "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSubmissionStatus(viewingSubmission.id, "pending")
                        setViewingSubmission(null)
                      }}
                      disabled={updatingId === viewingSubmission.id}
                    >
                      {updatingId === viewingSubmission.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Reset to Pending
                    </Button>
                  )}
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!rejectingId}
          onOpenChange={(open) => {
            if (!open) {
              setRejectingId(null)
              setRejectionComment("")
              setAllowResubmit(true)
            }
          }}
        >
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Submission</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for rejection. This will be shown to the participant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-comment">Rejection Reason</Label>
                <Textarea
                  id="rejection-comment"
                  placeholder="Explain why this submission is being rejected..."
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  Providing detailed feedback helps participants improve their work.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-resubmit"
                  checked={allowResubmit}
                  onCheckedChange={(checked) => setAllowResubmit(checked as boolean)}
                />
                <label
                  htmlFor="allow-resubmit"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Allow participant to resubmit
                </label>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRejectWithComment}
                className="bg-red-600 hover:bg-red-700"
                disabled={updatingId === rejectingId}
              >
                {updatingId === rejectingId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reject Submission
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </>
  )
}
