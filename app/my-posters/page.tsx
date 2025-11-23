"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Upload,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { format } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Abstract {
  id: string
  title: string
  authors: string
  university?: string
  keywords: string
  content: string
  category: string
  submission_status: string
  created_at: string
  updated_at: string
  file_url: string | null
  rejection_comment: string | null
  can_resubmit: boolean
}

export default function MyPostersPage() {
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          toast.error("You need to be logged in to view your submissions.")
          return
        }

        setUser(user)

        const { data: abstractsData, error: abstractsError } = await supabase
          .from("abstracts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (abstractsError) {
          console.error("[v0] Error fetching abstracts:", abstractsError)
          toast.error("Failed to load your submissions")
          return
        }

        setAbstracts(abstractsData || [])
      } catch (err) {
        console.error("[v0] Error in fetchData:", err)
        toast.error("An error occurred while loading your data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        )
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Accepted
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  const handleDeleteSubmission = async (id: string) => {
    try {
      setDeletingId(id)

      const submission = abstracts.find((a) => a.id === id)

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

      const { error } = await supabase.from("abstracts").delete().eq("id", id).eq("user_id", user.id) // Extra security: ensure user owns the submission

      if (error) throw error

      toast.success("Submission deleted successfully")

      // Remove from local state
      setAbstracts(abstracts.filter((a) => a.id !== id))
      setDeletingId(null)
    } catch (err) {
      console.error("Error deleting submission:", err)
      toast.error("Failed to delete submission")
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your submissions...</p>
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
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 overflow-x-hidden">
            <div className="min-w-0 w-full sm:w-auto">
              <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2 break-words">My E-Poster Submissions</h1>
              <p className="text-muted-foreground break-words">View and manage your submitted abstracts</p>
            </div>
            <Link href="/submit-poster" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Submit New E-Poster
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto overflow-x-hidden">
            {abstracts.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold text-lg mb-2 break-words overflow-wrap-anywhere">No submissions yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't submitted any e-posters. Start by submitting your first abstract.
                  </p>
                  <Link href="/submit-poster">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Submit E-Poster
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {abstracts.map((abstract) => (
                  <Card key={abstract.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 min-w-0">
                        <div className="flex-1 min-w-0 w-full">
                          <CardTitle className="text-xl mb-2 break-words overflow-wrap-anywhere">
                            {abstract.title}
                          </CardTitle>
                          <CardDescription className="break-words overflow-wrap-anywhere space-y-1">
                            <div>
                              <span className="font-semibold">Authors:</span> {abstract.authors}
                            </div>
                            {abstract.university && (
                              <div>
                                <span className="font-semibold">University:</span> {abstract.university}
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        <div className="shrink-0">{getStatusBadge(abstract.submission_status)}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 min-w-0">
                      {abstract.submission_status === "rejected" && abstract.rejection_comment && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Rejection Feedback</AlertTitle>
                          <AlertDescription className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                            {abstract.rejection_comment}
                          </AlertDescription>
                        </Alert>
                      )}

                      {abstract.submission_status === "rejected" && abstract.can_resubmit && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Resubmission Allowed</AlertTitle>
                          <AlertDescription className="break-words">
                            You can submit a revised version of this abstract. Please address the feedback above before
                            resubmitting.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm min-w-0">
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="ml-2 font-medium capitalize break-words">{abstract.category}</span>
                        </div>
                        {abstract.keywords && (
                          <div className="min-w-0">
                            <span className="text-muted-foreground">Keywords:</span>
                            <span className="ml-2 font-medium break-words overflow-wrap-anywhere">
                              {abstract.keywords}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Submitted:</span>
                          <span className="ml-2 font-medium">
                            {format(new Date(abstract.created_at), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {abstract.updated_at !== abstract.created_at && (
                          <div className="min-w-0">
                            <span className="text-muted-foreground">Last Updated:</span>
                            <span className="ml-2 font-medium">
                              {format(new Date(abstract.updated_at), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground mb-2">Abstract:</p>
                        {abstract.content && abstract.content.includes("blob.vercel-storage.com") ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={abstract.content} target="_blank" rel="noopener noreferrer" download>
                              <Download className="w-4 h-4 mr-2" />
                              Download Abstract PDF
                            </a>
                          </Button>
                        ) : (
                          <p className="text-sm line-clamp-3 break-words overflow-wrap-anywhere">{abstract.content}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t min-w-0">
                        <p className="text-sm text-muted-foreground mb-2">Poster File:</p>
                        {abstract.file_url ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                              <a href={abstract.file_url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="w-4 h-4 mr-2" />
                                Download Poster File
                              </a>
                            </Button>
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              File uploaded
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              No file uploaded
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild className="flex-1 min-w-[120px] bg-transparent">
                          <Link href={`/my-posters/${abstract.id}`}>View Details</Link>
                        </Button>
                        {abstract.submission_status === "rejected" && abstract.can_resubmit && (
                          <Button variant="default" size="sm" asChild className="flex-1 min-w-[120px]">
                            <Link href="/submit-poster">
                              <Plus className="w-4 h-4 mr-2" />
                              Resubmit
                            </Link>
                          </Button>
                        )}
                        {abstract.submission_status !== "accepted" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingId === abstract.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 min-w-[120px] bg-transparent"
                              >
                                {deletingId === abstract.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this submission? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteSubmission(abstract.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
