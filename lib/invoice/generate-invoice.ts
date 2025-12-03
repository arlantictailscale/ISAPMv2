import PDFDocument from "pdfkit"

// Vercel Blob storage URLs for invoice images
const IMAGE_URLS = {
  isapm2026Logo: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/1.png",
  isapmOrgLogo: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/2.png",
  kemenkesLogo: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/3.png",
  perdatinLogo: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/4.png",
  ubLogo: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/5.png",
  idiLogo: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/7.png",
  lunasStamp: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/Lunas.png",
  signature: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/ttd%20dr.%20WWN%20new%202024.png",
}

// Helper function to fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const response = await fetch(url, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[v0] Failed to fetch image from ${url}: ${response.status}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      console.error(`[v0] Empty buffer for ${url}`)
      return null
    }

    return buffer.toString("base64")
  } catch (error) {
    console.error(`[v0] Error fetching image ${url}:`, error)
    return null
  }
}

// Fetch all images in parallel
async function fetchAllImages(): Promise<Record<string, string | null>> {
  const results = await Promise.all([
    fetchImageAsBase64(IMAGE_URLS.isapm2026Logo),
    fetchImageAsBase64(IMAGE_URLS.isapmOrgLogo),
    fetchImageAsBase64(IMAGE_URLS.kemenkesLogo),
    fetchImageAsBase64(IMAGE_URLS.perdatinLogo),
    fetchImageAsBase64(IMAGE_URLS.ubLogo),
    fetchImageAsBase64(IMAGE_URLS.idiLogo),
    fetchImageAsBase64(IMAGE_URLS.lunasStamp),
    fetchImageAsBase64(IMAGE_URLS.signature),
  ])

  return {
    isapm2026Logo: results[0],
    isapmOrgLogo: results[1],
    kemenkesLogo: results[2],
    perdatinLogo: results[3],
    ubLogo: results[4],
    idiLogo: results[5],
    lunasStamp: results[6],
    signature: results[7],
  }
}

// Helper function to convert number to Indonesian words (Terbilang)
function numberToIndonesianWords(num: number): string {
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"]
  const belasan = [
    "Sepuluh",
    "Sebelas",
    "Dua Belas",
    "Tiga Belas",
    "Empat Belas",
    "Lima Belas",
    "Enam Belas",
    "Tujuh Belas",
    "Delapan Belas",
    "Sembilan Belas",
  ]

  if (num === 0) return "Nol"
  if (num < 10) return satuan[num]
  if (num >= 10 && num < 20) return belasan[num - 10]
  if (num < 100) {
    return `${satuan[Math.floor(num / 10)]} Puluh ${satuan[num % 10]}`.trim()
  }
  if (num < 200) {
    return `Seratus ${numberToIndonesianWords(num - 100)}`.trim()
  }
  if (num < 1000) {
    return `${satuan[Math.floor(num / 100)]} Ratus ${numberToIndonesianWords(num % 100)}`.trim()
  }
  if (num < 2000) {
    return `Seribu ${numberToIndonesianWords(num - 1000)}`.trim()
  }
  if (num < 1000000) {
    return `${numberToIndonesianWords(Math.floor(num / 1000))} Ribu ${numberToIndonesianWords(num % 1000)}`.trim()
  }
  if (num < 1000000000) {
    return `${numberToIndonesianWords(Math.floor(num / 1000000))} Juta ${numberToIndonesianWords(num % 1000000)}`.trim()
  }
  return num.toString()
}

