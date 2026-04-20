import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Verify admin authentication before issuing an upload token
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("Unauthorized")
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profile || profile.role !== "admin") {
          throw new Error("Forbidden: admin access required")
        }

        return {
          allowedContentTypes: [
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
          ],
          // Max 500MB per file
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: user.id,
            clientPayload,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional: log successful uploads here
        console.log("[v0] Event resource uploaded:", blob.url, tokenPayload)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("[v0] Upload error:", error)
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
