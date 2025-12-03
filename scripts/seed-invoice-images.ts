// This script fetches images from URLs and uploads them to Vercel Blob
// Run this once to seed the invoice images

import { put } from "@vercel/blob"

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

async function seedImages() {
  const results: Record<string, string> = {}

  for (const [filename, sourceUrl] of Object.entries(IMAGE_SOURCES)) {
    try {
      console.log(`Fetching ${filename} from ${sourceUrl}...`)
      const response = await fetch(sourceUrl)

      if (!response.ok) {
        console.error(`Failed to fetch ${filename}: ${response.status}`)
        continue
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      console.log(`Uploading ${filename} to Vercel Blob...`)
      const blob = await put(`invoice-assets/${filename}`, buffer, {
        access: "public",
        contentType: "image/png",
      })

      results[filename] = blob.url
      console.log(`Uploaded ${filename}: ${blob.url}`)
    } catch (error) {
      console.error(`Error processing ${filename}:`, error)
    }
  }

  console.log("\n\nFinal URLs:")
  console.log(JSON.stringify(results, null, 2))

  return results
}

seedImages()
