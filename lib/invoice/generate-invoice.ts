import { jsPDF } from "jspdf"

// Vercel Blob Storage URLs for invoice images
const IMAGE_URLS = {
  logoIsapm2026: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/1.png",
  logoKemenkes: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/2.png",
  logoIsapmOrg: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/3.png",
  logoPerdatin: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/4.png",
  logoUB: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/5.png",
  logoIDI: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/7.png",
  lunasStamp: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/Lunas.png",
  signature: "https://vbq2yu19cpakkhri.public.blob.vercel-storage.com/Invoice%20Logo/ttd%20dr.%20WWN%20new%202024.png",
}

// Cache for loaded images
const imageCache: Map<string, string> = new Map()

// Fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<string | null> {
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

// Load all images in parallel
async function loadAllImages(): Promise<Record<string, string | null>> {
  const entries = Object.entries(IMAGE_URLS)
  const results = await Promise.all(
    entries.map(async ([key, url]) => {
      const base64 = await fetchImageAsBase64(url)
      return [key, base64] as [string, string | null]
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

  // ISAPM 2026 main logo (left side)
  if (images.logoIsapm2026) {
    try {
      doc.addImage(images.logoIsapm2026, "PNG", margin, logoY, 50, logoHeight)
    } catch (e) {
      console.error("Failed to add ISAPM 2026 logo:", e)
    }
  }

  // Partner logos (right side) - Kemenkes, ISAPM Org, Perdatin, UB, IDI
  const partnerLogoSize = 14
  const partnerLogoY = logoY + 2
  const partnerLogoSpacing = 16
  let partnerLogoX = pageWidth - margin - (partnerLogoSize * 5 + partnerLogoSpacing * 4) / 2 - 10

  // Kemenkes logo
  if (images.logoKemenkes) {
    try {
      doc.addImage(images.logoKemenkes, "PNG", partnerLogoX, partnerLogoY, partnerLogoSize, partnerLogoSize)
    } catch (e) {
      console.error("Failed to add Kemenkes logo:", e)
    }
  }
  partnerLogoX += partnerLogoSpacing

  // ISAPM Org logo
  if (images.logoIsapmOrg) {
    try {
      doc.addImage(images.logoIsapmOrg, "PNG", partnerLogoX, partnerLogoY, partnerLogoSize, partnerLogoSize)
    } catch (e) {
      console.error("Failed to add ISAPM Org logo:", e)
    }
  }
  partnerLogoX += partnerLogoSpacing

  // Perdatin logo
  if (images.logoPerdatin) {
    try {
      doc.addImage(images.logoPerdatin, "PNG", partnerLogoX, partnerLogoY, partnerLogoSize, partnerLogoSize)
    } catch (e) {
      console.error("Failed to add Perdatin logo:", e)
    }
  }
  partnerLogoX += partnerLogoSpacing

  // UB logo
  if (images.logoUB) {
    try {
      doc.addImage(images.logoUB, "PNG", partnerLogoX, partnerLogoY, partnerLogoSize, partnerLogoSize)
    } catch (e) {
      console.error("Failed to add UB logo:", e)
    }
  }
  partnerLogoX += partnerLogoSpacing

  // IDI logo
  if (images.logoIDI) {
    try {
      doc.addImage(images.logoIDI, "PNG", partnerLogoX, partnerLogoY, partnerLogoSize, partnerLogoSize)
    } catch (e) {
      console.error("Failed to add IDI logo:", e)
    }
  }

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
  doc.setFontSize(8) // Slightly smaller font to fit longer text

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

    const maxEventWidth = colWidths.event - 8
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
  const stampWidth = 40
  const stampHeight = 28

  if (images.lunasStamp) {
    try {
      doc.addImage(images.lunasStamp, "PNG", stampX, stampY, stampWidth, stampHeight)
    } catch (e) {
      console.error("Failed to add LUNAS stamp:", e)
      // Fallback to drawn stamp
      doc.setDrawColor(...greenStamp)
      doc.setLineWidth(1.5)
      doc.rect(stampX, stampY + 5, 35, 18)
      doc.setLineWidth(0.5)
      doc.rect(stampX + 2, stampY + 7, 31, 14)
      doc.setTextColor(...greenStamp)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("LUNAS", stampX + 17.5, stampY + 16, { align: "center" })
    }
  } else {
    // Fallback to drawn stamp
    doc.setDrawColor(...greenStamp)
    doc.setLineWidth(1.5)
    doc.rect(stampX, stampY + 5, 35, 18)
    doc.setLineWidth(0.5)
    doc.rect(stampX + 2, stampY + 7, 31, 14)
    doc.setTextColor(...greenStamp)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text("LUNAS", stampX + 17.5, stampY + 16, { align: "center" })
  }

  // Date under stamp
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...grayText)
  const paymentDateStr = data.paymentDate
    ? formatDateIndonesian(data.paymentDate)
    : formatDateIndonesian(data.invoiceDate)
  doc.text(paymentDateStr, stampX + stampWidth / 2, stampY + stampHeight + 3, { align: "center" })

  yPos += 38

  // ============================================
  // SIGNATURE SECTION
  // ============================================
  const signatureX = pageWidth - margin - 70
  const signatureWidth = 55
  const signatureHeight = 25

  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Ketua,", signatureX, yPos)
  yPos += 3

  if (images.signature) {
    try {
      doc.addImage(images.signature, "PNG", signatureX, yPos, signatureWidth, signatureHeight)
    } catch (e) {
      console.error("Failed to add signature:", e)
    }
  }

  yPos += signatureHeight + 3

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

export async function generateInvoiceBase64(data: InvoiceData): Promise<string> {
  const doc = await generateInvoicePDF(data)
  return doc.output("datauristring").split(",")[1]
}

export async function generateInvoiceBlob(data: InvoiceData): Promise<Blob> {
  const doc = await generateInvoicePDF(data)
  return doc.output("blob")
}
