// Script to fetch invoice images and convert to base64
// Run this once to generate the base64 strings

const IMAGE_URLS = {
  isapm2026: "/images/1.png",
  isapmOrg: "/images/2.png",
  kemenkes: "/images/3.png",
  perdatin: "/images/4.png",
  ub: "/images/5.png",
  idi: "/images/7.png",
  lunas: "/images/lunas.png",
  signature: "/images/ttd-20dr.png",
}

async function fetchImageAsBase64(url: string): Promise<string> {
  console.log(`Fetching: ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  console.log(`Fetched ${url} - ${base64.length} characters`)
  return base64
}

async function main() {
  console.log("Fetching all invoice images...")

  const results: Record<string, string> = {}

  for (const [key, url] of Object.entries(IMAGE_URLS)) {
    try {
      results[key] = await fetchImageAsBase64(url)
    } catch (error) {
      console.error(`Error fetching ${key}:`, error)
      results[key] = ""
    }
  }

  console.log("\n\nCopy this into lib/invoice/image-constants.ts:\n")
  console.log("export const INVOICE_IMAGES = {")
  for (const [key, base64] of Object.entries(results)) {
    console.log(`  ${key}: '${base64.substring(0, 100)}...',`)
  }
  console.log("}\n")
}

main()
