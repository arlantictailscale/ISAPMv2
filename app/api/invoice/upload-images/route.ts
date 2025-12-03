import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import * as fs from "fs"
import * as path from "path"

// This endpoint uploads the base64 images to Vercel Blob
// Run once to upload all images, then use the returned URLs
export async function POST() {
  const imageFiles = [
    { name: "logo-isapm-2026", file: "logo-isapm-2026.txt" },
    { name: "logo-isapm-org", file: "logo-isapm-org.txt" },
    { name: "logo-kemenkes", file: "logo-kemenkes.txt" },
    { name: "logo-perdatin", file: "logo-perdatin.txt" },
    { name: "logo-ub", file: "logo-ub.txt" },
    { name: "logo-idi", file: "logo-idi.txt" },
    { name: "lunas-stamp", file: "lunas-stamp.txt" },
    { name: "signature", file: "signature.txt" },
  ]

  const results: Record<string, string> = {}

  for (const img of imageFiles) {
    try {
      const filePath = path.join(process.cwd(), "lib/invoice/b64", img.file)
      const base64Content = fs.readFileSync(filePath, "utf-8").trim()

      // Upload to Vercel Blob
      const blob = await put(`invoice-images/${img.name}.txt`, base64Content, {
        access: "public",
        contentType: "text/plain",
      })

      results[img.name] = blob.url
    } catch (e) {
      console.error(`Failed to upload ${img.name}:`, e)
      results[img.name] = `error: ${e}`
    }
  }

  return NextResponse.json(results)
}
