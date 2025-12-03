import { jsPDF } from "jspdf"

// Vercel Blob Storage URLs for invoice images
const IMAGE_URLS = {
  logoIsapm2026: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/1.png",
  logoKemenkes: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/2.png",
  logoIsapmOrg: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/3.png",
  lunasStamp: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/Lunas.png",
  signature: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/ttd%20dr.%20WWN%20new%202024.png",
}

const IMAGE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  logoIsapm2026: { width: 83, height: 18 }, // Wide banner logo (actual ratio ~4.6:1)
  logoKemenkes: { width: 32, height: 16 }, // Kemenkes emblem with text - wider aspect ratio
  logoIsapmOrg: { width: 16, height: 16 }, // Circular gear logo - perfect square
  lunasStamp: { width: 31, height: 28 }, // Wide stamp with LUNAS text
  signature: { width: 50, height: 22 }, // Wide signature
}

function getImageDimensions(key: string): { width: number; height: number } {
  return IMAGE_DIMENSIONS[key] || { width: 14, height: 14 }
}

// Cache for loaded images (persistent across requests)
const imageCache: Map<string, string> = new Map()

async function fetchImageAsBase64(url: string, compress = false): Promise<string | null> {
  // Check cache first
  if (imageCache.has(url)) {
    return imageCache.get(url) || null
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "image/png,image/jpeg,image/*",
      },
      cache: "force-cache",
    })

    if (!response.ok) {
      console.error(`Failed to fetch image from ${url}: ${response.status}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const contentType = response.headers.get("content-type") || "image/png"
    const dataUri = `data:${contentType};base64,${base64}`

    // Cache the result
    imageCache.set(url, dataUri)

    return dataUri
  } catch (error) {
    console.error(`Error fetching image from ${url}:`, error)
    return null
  }
}

// Load all images in parallel with timeout
async function loadAllImages(): Promise<Record<string, string | null>> {
  const entries = Object.entries(IMAGE_URLS)

  const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))

  const results = await Promise.all(
    entries.map(async ([key, url]) => {
      try {
        const base64 = await Promise.race([
          fetchImageAsBase64(url),
          timeout(5000), // 5 second timeout per image
        ])
        return [key, base64] as [string, string | null]
      } catch {
        return [key, null] as [string, string | null]
      }
    }),
  )
  return Object.fromEntries(results)
}

// Helper function to convert number to Indonesian words (Terbilang)
function numberToIndonesianWords(num: number): string {
  const units = [
    "",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
    "sepuluh",
    "sebelas",
  ]

  if (num < 0) return "minus " + numberToIndonesianWords(Math.abs(num))
  if (num < 12) return units[num]
  if (num < 20) return units[num - 10] + " belas"
  if (num < 100) return units[Math.floor(num / 10)] + " puluh " + units[num % 10]
  if (num < 200) return "seratus " + numberToIndonesianWords(num - 100)
  if (num < 1000) return units[Math.floor(num / 100)] + " ratus " + numberToIndonesianWords(num % 100)
  if (num < 2000) return "seribu " + numberToIndonesianWords(num - 1000)
  if (num < 1000000)
    return numberToIndonesianWords(Math.floor(num / 1000)) + " ribu " + numberToIndonesianWords(num % 1000)
  if (num < 1000000000)
    return numberToIndonesianWords(Math.floor(num / 1000000)) + " juta " + numberToIndonesianWords(num % 1000000)
  if (num < 1000000000000)
    return (
      numberToIndonesianWords(Math.floor(num / 1000000000)) + " milyar " + numberToIndonesianWords(num % 1000000000)
    )
  return (
    numberToIndonesianWords(Math.floor(num / 1000000000000)) +
    " triliun " +
    numberToIndonesianWords(num % 1000000000000)
  )
}

export function formatTerbilang(num: number): string {
  if (num === 0) return "nol rupiah"
  const words = numberToIndonesianWords(num).trim().replace(/\s+/g, " ")
  // Capitalize first letter
  return words.charAt(0).toUpperCase() + words.slice(1) + " rupiah"
}

// Generate invoice number based on date and order ID
export function generateInvoiceNumber(orderId: string, date: Date = new Date()): string {
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const orderSuffix = orderId.slice(0, 4).toUpperCase()
  return `Natmet-${year}${month}${day}${orderSuffix}`
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
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Format currency to Indonesian format
export function formatRupiah(amount: number): string {
  return `Rp. ${amount.toLocaleString("id-ID")}`
}

export interface InvoiceItem {
  eventLabel: string
  unitPrice: number
  quantity: number
  nights?: number
  itemType: string
  participantTypeLabel?: string
  hotelRoomType?: string
  checkInDate?: string
  checkOutDate?: string
}

export interface InvoiceData {
  orderId: string
  invoiceNumber: string
  invoiceDate: Date
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerInstitution?: string
  items: InvoiceItem[]
  totalAmount: number
  currency: string
  paymentDate?: Date
  paymentMethod?: string
}

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true, // Enable PDF compression
  })

  // Load all images
  const images = await loadAllImages()

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // Colors matching ISAPM branding
  const primaryBlue: [number, number, number] = [0, 169, 224] // ISAPM Cyan/Blue
  const darkText: [number, number, number] = [33, 37, 41]
  const grayText: [number, number, number] = [108, 117, 125]
  const greenStamp: [number, number, number] = [40, 167, 69] // For LUNAS stamp

  let yPos = margin

  // ============================================
  // HEADER SECTION WITH LOGOS
  // ============================================

  const logoHeight = 18
  const logoY = yPos

  if (images.logoIsapm2026) {
    try {
      const dims = getImageDimensions("logoIsapm2026")
      doc.addImage(images.logoIsapm2026, "PNG", margin, logoY, dims.width, dims.height)
    } catch (e) {
      console.error("Failed to add ISAPM 2026 logo:", e)
    }
  }

  const partnerLogoY = logoY + 2
  const partnerLogoSpacing = 6 // Spacing between the two logos

  const partnerKeys = ["logoKemenkes", "logoIsapmOrg"] as const
  const partnerDims = partnerKeys.map((key) => getImageDimensions(key))
  const totalPartnerWidth =
    partnerDims.reduce((sum, d) => sum + d.width, 0) + (partnerKeys.length - 1) * partnerLogoSpacing

  // Start position for partner logos (right-aligned)
  let partnerLogoX = pageWidth - margin - totalPartnerWidth

  partnerKeys.forEach((key, index) => {
    const imageKey = key as keyof typeof images
    if (images[imageKey]) {
      try {
        const dims = partnerDims[index]
        // Center vertically within the header area based on max height (14mm)
        const maxLogoHeight = 14
        const centeredY = partnerLogoY + (maxLogoHeight - dims.height) / 2
        doc.addImage(images[imageKey]!, "PNG", partnerLogoX, centeredY, dims.width, dims.height)
        partnerLogoX += dims.width + partnerLogoSpacing
      } catch (e) {
        console.error(`Failed to add ${key} logo:`, e)
      }
    } else {
      partnerLogoX += partnerDims[index].width + partnerLogoSpacing
    }
  })

  yPos += logoHeight + 7

  // ============================================
  // TITLE
  // ============================================
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...primaryBlue)
  doc.text("TANDA TERIMA PEMBAYARAN", pageWidth / 2, yPos, { align: "center" })
  yPos += 3

  // Divider line
  doc.setDrawColor(...primaryBlue)
  doc.setLineWidth(0.8)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // ============================================
  // INVOICE INFO & CUSTOMER DETAILS
  // ============================================
  doc.setFontSize(10)
  doc.setTextColor(...darkText)

  // Left column - Invoice details
  doc.setFont("helvetica", "bold")
  doc.text("No. Kwitansi", margin, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${data.invoiceNumber}`, margin + 28, yPos)

  // Right column - Customer details header
  doc.setFont("helvetica", "bold")
  doc.text("Kepada:", pageWidth / 2 + 5, yPos)
  yPos += 6

  doc.setFont("helvetica", "bold")
  doc.text("Tanggal", margin, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${formatDateIndonesian(data.invoiceDate)}`, margin + 28, yPos)

  // Customer name
  doc.setFont("helvetica", "bold")
  doc.text(data.customerName, pageWidth / 2 + 5, yPos)
  yPos += 5

  // Customer institution
  if (data.customerInstitution) {
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...grayText)
    doc.text(data.customerInstitution, pageWidth / 2 + 5, yPos)
    yPos += 5
  }

  // Customer email
  doc.setTextColor(...primaryBlue)
  doc.text(data.customerEmail, pageWidth / 2 + 5, yPos)
  yPos += 10

  // ============================================
  // ITEMS TABLE
  // ============================================
  const tableStartY = yPos
  const colWidths = { no: 12, event: 85, harga: 35, jumlah: 35 }
  const colX = {
    no: margin,
    event: margin + colWidths.no,
    harga: margin + colWidths.no + colWidths.event,
    jumlah: margin + colWidths.no + colWidths.event + colWidths.harga,
  }

  // Table header
  doc.setFillColor(...primaryBlue)
  doc.rect(margin, tableStartY, contentWidth, 8, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("No", colX.no + 4, tableStartY + 5.5)
  doc.text("Event", colX.event + 4, tableStartY + 5.5)
  doc.text("Harga", colX.harga + 4, tableStartY + 5.5)
  doc.text("Jumlah", colX.jumlah + 4, tableStartY + 5.5)

  yPos = tableStartY + 8

  // Table rows
  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  data.items.forEach((item, index) => {
    let eventText = ""
    if (item.itemType === "hotel") {
      eventText = `Hotel: ${item.hotelRoomType || "Room"}`
      if (item.nights && item.nights > 1) {
        eventText += ` (${item.nights} malam)`
      }
    } else {
      eventText = item.eventLabel || "Event Registration"
      if (item.participantTypeLabel) {
        eventText += ` - ${item.participantTypeLabel}`
      }
    }

    const maxEventWidth = colWidths.event - 6
    const splitEventText = doc.splitTextToSize(eventText, maxEventWidth)
    const lineHeight = 4
    const rowHeight = Math.max(10, splitEventText.length * lineHeight + 4)
    const rowY = yPos

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, rowY, contentWidth, rowHeight, "F")
    }

    // Row border
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.1)
    doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight)

    // Vertical lines for columns
    doc.line(colX.event, rowY, colX.event, rowY + rowHeight)
    doc.line(colX.harga, rowY, colX.harga, rowY + rowHeight)
    doc.line(colX.jumlah, rowY, colX.jumlah, rowY + rowHeight)

    // No column
    doc.text(`${index + 1}.`, colX.no + 4, rowY + 6)

    let textYOffset = rowY + 5
    splitEventText.forEach((line: string) => {
      doc.text(line, colX.event + 4, textYOffset)
      textYOffset += lineHeight
    })

    // Unit price
    doc.text(formatRupiah(item.unitPrice), colX.harga + 4, rowY + 6)

    // Total
    const quantity = item.quantity || 1
    const nights = item.nights || 1
    const itemTotal = item.unitPrice * quantity * nights
    doc.text(formatRupiah(itemTotal), colX.jumlah + 4, rowY + 6)

    yPos += rowHeight
  })

  // Empty rows to fill table (minimum 5 rows)
  const minRows = 5
  const currentRows = data.items.length
  for (let i = currentRows; i < minRows; i++) {
    const rowHeight = 10
    const rowY = yPos

    if (i % 2 === 0) {
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, rowY, contentWidth, rowHeight, "F")
    }

    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.1)
    doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight)
    doc.line(colX.event, rowY, colX.event, rowY + rowHeight)
    doc.line(colX.harga, rowY, colX.harga, rowY + rowHeight)
    doc.line(colX.jumlah, rowY, colX.jumlah, rowY + rowHeight)

    yPos += rowHeight
  }

  // Table border
  doc.setDrawColor(...primaryBlue)
  doc.setLineWidth(0.5)
  doc.rect(margin, tableStartY, contentWidth, yPos - tableStartY)

  // Total row
  yPos += 2
  doc.setFillColor(...primaryBlue)
  doc.rect(margin, yPos, contentWidth, 10, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Total Pembayaran:", colX.harga - 25, yPos + 7)
  doc.text(formatRupiah(data.totalAmount), colX.jumlah + 4, yPos + 7)

  yPos += 18

  // ============================================
  // TERBILANG SECTION
  // ============================================
  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Terbilang:", margin, yPos)
  yPos += 6

  doc.setFont("helvetica", "italic")
  doc.setFontSize(9)
  doc.setTextColor(...grayText)
  const terbilang = formatTerbilang(data.totalAmount)
  const splitTerbilang = doc.splitTextToSize(terbilang, contentWidth - 10)
  doc.text(splitTerbilang, margin, yPos)
  yPos += splitTerbilang.length * 5 + 8

  // ============================================
  // PAYMENT INFO BOX & LUNAS STAMP
  // ============================================
  doc.setFillColor(240, 248, 255) // Light blue background
  doc.setDrawColor(...primaryBlue)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, yPos, contentWidth / 2 - 5, 28, 2, 2, "FD")

  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Telah dibayarkan pada:", margin + 5, yPos + 7)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("No. Rek. 7207681363 (BSI)", margin + 5, yPos + 14)
  doc.text("a.n PT. Tombo Farma Indonesia", margin + 5, yPos + 20)

  const stampX = margin + contentWidth / 2 + 10
  const stampY = yPos
  const stampDims = getImageDimensions("lunasStamp")

  if (images.lunasStamp) {
    try {
      doc.addImage(images.lunasStamp, "PNG", stampX, stampY, stampDims.width, stampDims.height)
    } catch (e) {
      console.error("Failed to add LUNAS stamp:", e)
      // Fallback to drawn stamp
      drawFallbackLunasStamp(doc, stampX, stampY, greenStamp)
    }
  } else {
    drawFallbackLunasStamp(doc, stampX, stampY, greenStamp)
  }

  // Date under stamp
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...grayText)
  const paymentDateStr = data.paymentDate
    ? formatDateIndonesian(data.paymentDate)
    : formatDateIndonesian(data.invoiceDate)
  doc.text(paymentDateStr, stampX + stampDims.width / 2, stampY + stampDims.height + 3, { align: "center" })

  yPos += 38

  // ============================================
  // SIGNATURE SECTION
  // ============================================
  const signatureX = pageWidth - margin - 70
  const signatureDims = getImageDimensions("signature")

  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Ketua,", signatureX, yPos)
  yPos += 3

  if (images.signature) {
    try {
      doc.addImage(images.signature, "PNG", signatureX, yPos, signatureDims.width, signatureDims.height)
    } catch (e) {
      console.error("Failed to add signature:", e)
    }
  }

  yPos += signatureDims.height + 3

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(...darkText)
  doc.text("Dr. dr. Ristiawan Muji Laksono,", signatureX, yPos)
  yPos += 4
  doc.text("Sp.An-TI., Subsp. M.N (K)., FIPP", signatureX, yPos)

  yPos += 12

  // ============================================
  // FOOTER - THANK YOU MESSAGE
  // ============================================
  doc.setTextColor(...primaryBlue)
  doc.setFont("helvetica", "italic")
  doc.setFontSize(10)
  doc.text("Terimakasih sudah berpartisipasi pada ISAPM 8th National Meeting 2026", pageWidth / 2, yPos, {
    align: "center",
  })

  // ============================================
  // CONTACT INFO (BOTTOM RIGHT)
  // ============================================
  const contactY = pageHeight - 25
  const contactX = pageWidth - margin

  doc.setTextColor(...grayText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)

  doc.text("Contact:", contactX, contactY, { align: "right" })
  doc.text("admin@isapm2026.org", contactX, contactY + 4, { align: "right" })
  doc.text("+62 896-0262-6709 (WhatsApp)", contactX, contactY + 8, { align: "right" })
  doc.text("www.isapm2026.org", contactX, contactY + 12, { align: "right" })

  // Bottom border line
  doc.setDrawColor(...primaryBlue)
  doc.setLineWidth(1)
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

  return doc
}

function drawFallbackLunasStamp(doc: jsPDF, x: number, y: number, color: [number, number, number]) {
  doc.setDrawColor(...color)
  doc.setLineWidth(1.5)
  doc.rect(x, y + 5, 35, 18)
  doc.setLineWidth(0.5)
  doc.rect(x + 2, y + 7, 31, 14)
  doc.setTextColor(...color)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("LUNAS", x + 17.5, y + 16, { align: "center" })
}

export async function generateInvoiceBase64(data: InvoiceData): Promise<string> {
  const doc = await generateInvoicePDF(data)
  return doc.output("datauristring").split(",")[1]
}

export async function generateInvoiceBlob(data: InvoiceData): Promise<Blob> {
  const doc = await generateInvoicePDF(data)
  return doc.output("blob")
}
