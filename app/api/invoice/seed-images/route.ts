// API endpoint to seed invoice images to Vercel Blob
import { put, list } from "@vercel/blob"
import { NextResponse } from "next/server"

const IMAGE_SOURCES = {
  "invoice-logo-isapm2026.png": "/images/1.png",
  "invoice-logo-isapm.png": "/images/2.png",
  "invoice-logo-kemenkes.png": "/images/3.png",
  "invoice-logo-perdatin.png": "/images/4.png",
  "invoice-logo-ub.png": "/images/5.png",
  "invoice-logo-idi.png": "/images/7.png",
  "invoice-lunas.png": "/images/lunas.png",
  "invoice-signature.png": "/images/ttd-20dr.png",
}

export async function POST() {
  try {
    const results: Record<string, string> = {}
    const errors: string[] = []

    // Check existing blobs
    const { blobs } = await list({ prefix: "invoice-assets/" })
    const existingFiles = new Set(blobs.map((b) => b.pathname))

    for (const [filename, sourceUrl] of Object.entries(IMAGE_SOURCES)) {
      const blobPath = `invoice-assets/${filename}`

      // Skip if already exists
      if (existingFiles.has(blobPath)) {
        const existing = blobs.find((b) => b.pathname === blobPath)
        if (existing) {
          results[filename] = existing.url
          console.log(`[v0] Already exists: ${filename}`)
          continue
        }
      }

      try {
        console.log(`[v0] Fetching ${filename}...`)
        const response = await fetch(sourceUrl, {
          headers: {
            Accept: "image/*",
          },
        })

        if (!response.ok) {
          errors.push(`Failed to fetch ${filename}: ${response.status}`)
          continue
        }

        const arrayBuffer = await response.arrayBuffer()

        if (arrayBuffer.byteLength === 0) {
          errors.push(`Empty response for ${filename}`)
          continue
        }

        console.log(`[v0] Uploading ${filename} (${arrayBuffer.byteLength} bytes)...`)
        const blob = await put(blobPath, arrayBuffer, {
          access: "public",
          contentType: "image/png",
        })

        results[filename] = blob.url
        console.log(`[v0] Uploaded: ${blob.url}`)
      } catch (error) {
        errors.push(`Error processing ${filename}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      urls: results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Seed images error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: "invoice-assets/" })

    const urls: Record<string, string> = {}
    for (const blob of blobs) {
      const filename = blob.pathname.replace("invoice-assets/", "")
      urls[filename] = blob.url
    }

    return NextResponse.json({ urls })
  } catch (error) {
    console.error("[v0] List images error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
