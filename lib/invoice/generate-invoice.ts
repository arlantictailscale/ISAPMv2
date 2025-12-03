import { jsPDF } from "jspdf"
import fs from "fs"
import path from "path"

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

// Helper function to load base64 from text file
function loadBase64FromFile(filename: string): string | null {
  try {
    const filePath = path.join(process.cwd(), "lib", "invoice", "images", filename)
    const content = fs.readFileSync(filePath, "utf-8").trim()
    // Return the full data URI
    return content
  } catch (error) {
    console.error(`[v0] Error loading image from ${filename}:`, error)
    return null
  }
}

// Load all images from filesystem (cached)
let cachedImages: Record<string, string | null> | null = null

function getAllImages(): Record<string, string | null> {
  if (cachedImages) {
    return cachedImages
  }

  console.log("[v0] Loading images from filesystem...")
  cachedImages = {
    isapm2026Logo: loadBase64FromFile("logo-isapm-2026.txt"),
    isapmOrgLogo: loadBase64FromFile("logo-isapm-org.txt"),
    kemenkesLogo: loadBase64FromFile("logo-kemenkes.txt"),
    perdatinLogo: loadBase64FromFile("logo-perdatin.txt"),
    ubLogo: loadBase64FromFile("logo-ub.txt"),
    idiLogo: loadBase64FromFile("logo-idi.txt"),
    lunasStamp: loadBase64FromFile("lunas-stamp.txt"),
    signature: loadBase64FromFile("signature.txt"),
  }

  const successCount = Object.values(cachedImages).filter(Boolean).length
  console.log(`[v0] Loaded ${successCount}/8 images from filesystem`)

  return cachedImages
}

export function formatTerbilang(num: number): string {
  if (num === 0) return "nol rupiah"
  const words = numberToIndonesianWords(num).trim().replace(/\s+/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1) + " rupiah"
}

export function generateInvoiceNumber(orderId: string, date: Date = new Date()): string {
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const orderSuffix = orderId.slice(0, 4).toUpperCase()
  return `Natmet-${year}${month}${day}${orderSuffix}`
}

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

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  const images = getAllImages()

  // Colors matching ISAPM branding
  const primaryBlue: [number, number, number] = [0, 102, 178]
  const lightBlue: [number, number, number] = [230, 244, 255]
  const darkText: [number, number, number] = [33, 37, 41]
  const grayText: [number, number, number] = [108, 117, 125]

  let yPos = margin

  // ============================================
  // BACKGROUND
  // ============================================
  doc.setFillColor(248, 252, 255)
  doc.rect(0, 0, pageWidth, pageHeight, "F")

  // ============================================
  // HEADER WITH LOGOS
  // ============================================

  // Main ISAPM 2026 Logo (left side)
  if (images.isapm2026Logo) {
    try {
      doc.addImage(images.isapm2026Logo, "PNG", margin, yPos, 70, 20)
    } catch (e) {
      console.error("[v0] Error adding ISAPM 2026 logo:", e)
    }
  }

  // Partner logos row (right side)
  const logoY = yPos + 2
  const logoSize = 14
  const logoSpacing = 16
  let logoX = pageWidth - margin - (logoSize * 5 + logoSpacing * 4)

  // Kemenkes logo
  if (images.kemenkesLogo) {
    try {
      doc.addImage(images.kemenkesLogo, "PNG", logoX, logoY, 22, logoSize)
    } catch (e) {
      console.error("[v0] Error adding Kemenkes logo:", e)
    }
  }
  logoX += 24

  // ISAPM org logo
  if (images.isapmOrgLogo) {
    try {
      doc.addImage(images.isapmOrgLogo, "PNG", logoX, logoY, logoSize, logoSize)
    } catch (e) {
      console.error("[v0] Error adding ISAPM org logo:", e)
    }
  }
  logoX += logoSpacing

  // PERDATIN logo
  if (images.perdatinLogo) {
    try {
      doc.addImage(images.perdatinLogo, "PNG", logoX, logoY, logoSize, logoSize)
    } catch (e) {
      console.error("[v0] Error adding PERDATIN logo:", e)
    }
  }
  logoX += logoSpacing

  // UB logo
  if (images.ubLogo) {
    try {
      doc.addImage(images.ubLogo, "PNG", logoX, logoY, logoSize, logoSize)
    } catch (e) {
      console.error("[v0] Error adding UB logo:", e)
    }
  }
  logoX += logoSpacing

  // IDI logo
  if (images.idiLogo) {
    try {
      doc.addImage(images.idiLogo, "PNG", logoX, logoY, logoSize, logoSize)
    } catch (e) {
      console.error("[v0] Error adding IDI logo:", e)
    }
  }

  yPos += 28

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
  doc.setFontSize(9)

  data.items.forEach((item, index) => {
    const rowHeight = 10
    const rowY = yPos

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(...lightBlue)
      doc.rect(margin, rowY, contentWidth, rowHeight, "F")
    }

    // Row border
    doc.setDrawColor(200, 220, 240)
    doc.setLineWidth(0.1)
    doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight)

    // Vertical lines for columns
    doc.line(colX.event, rowY, colX.event, rowY + rowHeight)
    doc.line(colX.harga, rowY, colX.harga, rowY + rowHeight)
    doc.line(colX.jumlah, rowY, colX.jumlah, rowY + rowHeight)

    const textY = rowY + 6.5

    // No column
    doc.text(`${index + 1}.`, colX.no + 4, textY)

    // Event column
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
    if (eventText.length > 50) {
      eventText = eventText.substring(0, 47) + "..."
    }
    doc.text(eventText, colX.event + 4, textY)

    // Unit price
    doc.text(formatRupiah(item.unitPrice), colX.harga + 4, textY)

    // Total
    const quantity = item.quantity || 1
    const nights = item.nights || 1
    const itemTotal = item.unitPrice * quantity * nights
    doc.text(formatRupiah(itemTotal), colX.jumlah + 4, textY)

    yPos += rowHeight
  })

  // Empty rows to fill table (minimum 7 rows)
  const minRows = 7
  const currentRows = data.items.length
  for (let i = currentRows; i < minRows; i++) {
    const rowHeight = 10
    const rowY = yPos

    if (i % 2 === 0) {
      doc.setFillColor(...lightBlue)
      doc.rect(margin, rowY, contentWidth, rowHeight, "F")
    }

    doc.setDrawColor(200, 220, 240)
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
  // PAYMENT INFO BOX
  // ============================================
  doc.setFillColor(...lightBlue)
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

  // ============================================
  // LUNAS STAMP
  // ============================================
  const stampX = margin + contentWidth / 2 + 15
  const stampY = yPos - 5

  if (images.lunasStamp) {
    try {
      doc.addImage(images.lunasStamp, "PNG", stampX, stampY, 40, 35)
    } catch (e) {
      console.error("[v0] Error adding LUNAS stamp:", e)
    }
  }

  yPos += 38

  // ============================================
  // SIGNATURE SECTION
  // ============================================
  const signatureX = pageWidth - margin - 70

  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Ketua,", signatureX, yPos)
  yPos += 2

  // Add signature image
  if (images.signature) {
    try {
      doc.addImage(images.signature, "PNG", signatureX - 5, yPos, 45, 25)
    } catch (e) {
      console.error("[v0] Error adding signature:", e)
    }
  }

  yPos += 28

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
  // CONTACT INFO (Bottom Right)
  // ============================================
  const contactY = pageHeight - 28
  const contactX = pageWidth - margin

  doc.setTextColor(...grayText)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Contact:", contactX, contactY, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
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
