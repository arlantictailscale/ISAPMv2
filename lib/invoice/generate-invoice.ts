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

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  // Colors
  const primaryColor: [number, number, number] = [0, 169, 224] // ISAPM Blue
  const darkText: [number, number, number] = [33, 37, 41]
  const grayText: [number, number, number] = [108, 117, 125]

  let yPos = margin

  // Header - Title
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...primaryColor)
  doc.text("TANDA TERIMA PEMBAYARAN", pageWidth / 2, yPos, { align: "center" })
  yPos += 12

  // Divider line
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Invoice info section
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...darkText)

  // Left column - Invoice details
  doc.setFont("helvetica", "bold")
  doc.text("No. Kwitansi", margin, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${data.invoiceNumber}`, margin + 30, yPos)

  // Right column - Customer details
  doc.setFont("helvetica", "bold")
  doc.text("Kepada:", pageWidth / 2 + 10, yPos)
  yPos += 6

  doc.setFont("helvetica", "bold")
  doc.text("Tanggal", margin, yPos)
  doc.setFont("helvetica", "normal")
  doc.text(`: ${formatDateIndonesian(data.invoiceDate)}`, margin + 30, yPos)

  doc.setFont("helvetica", "normal")
  doc.text(data.customerName, pageWidth / 2 + 10, yPos)
  yPos += 5

  if (data.customerInstitution) {
    doc.setTextColor(...grayText)
    doc.text(data.customerInstitution, pageWidth / 2 + 10, yPos)
    yPos += 5
  }

  doc.text(data.customerEmail, pageWidth / 2 + 10, yPos)
  yPos += 10

  // Table Header
  const tableStartY = yPos
  const colWidths = [10, 75, 40, 40] // No, Event, Harga, Jumlah
  const colX = [margin, margin + 10, margin + 85, margin + 125]

  // Table header background
  doc.setFillColor(...primaryColor)
  doc.rect(margin, tableStartY, contentWidth, 8, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("No", colX[0] + 2, tableStartY + 5.5)
  doc.text("Event", colX[1] + 2, tableStartY + 5.5)
  doc.text("Harga", colX[2] + 2, tableStartY + 5.5)
  doc.text("Jumlah", colX[3] + 2, tableStartY + 5.5)

  yPos = tableStartY + 8

  // Table rows
  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)

  data.items.forEach((item, index) => {
    const rowHeight = 12
    const rowY = yPos

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250)
      doc.rect(margin, rowY, contentWidth, rowHeight, "F")
    }

    // Row border
    doc.setDrawColor(222, 226, 230)
    doc.setLineWidth(0.1)
    doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight)

    // Row content
    const textY = rowY + 7

    // No column
    doc.text((index + 1).toString(), colX[0] + 2, textY)

    // Event column - format based on item type
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
    if (eventText.length > 45) {
      eventText = eventText.substring(0, 42) + "..."
    }
    doc.text(eventText, colX[1] + 2, textY)

    // Unit price
    doc.text(formatRupiah(item.unitPrice), colX[2] + 2, textY)

    // Total (unit price * quantity * nights)
    const quantity = item.quantity || 1
    const nights = item.nights || 1
    const itemTotal = item.unitPrice * quantity * nights
    doc.text(formatRupiah(itemTotal), colX[3] + 2, textY)

    yPos += rowHeight
  })

  // Empty rows to fill table (minimum 6 rows total)
  const minRows = 6
  const currentRows = data.items.length
  if (currentRows < minRows) {
    for (let i = currentRows; i < minRows; i++) {
      const rowHeight = 12
      const rowY = yPos

      if (i % 2 === 0) {
        doc.setFillColor(248, 249, 250)
        doc.rect(margin, rowY, contentWidth, rowHeight, "F")
      }

      doc.setDrawColor(222, 226, 230)
      doc.setLineWidth(0.1)
      doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight)

      yPos += rowHeight
    }
  }

  // Total row
  const totalRowY = yPos
  doc.setFillColor(...primaryColor)
  doc.rect(margin, totalRowY, contentWidth, 10, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Total Pembayaran:", colX[1] + 2, totalRowY + 7)
  doc.text(formatRupiah(data.totalAmount), colX[3] + 2, totalRowY + 7)

  yPos = totalRowY + 18

  // Terbilang section
  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Terbilang:", margin, yPos)
  yPos += 6

  doc.setFont("helvetica", "italic")
  doc.setFontSize(9)
  const terbilang = formatTerbilang(data.totalAmount)
  const splitTerbilang = doc.splitTextToSize(terbilang, contentWidth)
  doc.text(splitTerbilang, margin, yPos)
  yPos += splitTerbilang.length * 5 + 8

  // Payment info box
  doc.setFillColor(248, 249, 250)
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, "F")

  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.text("Telah dibayarkan pada:", margin + 5, yPos + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("No. Rek. 7207681363 (BSI)", margin + 5, yPos + 15)
  doc.text("a.n PT. Tombo Farma Indonesia", margin + 5, yPos + 21)

  yPos += 35

  // Signature section
  doc.setTextColor(...darkText)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Ketua,", pageWidth - margin - 60, yPos)
  yPos += 25

  doc.setFont("helvetica", "bold")
  doc.text("Dr. dr. Ristiawan Muji Laksono,", pageWidth - margin - 60, yPos)
  yPos += 5
  doc.text("Sp.An-TI., Subsp. M.N (K)., FIPP", pageWidth - margin - 60, yPos)
  yPos += 15

  // Footer
  doc.setTextColor(...primaryColor)
  doc.setFont("helvetica", "italic")
  doc.setFontSize(10)
  doc.text("Terimakasih sudah berpartisipasi pada ISAPM 8th National Meeting 2026", pageWidth / 2, yPos, {
    align: "center",
  })

  return doc
}

// Generate invoice as base64 for email attachment
export function generateInvoiceBase64(data: InvoiceData): string {
  const doc = generateInvoicePDF(data)
  return doc.output("datauristring").split(",")[1]
}

// Generate invoice as blob for download
export function generateInvoiceBlob(data: InvoiceData): Blob {
  const doc = generateInvoicePDF(data)
  return doc.output("blob")
}
