import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    // Admin client bypasses RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify caller is an admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Fetch sponsored verified payments joined with orders
    const { data, error } = await supabase
      .from("order_payments")
      .select(
        `
        *,
        orders (
          id,
          user_id,
          total_amount,
          email,
          full_name,
          institution,
          invoice_number,
          currency,
          created_at,
          status,
          order_items (
            id,
            event_label,
            item_type,
            unit_price
          )
        )
      `,
      )
      .ilike("payment_method", "sponsored")
      .eq("payment_status", "verified")
      .order("created_at", { ascending: false })
      .limit(2000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Exclude cancelled orders
    const rows = (data || []).filter((r: any) => {
      const order = Array.isArray(r.orders) ? r.orders[0] : r.orders
      return order && order.status !== "cancelled"
    })

    return NextResponse.json({ payments: rows })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "https://wilienulethgfxdiqghw.supabase.co"
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { payment_id, sponsor_externally_paid, sponsor_external_payment_notes } = body

    if (!payment_id) {
      return NextResponse.json({ error: "payment_id is required" }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (typeof sponsor_externally_paid === "boolean") {
      updates.sponsor_externally_paid = sponsor_externally_paid
      updates.sponsor_externally_paid_at = sponsor_externally_paid ? new Date().toISOString() : null
      updates.sponsor_externally_paid_by = sponsor_externally_paid ? user.email || user.id : null
    }
    if (typeof sponsor_external_payment_notes === "string") {
      updates.sponsor_external_payment_notes = sponsor_external_payment_notes
    }

    const { error } = await supabase
      .from("order_payments")
      .update(updates)
      .eq("id", payment_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}
