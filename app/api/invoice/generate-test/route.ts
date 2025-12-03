import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { generateInvoicePDFSimple } from "@/lib/invoice/generate-invoice-simple"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*), profiles(full_name, email)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .eq("payment_status", "verified")
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Prepare invoice data
    const invoiceData = {
      orderNumber: order.order_number,
      userName: order.profiles?.full_name || "N/A",
      userEmail: order.profiles?.email || user.email || "N/A",
      totalAmount: order.total_amount,
      paymentDate: new Date(order.payment_verified_at || order.updated_at),
      items: order.order_items.map((item: any) => ({
        description: `${item.event_type} - ${item.category_name}`,
        quantity: 1,
        unitPrice: item.price,
        total: item.price,
      })),
    }

    // Generate PDF
    console.log("[v0] Generating simple invoice PDF for order:", orderId)
    const doc = await generateInvoicePDFSimple(invoiceData)
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Kwitansi-ISAPM-2026-${order.order_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating test invoice:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