// Format number to Rupiah
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date to Indonesian format
export function formatDateIndonesian(date: Date): string {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

// Format amount to Terbilang (Indonesian words)
export function formatTerbilang(amount: number): string {
  return `${numberToIndonesianWords(amount)} Rupiah`
}

// Generate invoice number
export function generateInvoiceNumber(orderId: string, date: Date): string {
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const orderShort = orderId.slice(0, 8).toUpperCase()

  return `${year}${month}${day}${orderShort}`
}

// Main function to generate invoice PDF
export async function generateInvoicePDF(invoiceData: {
  orderId: string
  invoiceNumber: string
  invoiceDate: Date
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerInstitution?: string
  items: { eventLabel: string; unitPrice: number; quantity: number; itemType: string }[]
  totalAmount: number
  currency: string
  paymentDate?: Date
}): Promise<PDFDocument> {
  console.log("[v0] Fetching images from Vercel Blob storage...")
  const images = await fetchAllImages()

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  })

  // Add logos
  const logoY = 50
  const logoSize = 50

  if (images.isapm2026Logo) {
    doc.image(Buffer.from(images.isapm2026Logo, "base64"), 50, logoY, {
      width: logoSize,
      height: logoSize,
    })
  }
  if (images.isapmOrgLogo) {
    doc.image(Buffer.from(images.isapmOrgLogo, "base64"), 110, logoY, {
      width: logoSize,
      height: logoSize,
    })
  }
  if (images.kemenkesLogo) {
    doc.image(Buffer.from(images.kemenkesLogo, "base64"), 170, logoY, {
      width: logoSize,
      height: logoSize,
    })
  }
  if (images.perdatinLogo) {
    doc.image(Buffer.from(images.perdatinLogo, "base64"), 230, logoY, {
      width: logoSize,
      height: logoSize,
    })
  }
  if (images.ubLogo) {
    doc.image(Buffer.from(images.ubLogo, "base64"), 290, logoY, {
      width: logoSize,
      height: logoSize,
    })
  }
  if (images.idiLogo) {
    doc.image(Buffer.from(images.idiLogo, "base64"), 350, logoY, {
      width: logoSize,
      height: logoSize,
    })
  }

  // Title
  doc.fontSize(20).font("Helvetica-Bold").text("KWITANSI", 50, 130, { align: "center" })

  // Invoice number
  doc.fontSize(12).font("Helvetica").text(`No: ${invoiceData.invoiceNumber}`, 50, 160, { align: "center" })

  let currentY = 200

  // Receipt details
  doc.fontSize(11).font("Helvetica").text("Sudah terima dari:", 50, currentY)
  doc.fontSize(11).font("Helvetica-Bold").text(invoiceData.customerName, 200, currentY)
  currentY += 25

  doc.fontSize(11).font("Helvetica").text("Uang sejumlah:", 50, currentY)
  doc.fontSize(11).font("Helvetica-Bold").text(formatRupiah(invoiceData.totalAmount), 200, currentY)
  currentY += 25

  doc.fontSize(11).font("Helvetica").text("Terbilang:", 50, currentY)
  doc.fontSize(11).font("Helvetica-Bold").text(formatTerbilang(invoiceData.totalAmount), 200, currentY, { width: 300 })
  currentY += 40

  // List items
  const itemsDescription = invoiceData.items.map((item) => item.eventLabel).join(", ")
  doc.fontSize(11).font("Helvetica").text("Untuk pembayaran:", 50, currentY)
  doc.fontSize(11).font("Helvetica-Bold").text(itemsDescription, 200, currentY, { width: 300 })
  currentY += 40

  if (images.lunasStamp) {
    doc.image(Buffer.from(images.lunasStamp, "base64"), 400, currentY - 20, {
      width: 100,
      height: 100,
    })
  }

  // Date and signature
  const paymentDate = invoiceData.paymentDate || invoiceData.invoiceDate
  currentY += 60
  doc
    .fontSize(11)
    .font("Helvetica")
    .text(`Malang, ${formatDateIndonesian(paymentDate)}`, 350, currentY, { align: "right" })

  currentY += 20
  doc.fontSize(11).font("Helvetica").text("Bendahara", 350, currentY, { align: "right" })

  if (images.signature) {
    doc.image(Buffer.from(images.signature, "base64"), 380, currentY + 10, {
      width: 100,
      height: 50,
    })
  }

  currentY += 70
  doc.fontSize(11).font("Helvetica-Bold").text("dr. Widjiati Wangsaputra Nugraha", 350, currentY, { align: "right" })

  doc.end()

  return doc
}

// Generate base64 encoded PDF
export async function generateInvoiceBase64(data: {
  orderId: string
  invoiceNumber: string
  invoiceDate: Date
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerInstitution?: string
  items: { eventLabel: string; unitPrice: number; quantity: number; itemType: string }[]
  totalAmount: number
  currency: string
  paymentDate?: Date
}): Promise<string> {
  const pdfBuffer = await generateInvoicePDF(data)
  return pdfBuffer.toString("base64")
}
