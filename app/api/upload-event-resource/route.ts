import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const eventSlug = formData.get("eventSlug") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      )
    }

    // Allowed file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip",
      "application/x-zip-compressed",
      "video/mp4",
      "video/webm",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed: PDF, Word, PowerPoint, Excel, ZIP, MP4, WebM, JPEG, PNG, GIF, WebP.",
        },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = `event-resources/${eventSlug || "general"}/${timestamp}-${safeName}`

    const blob = await put(filename, file, {
      access: "public",
    })

    // Determine file type category
    let fileType = "url"
    if (file.type.startsWith("image/")) {
      fileType = file.type.split("/")[1] === "png" ? "png" : "jpg"
    } else if (file.type.startsWith("video/")) {
      fileType = "mp4"
    } else if (file.type === "application/pdf") {
      fileType = "pdf"
    } else if (file.type.includes("word")) {
      fileType = "doc"
    } else if (file.type.includes("presentation") || file.type.includes("powerpoint")) {
      fileType = "ppt"
    } else if (file.type.includes("sheet") || file.type.includes("excel")) {
      fileType = "xls"
    } else if (file.type.includes("zip")) {
      fileType = "zip"
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      fileType,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
