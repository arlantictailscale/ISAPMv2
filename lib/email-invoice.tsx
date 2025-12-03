import { Resend } from "resend"
import {
  generateInvoiceBase64,
  generateInvoiceNumber,
  type InvoiceData,
  type InvoiceItem,
  formatRupiah,
  formatDateIndonesian,
  formatTerbilang,
} from "@/lib/invoice/generate-invoice"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendInvoiceEmailParams {
  email: string
  userName: string
  orderId: string
  orderItems: Array<{
    item_type: string
    event_label?: string
    participant_type_label?: string
    hotel_room_type?: string
    unit_price: number
    nights?: number
    check_in_date?: string
    check_out_date?: string
  }>
  totalAmount: number
  currency: string
  customerInstitution?: string
  customerPhone?: string
  paymentVerifiedAt: Date
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const {
    email,
    userName,
    orderId,
    orderItems,
    totalAmount,
    currency,
    customerInstitution,
    customerPhone,
    paymentVerifiedAt,
  } = params

  try {
    // Prepare invoice items
    const items: InvoiceItem[] = orderItems.map((item) => ({
      eventLabel: item.event_label || item.hotel_room_type || "Item",
      unitPrice: item.unit_price,
      quantity: 1,
      nights: item.nights || 1,
      itemType: item.item_type,
      participantTypeLabel: item.participant_type_label,
      hotelRoomType: item.hotel_room_type,
      checkInDate: item.check_in_date,
      checkOutDate: item.check_out_date,
    }))

    // Prepare invoice data
    const invoiceData: InvoiceData = {
      orderId,
      invoiceNumber: generateInvoiceNumber(orderId, paymentVerifiedAt),
      invoiceDate: paymentVerifiedAt,
      customerName: userName,
      customerEmail: email,
      customerPhone,
      customerInstitution,
      items,
      totalAmount,
      currency,
      paymentDate: paymentVerifiedAt,
    }

    const pdfBase64 = await generateInvoiceBase64(invoiceData)

    // Generate items HTML for email body
    const itemsHtml = orderItems
      .map((item, index) => {
        let itemName = ""
        if (item.item_type === "hotel") {
          itemName = `Hotel: ${item.hotel_room_type || "Room"}`
          if (item.nights && item.nights > 1) {
            itemName += ` (${item.nights} malam)`
          }
        } else {
          itemName = item.event_label || "Event Registration"
          if (item.participant_type_label) {
            itemName += ` - ${item.participant_type_label}`
          }
        }

        const itemTotal = item.unit_price * (item.nights || 1)

        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${itemName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatRupiah(item.unit_price)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatRupiah(itemTotal)}</td>
          </tr>
        `
      })
      .join("")

    await resend.emails.send({
      from: "ISAPM 2026 <noreply@isapm2026.org>",
      to: email,
      subject: `Kwitansi Pembayaran - ISAPM 2026 (${invoiceData.invoiceNumber})`,
      attachments: [
        {
          filename: `Kwitansi-ISAPM-2026-${invoiceData.invoiceNumber}.pdf`,
          content: pdfBase64,
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #00A9E0 0%, #0088B8 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
              .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
              .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e2e8f0; border-top: none; }
              .invoice-info { background: #f7fafc; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
              .invoice-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
              .invoice-row:last-child { border-bottom: none; }
              .invoice-label { color: #64748b; font-size: 14px; }
              .invoice-value { font-weight: 600; color: #1e293b; }
              .total-box { background: linear-gradient(135deg, #00A9E0 0%, #0088B8 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .total-amount { font-size: 28px; font-weight: 700; margin: 10px 0; }
              .terbilang { font-style: italic; font-size: 12px; opacity: 0.9; }
              .button { display: inline-block; background: linear-gradient(135deg, #EF3340 0%, #d92532 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; text-align: center; }
              .footer { text-align: center; padding: 30px 20px; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
              .footer-brand { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>TANDA TERIMA PEMBAYARAN</h1>
                <p>Kwitansi resmi untuk pembayaran Anda</p>
              </div>
              <div class="content">
                <p style="font-size: 16px; color: #1a202c; margin-top: 0;">Yth. ${userName},</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.7;">
                  Terima kasih atas pembayaran Anda. Terlampir adalah kwitansi resmi untuk transaksi Anda di ISAPM 8th National Meeting 2026.
                </p>

                <div class="invoice-info">
                  <div class="invoice-row">
                    <span class="invoice-label">No. Kwitansi</span>
                    <span class="invoice-value" style="font-family: monospace;">${invoiceData.invoiceNumber}</span>
                  </div>
                  <div class="invoice-row">
                    <span class="invoice-label">Tanggal</span>
                    <span class="invoice-value">${formatDateIndonesian(paymentVerifiedAt)}</span>
                  </div>
                  <div class="invoice-row">
                    <span class="invoice-label">Order ID</span>
                    <span class="invoice-value" style="font-family: monospace;">#${orderId.substring(0, 8)}</span>
                  </div>
                </div>

                <h3 style="font-size: 16px; color: #1a202c; margin: 25px 0 15px;">Detail Pembelian:</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <thead>
                    <tr style="background: #f8f9fa;">
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #00A9E0; width: 40px;">No</th>
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #00A9E0;">Event</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #00A9E0;">Harga</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #00A9E0;">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <div class="total-box">
                  <div style="font-size: 14px; opacity: 0.9;">Total Pembayaran</div>
                  <div class="total-amount">${formatRupiah(totalAmount)}</div>
                  <div class="terbilang">${formatTerbilang(totalAmount)}</div>
                </div>

                <div style="background: #f0f9ff; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #00A9E0;">
                  <h3 style="font-size: 14px; color: #0369a1; margin-top: 0;">📎 Lampiran</h3>
                  <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
                    Kwitansi dalam format PDF telah dilampirkan pada email ini. Anda juga dapat mengunduh kwitansi dari dashboard akun Anda.
                  </p>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-purchases" class="button">Lihat Pembelian Saya</a>
                </div>

                <p style="font-size: 14px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  Butuh bantuan? Hubungi kami di <a href="mailto:admin@isapm2026.org" style="color: #00A9E0; text-decoration: none;">admin@isapm2026.org</a> 
                  atau via WhatsApp di <a href="https://wa.me/6289602626709" style="color: #00A9E0; text-decoration: none;">+6289602626709</a>
                </p>
                
                <p style="font-size: 15px; color: #1a202c; margin-top: 25px;">
                  Hormat kami,<br>
                  <strong>Tim ISAPM 2026</strong>
                </p>
              </div>
              <div class="footer">
                <div class="footer-brand">ISAPM 2026 National Meeting</div>
                <div>Indonesian Society of Anesthesiology for Pain Management</div>
                <div style="margin-top: 12px;">
                  <a href="mailto:admin@isapm2026.org" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">Email</a> •
                  <a href="https://wa.me/6289602626709" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">WhatsApp</a> •
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #00A9E0; text-decoration: none; margin: 0 10px;">Website</a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log("[v0] Invoice email sent to:", email)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error sending invoice email:", error)
    return { success: false, error }
  }
}
