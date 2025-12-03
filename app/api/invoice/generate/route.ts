import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import {
  generateInvoicePDF,
  generateInvoiceNumber,
  type InvoiceData,
  type InvoiceItem,
} from "@/lib/invoice/generate-invoice"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch order with items and payment info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*),
        order_payments (*)
      `)
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("[v0] Error fetching order:", orderError)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Check if user owns this order or is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const isAdmin = profile?.role === "admin"
    if (order.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if payment is verified
    const payment = order.order_payments?.[0]
    if (!payment || payment.payment_status !== "verified") {
      return NextResponse.json({ error: "Invoice only available for verified payments" }, { status: 400 })
    }

    // Prepare invoice items
    const items: InvoiceItem[] = (order.order_items || []).map((item: any) => ({
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

    // Calculate total
    const totalAmount = items.reduce((sum, item) => {
      const nights = item.nights || 1
      return sum + item.unitPrice * nights
    }, 0)

    // Prepare invoice data
    const invoiceDate = payment.verified_at ? new Date(payment.verified_at) : new Date()
    const invoiceData: InvoiceData = {
      orderId: order.id,
      invoiceNumber: generateInvoiceNumber(order.id, invoiceDate),
      invoiceDate,
      customerName: order.full_name,
      customerEmail: order.email,
      customerPhone: order.phone,
      customerInstitution: order.institution,
      items,
      totalAmount,
      currency: order.currency || "IDR",
      paymentDate: payment.verified_at ? new Date(payment.verified_at) : undefined,
    }

    // Generate PDF
    const doc = await generateInvoicePDF(invoiceData)
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Kwitansi-ISAPM-2026-${invoiceData.invoiceNumber}.pdf"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[v0] Error generating invoice:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
