import { jsPDF } from "jspdf"

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

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2

  // Colors matching ISAPM branding
  const primaryBlue: [number, number, number] = [0, 169, 224] // ISAPM Cyan/Blue
  const darkText: [number, number, number] = [33, 37, 41]
  const grayText: [number, number, number] = [108, 117, 125]
  const redStamp: [number, number, number] = [220, 53, 69] // For LUNAS stamp
  const greenStamp: [number, number, number] = [40, 167, 69] // Alternative green for LUNAS

  let yPos = margin

  // ============================================
  // HEADER SECTION WITH LOGOS
  // ============================================

  // Main conference logo (left side)
  // Since we can't load external images in jsPDF easily on server, we'll create a styled header
  doc.setFillColor(...primaryBlue)
  doc.rect(margin, yPos, 50, 18, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("8", margin + 5, yPos + 12)
  doc.setFontSize(10)
  doc.text("ISAPM", margin + 15, yPos + 8)
  doc.setFontSize(12)
  doc.setTextColor(124, 179, 66) // Green for 2026
  doc.text("2026", margin + 33, yPos + 8)
  doc.setFontSize(6)
  doc.setTextColor(255, 255, 255)
  doc.text("Indonesian Society of Anesthesiology", margin + 15, yPos + 13)
  doc.text("for Pain Management", margin + 15, yPos + 16)

  // Partner logos placeholder (right side) - styled boxes
  const logoSize = 12
  const logoY = yPos + 3

  // Kemenkes logo placeholder
  doc.setFillColor(0, 168, 168) // Teal
  doc.circle(pageWidth - margin - 45, logoY + logoSize / 2, logoSize / 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(5)
  doc.text("KEMENKES", pageWidth - margin - 50, logoY + logoSize / 2 + 1)

  // ISAPM org logo placeholder
  doc.setFillColor(220, 53, 69) // Red
  doc.circle(pageWidth - margin - 25, logoY + logoSize / 2, logoSize / 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.text("ISAPM", pageWidth - margin - 29, logoY + logoSize / 2 + 1)

  // PERDATIN logo placeholder
  doc.setFillColor(220, 53, 69) // Red
  doc.circle(pageWidth - margin - 5, logoY + logoSize / 2, logoSize / 2, "F")
  doc.setTextColor(255, 255, 255)
  doc.text("PDT", pageWidth - margin - 8, logoY + logoSize / 2 + 1)

  yPos += 25

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
    // Truncate if too long
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
  // PAYMENT INFO BOX
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

  // ============================================
  // LUNAS (PAID) STAMP
  // ============================================
  const stampX = margin + contentWidth / 2 + 10
  const stampY = yPos + 5
  const stampWidth = 35
  const stampHeight = 18

  // Stamp border (tilted effect with double border)
  doc.setDrawColor(...greenStamp)
  doc.setLineWidth(1.5)

  // Outer rectangle
  doc.rect(stampX, stampY, stampWidth, stampHeight)

  // Inner rectangle
  doc.setLineWidth(0.5)
  doc.rect(stampX + 2, stampY + 2, stampWidth - 4, stampHeight - 4)

  // LUNAS text
  doc.setTextColor(...greenStamp)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("LUNAS", stampX + stampWidth / 2, stampY + stampHeight / 2 + 2, { align: "center" })

  // Date under stamp
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  const paymentDateStr = data.paymentDate
    ? formatDateIndonesian(data.paymentDate)
    : formatDateIndonesian(data.invoiceDate)
  doc.text(paymentDateStr, stampX + stampWidth / 2, stampY + stampHeight + 5, { align: "center" })

  yPos += 38

  // ============================================
  // SIGNATURE SECTION
  // ============================================
  const signatureX = pageWidth - margin - 70

  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Ketua,", signatureX, yPos)
  yPos += 5

  // Signature line (simulated signature)
  doc.setDrawColor(...primaryBlue)
  doc.setLineWidth(0.3)
  // Draw a simple signature-like curve
  doc.line(signatureX, yPos + 8, signatureX + 40, yPos + 8)
  doc.line(signatureX + 5, yPos + 5, signatureX + 15, yPos + 10)
  doc.line(signatureX + 15, yPos + 10, signatureX + 25, yPos + 3)
  doc.line(signatureX + 25, yPos + 3, signatureX + 35, yPos + 12)

  yPos += 18

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
