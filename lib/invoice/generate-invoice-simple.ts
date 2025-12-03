import jsPDF from "jspdf"

interface InvoiceData {
  orderNumber: string
  userName: string
  userEmail: string
  totalAmount: number
  paymentDate: Date
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
}

// Simple version without images for testing
export async function generateInvoicePDFSimple(data: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Background color
  doc.setFillColor(248, 252, 255)
  doc.rect(0, 0, 210, 297, "F")

  // Title
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text("KWITANSI", 105, 30, { align: "center" })

  doc.setFontSize(14)
  doc.text("ISAPM 2026", 105, 38, { align: "center" })

  // Invoice details
  let yPos = 60
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")

  doc.text(`No. Kwitansi: ${data.orderNumber}`, 20, yPos)
  yPos += 10
  doc.text(`Tanggal: ${data.paymentDate.toLocaleDateString("id-ID")}`, 20, yPos)
  yPos += 15

  doc.text("Diterima dari:", 20, yPos)
  yPos += 7
  doc.setFont("helvetica", "bold")
  doc.text(data.userName, 20, yPos)
  yPos += 7
  doc.setFont("helvetica", "normal")
  doc.text(data.userEmail, 20, yPos)
  yPos += 15

  // Items table
  doc.text("Untuk pembayaran:", 20, yPos)
  yPos += 10

  data.items.forEach((item) => {
    doc.text(`• ${item.description}`, 25, yPos)
    yPos += 7
    doc.text(`  ${item.quantity} x Rp ${item.unitPrice.toLocaleString("id-ID")}`, 30, yPos)
    yPos += 10
  })

  // Total
  yPos += 5
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("Total:", 120, yPos)
  doc.text(`Rp ${data.totalAmount.toLocaleString("id-ID")}`, 170, yPos, { align: "right" })

  // LUNAS stamp placeholder
  yPos += 20
  doc.setTextColor(0, 100, 200)
  doc.setFontSize(24)
  doc.text("LUNAS", 150, yPos)
  doc.setTextColor(0, 0, 0)

  // Signature section
  yPos = 230
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(
    "Malang, " + data.paymentDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    120,
    yPos,
  )
  yPos += 7
  doc.text("Panitia ISAPM 2026", 120, yPos)

  yPos += 25
  doc.text("Dr. dr. Ristiawan Muji Laksono, Sp.An, M.Kes", 120, yPos)
  doc.text("Ketua Panitia", 120, yPos + 5)

  // Contact info
  doc.setFontSize(9)
  doc.text("Kontak:", 140, 270)
  doc.text("Email: isapm2026@example.com", 140, 275)
  doc.text("Website: isapm2026.com", 140, 280)

  return doc
}

export function generateInvoiceBase64Simple(data: InvoiceData): string {
  const doc = generateInvoicePDFSimple(data)
  return doc.output("dataurlstring").split(",")[1]
}
