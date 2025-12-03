import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

// Source URLs (from your existing blob storage)
const SOURCE_IMAGES = {
  "logo-isapm-2026.png": "/images/1-0o9tp.png",
  "logo-isapm-org.png": "/images/2-udjcn.png",
  "logo-kemenkes.png": "/images/3-qsxt5.png",
  "logo-perdatin.png": "/images/4-nlvnl.png",
  "logo-ub.png": "/images/5-bcnfm.png",
  "logo-idi.png": "/images/7-zkfo4.png",
  "lunas-stamp.png": "/images/lunas-hv6ux.png",
  "signature.png": "/images/ttd-20dr-mz38i.png",
}

export async function POST() {
  const results: Record<string, { success: boolean; url?: string; error?: string }> = {}

  for (const [filename, sourceUrl] of Object.entries(SOURCE_IMAGES)) {
    try {
      console.log(`[v0] Fetching ${filename} from ${sourceUrl}`)

      // Fetch the image from source
      const response = await fetch(sourceUrl)
      if (!response.ok) {
        results[filename] = { success: false, error: `Fetch failed: ${response.status}` }
        continue
      }

      const blob = await response.blob()
      console.log(`[v0] Fetched ${filename}, size: ${blob.size} bytes`)

      // Upload to this project's Vercel Blob
      const uploadResult = await put(`invoice/${filename}`, blob, {
        access: "public",
        contentType: "image/png",
      })

      console.log(`[v0] Uploaded ${filename} to ${uploadResult.url}`)
      results[filename] = { success: true, url: uploadResult.url }
    } catch (e) {
      console.error(`[v0] Error processing ${filename}:`, e)
      results[filename] = { success: false, error: String(e) }
    }
  }

  return NextResponse.json({
    message: "Upload complete",
    results,
    // Generate the IMAGE_BLOB_URLS object to use in code
    codeSnippet: `const IMAGE_BLOB_URLS = {\n${Object.entries(results)
      .filter(([, r]) => r.success && r.url)
      .map(([filename, r]) => {
        const key = filename
          .replace(".png", "")
          .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
          .replace("logo", "")
        return `  ${key}: "${r.url}",`
      })
      .join("\n")}\n}`,
  })
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to upload images to Vercel Blob",
    images: Object.keys(SOURCE_IMAGES),
  })
}
