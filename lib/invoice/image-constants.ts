// Base64 image constants for invoice generation
// These are embedded at build time so they work in serverless environments

import fs from "fs"
import path from "path"

// Function to load base64 from files at build time
function loadBase64(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), "lib/invoice/base64", filename)
    const content = fs.readFileSync(filePath, "utf-8").trim()
    // Remove data:image/png;base64, prefix if present
    return content.replace(/^data:image\/\w+;base64,/, "")
  } catch (error) {
    console.error(`[v0] Failed to load ${filename}:`, error)
    return ""
  }
}

// Load all images - these will be bundled at build time
export const INVOICE_IMAGES = {
  logoIsapm2026: loadBase64("logo-isapm-2026.txt"),
  logoIsapmOrg: loadBase64("logo-isapm-org.txt"),
  logoKemenkes: loadBase64("logo-kemenkes.txt"),
  logoPerdatin: loadBase64("logo-perdatin.txt"),
  logoUB: loadBase64("logo-ub.txt"),
  logoIDI: loadBase64("logo-idi.txt"),
  lunasStamp: loadBase64("lunas-stamp.txt"),
  signature: loadBase64("signature.txt"),
}

// Check if images loaded successfully
export function checkImagesLoaded(): { loaded: string[]; failed: string[] } {
  const loaded: string[] = []
  const failed: string[] = []

  for (const [key, value] of Object.entries(INVOICE_IMAGES)) {
    if (value && value.length > 100) {
      loaded.push(key)
    } else {
      failed.push(key)
    }
  }

  return { loaded, failed }
}
