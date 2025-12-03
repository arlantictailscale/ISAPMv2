import fs from "fs"
import path from "path"

// Function to load base64 image from text file
function loadBase64FromFile(filename: string): string {
  try {
    const filePath = path.join(process.cwd(), "lib", "invoice", "images", filename)
    const content = fs.readFileSync(filePath, "utf-8").trim()
    // Remove data URI prefix if present, we just want the base64 part
    if (content.startsWith("data:image/png;base64,")) {
      return content.substring("data:image/png;base64,".length)
    }
    return content
  } catch (error) {
    console.error(`[v0] Error loading image from ${filename}:`, error)
    return ""
  }
}

// Lazy load images when needed
let cachedImages: Record<string, string> | null = null

export function getInvoiceImages(): Record<string, string> {
  if (cachedImages) {
    return cachedImages
  }

  cachedImages = {
    isapm2026: loadBase64FromFile("logo-isapm-2026.txt"),
    isapmOrg: loadBase64FromFile("logo-isapm-org.txt"),
    kemenkes: loadBase64FromFile("logo-kemenkes.txt"),
    perdatin: loadBase64FromFile("logo-perdatin.txt"),
    ub: loadBase64FromFile("logo-ub.txt"),
    idi: loadBase64FromFile("logo-idi.txt"),
    lunas: loadBase64FromFile("lunas-stamp.txt"),
    signature: loadBase64FromFile("signature.txt"),
  }

  return cachedImages
}
