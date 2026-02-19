"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, AlertCircle, Upload, X, FileText } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function SubmitPosterPage() {
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    university: "", // This will be pulled from user profile
    category: "", // Updated to match database constraint values
    topic: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthCheckLoading, setIsAuthCheckLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [selectedAbstractFile, setSelectedAbstractFile] = useState<File | null>(null)
  const [uploadedAbstractUrl, setUploadedAbstractUrl] = useState<string | null>(null)
  const [isUploadingAbstract, setIsUploadingAbstract] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      setIsAuthCheckLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        toast.error("You need to be logged in to submit an e-poster.")
        return
      }

      setUser(user)
      setIsAuthCheckLoading(false)
    }

    checkUser()
  }, [supabase, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["application/pdf"]

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PDF files are allowed.")
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit")
      return
    }

    setSelectedFile(file)
    setUploadedFileUrl(null)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadedFileUrl(null)
  }

  const handleAbstractFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["application/pdf"]

    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only PDF files are allowed.")
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit")
      return
    }

    setSelectedAbstractFile(file)
    setUploadedAbstractUrl(null)
  }

  const handleRemoveAbstractFile = () => {
    setSelectedAbstractFile(null)
    setUploadedAbstractUrl(null)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return null

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/upload-poster", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      setUploadedFileUrl(data.url)
      toast.success("Poster file uploaded successfully!")
      return data.url
    } catch (err: any) {
      console.error("[v0] Upload error:", err)
      toast.error(err.message || "Failed to upload file")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleAbstractUpload = async () => {
    if (!selectedAbstractFile) return null

    setIsUploadingAbstract(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedAbstractFile)

      const response = await fetch("/api/upload-poster", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      setUploadedAbstractUrl(data.url)
      toast.success("Abstract file uploaded successfully!")
      return data.url
    } catch (err: any) {
      console.error("[v0] Abstract upload error:", err)
      toast.error(err.message || "Failed to upload abstract file")
      return null
    } finally {
      setIsUploadingAbstract(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (!selectedFile && !uploadedFileUrl) {
        setError("Poster file is required. Please upload a PDF file before submitting.")
        toast.error("Poster file is required")
        setIsLoading(false)
        return
      }

      if (!selectedAbstractFile && !uploadedAbstractUrl) {
        setError("Abstract file is required. Please upload a PDF file before submitting.")
        toast.error("Abstract file is required")
        setIsLoading(false)
        return
      }

      let fileUrl = uploadedFileUrl
      if (selectedFile && !uploadedFileUrl) {
        fileUrl = await handleFileUpload()
        if (!fileUrl) {
          setError("Failed to upload poster file. Please try again.")
          return
        }
      }

      let abstractUrl = uploadedAbstractUrl
      if (selectedAbstractFile && !uploadedAbstractUrl) {
        abstractUrl = await handleAbstractUpload()
        if (!abstractUrl) {
          setError("Failed to upload abstract file. Please try again.")
          return
        }
      }

      const { error: insertError } = await supabase.from("abstracts").insert([
        {
          user_id: user.id,
          email: user.email,
          title: formData.title,
          authors: formData.authors,
          keywords: formData.topic, // Store topic in keywords field
          content: abstractUrl, // Store abstract PDF URL in content field
          category: formData.category, // Store category (Case Report/Research) in category field
          submission_status: "pending",
          file_url: fileUrl, // Store poster PDF URL in file_url field
          university: formData.university, // Use university from form input
        },
      ])

      if (insertError) {
        console.error("[v0] Error inserting abstract:", insertError)
        setError("Failed to submit e-poster. Please try again.")
        toast.error("Failed to submit e-poster: " + insertError.message)
        return
      }

      try {
        const userName = user.email?.split("@")[0] || "Participant"

        const response = await fetch("/api/send-poster-submission-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            userName,
            posterTitle: formData.title,
            topic: formData.topic,
          }),
        })

        if (!response.ok) {
          console.error("[v0] Failed to send confirmation email")
        }
      } catch (emailError) {
        console.error("[v0] Error sending email:", emailError)
      }

      toast.success("E-poster submitted successfully!")
      router.push("/my-posters")
    } catch (err) {
      console.error("[v0] Error in handleSubmit:", err)
      setError("An unexpected error occurred. Please try again.")
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthCheckLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 overflow-x-hidden w-full">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-x-hidden w-full">
          <div className="max-w-4xl mx-auto min-w-0 w-full">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6 break-words">Submit e-Poster</h1>
            <p className="text-lg text-muted-foreground mb-4 break-words">
              Submit your abstract for ISAPM 8th National Meeting 2026
            </p>
            <div className="flex gap-4 text-sm flex-wrap">
              <Link href="/call-for-papers" className="text-primary hover:underline font-semibold">
                View Submission Guidelines
              </Link>
            </div>
          </div>
        </section>

        <section className="py-8 px-4 overflow-x-hidden w-full">
          <div className="max-w-4xl mx-auto min-w-0 w-full">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 sm:p-6 flex gap-4 overflow-x-hidden w-full">
              <AlertCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground mb-2 break-words">Submission Deadline: March 15, 2026</p>
                <p className="text-sm text-muted-foreground mb-3 break-words">
                  Please ensure your abstract follows all guidelines before submission.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside break-words">
                  <li>Abstract must be in English</li>
                  <li>Add authors names</li>
                  <li>Specify your university/institution</li>
                  <li>Select submission type</li>
                  <li>Select medical specialty topic</li>
                  <li>Upload abstract PDF file (required)</li>
                  <li>Upload poster PDF file (required)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 pb-20 overflow-x-hidden w-full">
          <div className="max-w-4xl mx-auto min-w-0 w-full">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 break-words">
                {error}
              </div>
            )}

            <Card className="overflow-x-hidden w-full">
              <CardHeader className="min-w-0">
                <CardTitle className="break-words">E-Poster Submission Form</CardTitle>
                <CardDescription className="break-words">
                  Fill in all required fields. You can edit your submission before the deadline.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <form onSubmit={handleSubmit} className="space-y-6 overflow-x-hidden w-full">
                  <div className="min-w-0 w-full">
                    <label htmlFor="title" className="block text-sm font-semibold mb-2">
                      Poster Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="Enter a concise and specific title"
                      className="w-full max-w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      Keep it concise, specific, and descriptive
                    </p>
                  </div>

                  <div className="min-w-0 w-full">
                    <label htmlFor="authors" className="block text-sm font-semibold mb-2">
                      Authors *
                    </label>
                    <input
                      type="text"
                      id="authors"
                      name="authors"
                      value={formData.authors}
                      onChange={handleChange}
                      required
                      placeholder="Full Name¹, Full Name², Full Name³"
                      className="w-full max-w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      List all authors with superscript numbers for affiliations. Underline the presenting author.
                    </p>
                  </div>

                  <div className="min-w-0 w-full">
                    <label htmlFor="university" className="block text-sm font-semibold mb-2">
                      University/Institution *
                    </label>
                    <input
                      type="text"
                      id="university"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      required
                      placeholder="Enter your university or institution name"
                      className="w-full max-w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      Name of the primary affiliated institution
                    </p>
                  </div>

                  <div className="min-w-0 w-full">
                    <label htmlFor="category" className="block text-sm font-semibold mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full max-w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                    >
                      <option value="">Select a category</option>
                      <option value="Case Report">Case Report</option>
                      <option value="Research">Research</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1 break-words">Select the type of submission</p>
                  </div>

                  <div className="min-w-0 w-full">
                    <label htmlFor="topic" className="block text-sm font-semibold mb-2">
                      Topic *
                    </label>
                    <select
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      required
                      className="w-full max-w-full px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                    >
                      <option value="">Select a topic</option>
                      <option value="Emergencies (Kegawatdaruratan)">Emergencies (Kegawatdaruratan)</option>
                      <option value="Pain Management (Manajemen Nyeri)">Pain Management (Manajemen Nyeri)</option>
                      <option value="ICU Management (Manajemen ICU)">ICU Management (Manajemen ICU)</option>
                      <option value="Anesthesia Management (Manajemen Anestesi)">
                        Anesthesia Management (Manajemen Anestesi)
                      </option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1 break-words">Select the medical specialty topic</p>
                  </div>

                  <div className="min-w-0 w-full">
                    <label className="block text-sm font-semibold mb-2">Abstract (PDF) *</label>

                    {!selectedAbstractFile && !uploadedAbstractUrl && (
                      <div className="border-2 border-dashed border-input rounded-lg p-6 text-center hover:border-primary/50 transition-colors min-w-0 w-full max-w-full">
                        <input
                          type="file"
                          id="abstract-file"
                          accept=".pdf"
                          onChange={handleAbstractFileChange}
                          className="hidden"
                        />
                        <label htmlFor="abstract-file" className="cursor-pointer flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm font-medium break-words">Click to upload abstract PDF</p>
                          <p className="text-xs text-muted-foreground break-words">PDF only (max 10MB)</p>
                        </label>
                      </div>
                    )}

                    {selectedAbstractFile && !uploadedAbstractUrl && (
                      <div className="border border-input rounded-lg p-4 flex items-center justify-between gap-2 min-w-0 w-full max-w-full">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="bg-primary/10 p-2 rounded flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{selectedAbstractFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedAbstractFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveAbstractFile}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {uploadedAbstractUrl && (
                      <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-4 flex items-center justify-between gap-2 min-w-0 w-full max-w-full">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="bg-green-500/10 p-2 rounded flex-shrink-0">
                            <FileText className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-green-700 break-words">
                              Abstract uploaded successfully
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {selectedAbstractFile?.name || "Uploaded file"}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveAbstractFile}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2 break-words">
                      Upload your abstract as a PDF file (max 10MB). Include Background, Objective, Methods, Results,
                      and Conclusion.
                    </p>
                  </div>

                  <div className="min-w-0 w-full">
                    <label className="block text-sm font-semibold mb-2">Poster File (PDF) *</label>

                    {!selectedFile && !uploadedFileUrl && (
                      <div className="border-2 border-dashed border-input rounded-lg p-6 text-center hover:border-primary/50 transition-colors min-w-0 w-full max-w-full">
                        <input
                          type="file"
                          id="poster-file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label htmlFor="poster-file" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-sm font-medium break-words">Click to upload poster file</p>
                          <p className="text-xs text-muted-foreground break-words">PDF only (max 10MB)</p>
                        </label>
                      </div>
                    )}

                    {selectedFile && !uploadedFileUrl && (
                      <div className="border border-input rounded-lg p-4 flex items-center justify-between gap-2 min-w-0 w-full max-w-full">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="bg-primary/10 p-2 rounded flex-shrink-0">
                            <Upload className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {uploadedFileUrl && (
                      <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-4 flex items-center justify-between gap-2 min-w-0 w-full max-w-full">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="bg-green-500/10 p-2 rounded flex-shrink-0">
                            <Upload className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-green-700 break-words">
                              Poster uploaded successfully
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {selectedFile?.name || "Uploaded file"}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2 break-words">
                      Poster file is required. Accepted format: PDF (max 10MB)
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/call-for-papers")}
                      className="w-full sm:flex-1"
                    >
                      View Guidelines
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || isUploading || isUploadingAbstract}
                      className="w-full sm:flex-1"
                    >
                      {isLoading || isUploading || isUploadingAbstract ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isUploading || isUploadingAbstract ? "Uploading..." : "Submitting..."}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit E-Poster
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground break-words">
                    By submitting, you agree to the conference terms. You will receive a confirmation email after
                    review.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
