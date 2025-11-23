"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle, Clock, Download, Upload, ArrowLeft, AlertCircle, Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { format } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Abstract {
  id: string
  title: string
  authors: string
  university?: string
  category: string
  topic?: string
  content: string
  submission_status: string
  created_at: string
  updated_at: string
  file_url: string | null
  rejection_comment: string | null
  can_resubmit: boolean
}

export default function PosterDetailPage() {
  const [abstract, setAbstract] = useState<Abstract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState("")
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const fetchAbstract = async () => {
      try {
        setIsLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          toast.error("You need to be logged in to view this submission.")
          return
        }

        const { data: abstractData, error: abstractError } = await supabase
          .from("abstracts")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single()

        if (abstractError) {
          console.error("[v0] Error fetching abstract:", abstractError)
          toast.error("Failed to load submission")
          router.push("/my-posters")
          return
        }

        setAbstract(abstractData)
      } catch (err) {
        console.error("[v0] Error in fetchAbstract:", err)
        toast.error("An error occurred while loading the submission")
        router.push("/my-posters")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAbstract()
  }, [supabase, router, params.id])

  const validateFile = (file: File) => {
    const validTypes = ["application/pdf"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PDF file.")
      return false
    }

    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit.")
      return false
    }

    return true
  }

  const handleFileReupload = async () => {
    if (!selectedFile || !abstract) return

    try {
      setIsUploading(true)
      setUploadProgress("Validating file...")

      if (!validateFile(selectedFile)) {
        setIsUploading(false)
        return
      }

      // Delete old file if it exists
      if (abstract.file_url) {
        setUploadProgress("Deleting old file...")
        try {
          const deleteResponse = await fetch("/api/delete-blob", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: abstract.file_url }),
          })

          if (!deleteResponse.ok) {
            console.error("[v0] Failed to delete old blob file")
          }
        } catch (deleteError) {
          console.error("[v0] Error deleting old blob:", deleteError)
          // Continue with upload even if delete fails
        }
      }

      setUploadProgress("Uploading new file...")

      // Upload new file
      const formData = new FormData()
      formData.append("file", selectedFile)

      const uploadResponse = await fetch("/api/upload-poster", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url: newFileUrl } = await uploadResponse.json()

      setUploadProgress("Updating submission...")

      // Update abstract with new file URL
      const { error: updateError } = await supabase
        .from("abstracts")
        .update({
          file_url: newFileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", abstract.id)

      if (updateError) throw updateError

      toast.success("Poster file updated successfully!")

      // Update local state
      setAbstract({ ...abstract, file_url: newFileUrl })
      setSelectedFile(null)
      setUploadProgress("")
    } catch (error) {
      console.error("[v0] Error reuploading file:", error)
      toast.error("Failed to update poster file. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

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

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading submission details...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!abstract) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Submission not found</p>
            <Link href="/my-posters">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Submissions
              </Button>
            </Link>
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
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-x-hidden">
          <div className="max-w-4xl mx-auto overflow-x-hidden">
            <Link href="/my-posters">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Submissions
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap min-w-0">
              <div className="min-w-0 max-w-full">
                <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2 break-words">E-Poster Details</h1>
                <p className="text-muted-foreground">View complete submission information</p>
              </div>
              {getStatusBadge(abstract.submission_status)}
            </div>
          </div>
        </section>

        <section className="py-12 px-4 overflow-x-hidden">
          <div className="max-w-4xl mx-auto space-y-6 overflow-x-hidden">
            {abstract.submission_status === "rejected" && (
              <>
                {abstract.rejection_comment && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Rejection Feedback from Reviewer</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap break-words mt-2">
                      {abstract.rejection_comment}
                    </AlertDescription>
                  </Alert>
                )}

                {abstract.can_resubmit && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Resubmission Available</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p>
                        You are allowed to revise and resubmit this abstract. Please address the feedback provided above
                        before submitting a new version.
                      </p>
                      <Button asChild>
                        <Link href="/submit-poster">
                          <Plus className="w-4 h-4 mr-2" />
                          Submit Revised Version
                        </Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <Card className="overflow-x-hidden">
              <CardHeader>
                <CardTitle>Title</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <p className="text-lg break-words">{abstract.title}</p>
              </CardContent>
            </Card>

            <Card className="overflow-x-hidden">
              <CardHeader>
                <CardTitle>Authors</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <p className="break-words">{abstract.authors}</p>
              </CardContent>
            </Card>

            {abstract.university && (
              <Card className="overflow-x-hidden">
                <CardHeader>
                  <CardTitle>University/Institution</CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                  <p className="break-words">{abstract.university}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid sm:grid-cols-2 gap-6 overflow-x-hidden">
              <Card className="overflow-x-hidden">
                <CardHeader>
                  <CardTitle>Category</CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                  <p className="capitalize break-words">{abstract.category || "Not specified"}</p>
                </CardContent>
              </Card>

              {abstract.topic && (
                <Card className="overflow-x-hidden">
                  <CardHeader>
                    <CardTitle>Topic</CardTitle>
                  </CardHeader>
                  <CardContent className="min-w-0">
                    <p className="capitalize break-words">{abstract.topic}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card className="overflow-x-hidden">
              <CardHeader>
                <CardTitle>Abstract</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                {abstract.content && abstract.content.startsWith("http") ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Abstract submitted as PDF file</p>
                    <Button asChild variant="outline" size="sm">
                      <a href={abstract.content} target="_blank" rel="noopener noreferrer" download>
                        <Download className="w-4 h-4 mr-2 shrink-0" />
                        Download Abstract PDF
                      </a>
                    </Button>
                  </div>
                ) : abstract.content ? (
                  <p className="whitespace-pre-wrap break-words">{abstract.content}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No abstract provided</p>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-x-hidden">
              <CardHeader>
                <CardTitle>Poster File</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                {abstract.file_url ? (
                  <div className="space-y-4 overflow-x-hidden">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>File uploaded successfully</span>
                    </div>
                    <Button asChild variant="outline" className="w-full sm:w-auto bg-transparent">
                      <a href={abstract.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="w-4 h-4 mr-2 shrink-0" />
                        Download Current File
                      </a>
                    </Button>

                    {abstract.submission_status !== "accepted" && (
                      <div className="pt-4 border-t space-y-4 overflow-x-hidden">
                        <div>
                          <Label htmlFor="file-reupload" className="text-base font-semibold">
                            Replace Poster File
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1 mb-3 break-words">
                            Upload a new poster file to replace the current one. The old file will be permanently
                            deleted.
                          </p>
                        </div>

                        <div className="space-y-3 overflow-x-hidden">
                          <Input
                            id="file-reupload"
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="max-w-full"
                          />

                          {selectedFile && (
                            <div className="flex items-center gap-2 text-sm min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                              <span className="text-muted-foreground truncate">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                          )}

                          {uploadProgress && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              {uploadProgress}
                            </p>
                          )}

                          <Button
                            onClick={handleFileReupload}
                            disabled={!selectedFile || isUploading}
                            className="w-full sm:w-auto"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2 shrink-0" />
                                Upload New File
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {abstract.submission_status === "accepted" && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Submission Accepted</AlertTitle>
                        <AlertDescription>
                          This submission has been accepted. The poster file cannot be modified or deleted at this
                          stage.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    <span>No file uploaded</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-x-hidden">
              <CardHeader>
                <CardTitle>Submission Information</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <div className="grid sm:grid-cols-2 gap-4 text-sm overflow-x-hidden">
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="ml-2 font-medium break-words">
                      {format(new Date(abstract.created_at), "MMMM dd, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                  {abstract.updated_at !== abstract.created_at && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="ml-2 font-medium break-words">
                        {format(new Date(abstract.updated_at), "MMMM dd, yyyy 'at' HH:mm")}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 col-span-full">
                    <span className="text-muted-foreground">Submission ID:</span>
                    <span className="ml-2 font-mono text-xs break-all">{abstract.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
