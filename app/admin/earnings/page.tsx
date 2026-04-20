"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Loader2,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Tag as TagIcon,
  ShoppingCart,
  Calendar,
  FileSpreadsheet,
  ArrowUpDown,
  Wallet,
  PercentCircle,
  Search,
} from "lucide-react"

interface OrderItem {
  id: string
  order_id: string
  event_id: string | null
  event_label: string | null
  item_type: string
  participant_type_id: string | null
  participant_type_label: string | null
  unit_price: number | null
  original_price: number | null
  discount_amount: number | null
  currency: string | null
  nights: number | null
  hotel_room_type: string | null
}

interface OrderWithDetails {
  id: string
  status: string
  currency: string
  total_amount: number
  discount_amount: number | null
  created_at: string
  order_items: OrderItem[]
  order_payments: Array<{
    payment_status: string
    verified_at: string | null
    amount: number
  }>
}

interface EventEarnings {
  key: string
  item_type: string
  event_id: string
  event_label: string
  orders: Set<string>
  tickets_sold: number
  gross_revenue: number
  discounts: number
  net_revenue: number
  currency: string
}

type SortField = "label" | "tickets" | "gross" | "discounts" | "net"
type SortDir = "asc" | "desc"

const ITEM_TYPE_LABELS: Record<string, string> = {
  event: "Event Registration",
  hotel: "Hotel Booking",
  webinar: "Webinar Access",
}

const ITEM_TYPE_COLORS: Record<string, string> = {
  event: "bg-teal-100 text-teal-700 border-teal-200",
  hotel: "bg-orange-100 text-orange-700 border-orange-200",
  webinar: "bg-indigo-100 text-indigo-700 border-indigo-200",
}

export default function AdminEarningsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [orders, setOrders] = useState<OrderWithDetails[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("net")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    checkAuthAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndLoad = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      if (profile?.role !== "admin") {
        toast.error("Unauthorized access")
        router.push("/dashboard")
        return
      }
      await loadOrders()
    } catch (err: any) {
      console.error("[v0] Earnings auth error:", err)
      toast.error("Failed to load earnings data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
          id,
          status,
          currency,
          total_amount,
          discount_amount,
          created_at,
          order_items (
            id,
            order_id,
            event_id,
            event_label,
            item_type,
            participant_type_id,
            participant_type_label,
            unit_price,
            original_price,
            discount_amount,
            currency,
            nights,
            hotel_room_type
          ),
          order_payments!inner (
            payment_status,
            verified_at,
            amount
          )
        `
      )
      .neq("status", "cancelled")
      .eq("order_payments.payment_status", "verified")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Load orders error:", error)
      toast.error("Failed to load orders")
      return
    }
    setOrders((data as any) || [])
  }

  const refresh = async () => {
    setIsRefreshing(true)
    await loadOrders()
    setIsRefreshing(false)
    toast.success("Earnings refreshed")
  }

  // Flatten all verified order items into a filterable list
  const allItems = useMemo(() => {
    const items: Array<OrderItem & { order_id: string; order_date: string }> = []
    orders.forEach((o) => {
      ;(o.order_items || []).forEach((it) => {
        items.push({ ...it, order_id: o.id, order_date: o.created_at })
      })
    })
    return items
  }, [orders])

  // Filter items by date + type + search
  const filteredItems = useMemo(() => {
    const now = new Date()
    return allItems.filter((it) => {
      if (itemTypeFilter !== "all" && it.item_type !== itemTypeFilter) return false

      if (dateRange !== "all") {
        const d = new Date(it.order_date)
        if (dateRange === "7d") {
          const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (d < cutoff) return false
        } else if (dateRange === "30d") {
          const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (d < cutoff) return false
        } else if (dateRange === "90d") {
          const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          if (d < cutoff) return false
        } else if (dateRange === "ytd") {
          const start = new Date(now.getFullYear(), 0, 1)
          if (d < start) return false
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const label = (it.event_label || "").toLowerCase()
        const id = (it.event_id || "").toLowerCase()
        if (!label.includes(q) && !id.includes(q)) return false
      }
      return true
    })
  }, [allItems, itemTypeFilter, dateRange, searchQuery])

  // Aggregate filtered items by event
  const earningsByEvent = useMemo(() => {
    const map = new Map<string, EventEarnings>()
    filteredItems.forEach((it) => {
      const eventId = it.event_id || "unknown"
      const itemType = it.item_type || "event"
      const key = `${itemType}::${eventId}`
      // For hotel items the prices are per-night; multiply by nights for the real totals.
      // For all other item types, multiplier is 1.
      const isHotel = itemType === "hotel" || Number(it.nights || 0) > 0
      const multiplier = isHotel ? Math.max(1, Number(it.nights || 1)) : 1
      const unit = Number(it.unit_price || 0) * multiplier
      const original = Number(it.original_price || it.unit_price || 0) * multiplier
      const discount = Number(it.discount_amount || Math.max(0, original - unit))
      const gross = original > 0 ? original : unit

      const existing = map.get(key)
      if (existing) {
        existing.orders.add(it.order_id)
        existing.tickets_sold += 1
        existing.gross_revenue += gross
        existing.discounts += discount
        existing.net_revenue += unit
      } else {
        map.set(key, {
          key,
          item_type: itemType,
          event_id: eventId,
          event_label: it.event_label || eventId || "(untitled)",
          orders: new Set([it.order_id]),
          tickets_sold: 1,
          gross_revenue: gross,
          discounts: discount,
          net_revenue: unit,
          currency: it.currency || "IDR",
        })
      }
    })
    return Array.from(map.values())
  }, [filteredItems])

  // Sort
  const sortedEarnings = useMemo(() => {
    const arr = [...earningsByEvent]
    arr.sort((a, b) => {
      let diff = 0
      switch (sortField) {
        case "label":
          diff = a.event_label.localeCompare(b.event_label)
          break
        case "tickets":
          diff = a.tickets_sold - b.tickets_sold
          break
        case "gross":
          diff = a.gross_revenue - b.gross_revenue
          break
        case "discounts":
          diff = a.discounts - b.discounts
          break
        case "net":
        default:
          diff = a.net_revenue - b.net_revenue
      }
      return sortDir === "asc" ? diff : -diff
    })
    return arr
  }, [earningsByEvent, sortField, sortDir])

  // Totals
  const totals = useMemo(() => {
    const grossRevenue = earningsByEvent.reduce((s, e) => s + e.gross_revenue, 0)
    const discounts = earningsByEvent.reduce((s, e) => s + e.discounts, 0)
    const netRevenue = earningsByEvent.reduce((s, e) => s + e.net_revenue, 0)
    const ticketsSold = earningsByEvent.reduce((s, e) => s + e.tickets_sold, 0)
    const ordersSet = new Set<string>()
    earningsByEvent.forEach((e) => e.orders.forEach((id) => ordersSet.add(id)))

    // Total collected = sum of verified order_payments.amount (matches Payment Validation page)
    const totalCollected = orders.reduce((s, o) => {
      const verified = (o.order_payments || []).filter(
        (p: any) => p.payment_status === "verified",
      )
      return s + verified.reduce((ss: number, p: any) => ss + Number(p.amount || 0), 0)
    }, 0)

    return {
      grossRevenue,
      discounts,
      netRevenue,
      ticketsSold,
      ordersCount: ordersSet.size,
      totalCollected,
    }
  }, [earningsByEvent, orders])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir(field === "label" ? "asc" : "desc")
    }
  }

  const formatCurrency = (value: number, currency = "IDR") => {
    if (currency === "IDR") {
      return `Rp ${Math.round(value).toLocaleString("id-ID")}`
    }
    return `${currency} ${value.toFixed(2)}`
  }

  const buildExportRows = () => {
    return sortedEarnings.map((e) => ({
      Type: ITEM_TYPE_LABELS[e.item_type] || e.item_type,
      "Event / Item": e.event_label,
      "Event ID": e.event_id,
      Orders: e.orders.size,
      "Tickets Sold": e.tickets_sold,
      Currency: e.currency,
      "Gross Revenue": Math.round(e.gross_revenue),
      Discounts: Math.round(e.discounts),
      "Net Revenue": Math.round(e.net_revenue),
    }))
  }

  const exportToExcel = () => {
    try {
      const rows = buildExportRows()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws["!cols"] = [
        { wch: 20 }, { wch: 50 }, { wch: 18 }, { wch: 10 },
        { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
      ]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Earnings")

      // Summary sheet
      const summary = [
        { Metric: "Total Orders", Value: totals.ordersCount },
        { Metric: "Tickets / Items Sold", Value: totals.ticketsSold },
        { Metric: "Gross Revenue (IDR)", Value: Math.round(totals.totalCollected + totals.discounts) },
        { Metric: "Discounts (IDR)", Value: Math.round(totals.discounts) },
        { Metric: "Net Revenue (IDR)", Value: Math.round(totals.totalCollected) },
        { Metric: "Generated", Value: format(new Date(), "yyyy-MM-dd HH:mm") },
      ]
      const wsSummary = XLSX.utils.json_to_sheet(summary)
      wsSummary["!cols"] = [{ wch: 28 }, { wch: 24 }]
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

      XLSX.writeFile(wb, `isapm-earnings-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
      toast.success("Excel file downloaded")
    } catch (err: any) {
      console.error("[v0] Export excel error:", err)
      toast.error("Failed to export Excel")
    }
  }

  const exportToCSV = () => {
    try {
      const rows = buildExportRows()
      if (rows.length === 0) {
        toast.error("No data to export")
        return
      }
      const headers = Object.keys(rows[0])
      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const v = (r as any)[h]
              const s = typeof v === "string" ? v : String(v)
              return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
            })
            .join(",")
        ),
      ].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `isapm-earnings-${format(new Date(), "yyyy-MM-dd")}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV file downloaded")
    } catch (err: any) {
      console.error("[v0] Export csv error:", err)
      toast.error("Failed to export CSV")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center pt-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navigation />
      <main className="flex-1 pt-20 md:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
                Earnings Breakdown
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Detailed revenue from verified orders across all events.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        <SummaryCard
          label="Net Revenue"
          value={formatCurrency(totals.totalCollected)}
          icon={<Wallet className="h-5 w-5" />}
          accent="border-l-teal-500 bg-teal-50"
          iconBg="bg-teal-100 text-teal-700"
        />
        <SummaryCard
          label="Gross Revenue"
          value={formatCurrency(totals.totalCollected + totals.discounts)}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="border-l-blue-500 bg-blue-50"
          iconBg="bg-blue-100 text-blue-700"
        />
            <SummaryCard
              label="Discounts"
              value={formatCurrency(totals.discounts)}
              icon={<PercentCircle className="h-5 w-5" />}
              accent="border-l-orange-500 bg-orange-50"
              iconBg="bg-orange-100 text-orange-700"
            />
            <SummaryCard
              label="Tickets Sold"
              value={totals.ticketsSold.toLocaleString("id-ID")}
              icon={<TagIcon className="h-5 w-5" />}
              accent="border-l-indigo-500 bg-indigo-50"
              iconBg="bg-indigo-100 text-indigo-700"
            />
            <SummaryCard
              label="Orders"
              value={totals.ordersCount.toLocaleString("id-ID")}
              icon={<ShoppingCart className="h-5 w-5" />}
              accent="border-l-emerald-500 bg-emerald-50"
              iconBg="bg-emerald-100 text-emerald-700"
            />
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by event name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                  <SelectTrigger>
                    <TagIcon className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="event">Event Registrations</SelectItem>
                    <SelectItem value="hotel">Hotel Bookings</SelectItem>
                    <SelectItem value="webinar">Webinar Access</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="ytd">Year to date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Showing {sortedEarnings.length} event{sortedEarnings.length === 1 ? "" : "s"} • {totals.ticketsSold} ticket{totals.ticketsSold === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          {/* Earnings Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Earnings per Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedEarnings.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm">
                  <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  No earnings match the current filters.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <SortButton
                              label="Event / Item"
                              field="label"
                              sortField={sortField}
                              sortDir={sortDir}
                              onClick={() => toggleSort("label")}
                            />
                          </TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">
                            <SortButton
                              label="Tickets"
                              field="tickets"
                              sortField={sortField}
                              sortDir={sortDir}
                              onClick={() => toggleSort("tickets")}
                              align="right"
                            />
                          </TableHead>
                          <TableHead className="text-right">
                            <SortButton
                              label="Gross"
                              field="gross"
                              sortField={sortField}
                              sortDir={sortDir}
                              onClick={() => toggleSort("gross")}
                              align="right"
                            />
                          </TableHead>
                          <TableHead className="text-right">
                            <SortButton
                              label="Discounts"
                              field="discounts"
                              sortField={sortField}
                              sortDir={sortDir}
                              onClick={() => toggleSort("discounts")}
                              align="right"
                            />
                          </TableHead>
                          <TableHead className="text-right">
                            <SortButton
                              label="Net Revenue"
                              field="net"
                              sortField={sortField}
                              sortDir={sortDir}
                              onClick={() => toggleSort("net")}
                              align="right"
                            />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedEarnings.map((e) => (
                          <TableRow key={e.key}>
                            <TableCell>
                              <div className="font-medium">{e.event_label}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {e.event_id}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={ITEM_TYPE_COLORS[e.item_type] || ""}
                              >
                                {ITEM_TYPE_LABELS[e.item_type] || e.item_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {e.orders.size}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {e.tickets_sold}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {formatCurrency(e.gross_revenue, e.currency)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-orange-600">
                              {e.discounts > 0
                                ? `- ${formatCurrency(e.discounts, e.currency)}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold text-teal-700">
                              {formatCurrency(e.net_revenue, e.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <tfoot>
                        <tr className="border-t-2 bg-muted/40">
                          <td className="px-4 py-3 font-semibold" colSpan={2}>
                            Totals
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {totals.ordersCount}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {totals.ticketsSold}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {formatCurrency(totals.grossRevenue)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-orange-600">
                            {totals.discounts > 0
                              ? `- ${formatCurrency(totals.discounts)}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums text-teal-700">
                            {formatCurrency(totals.netRevenue)}
                          </td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {sortedEarnings.map((e) => (
                      <div
                        key={e.key}
                        className="rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {e.event_label}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">
                              {e.event_id}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={ITEM_TYPE_COLORS[e.item_type] || ""}
                          >
                            {ITEM_TYPE_LABELS[e.item_type] || e.item_type}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">Orders</div>
                            <div className="font-medium tabular-nums">{e.orders.size}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Tickets</div>
                            <div className="font-medium tabular-nums">{e.tickets_sold}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Gross</div>
                            <div className="font-medium tabular-nums text-muted-foreground">
                              {formatCurrency(e.gross_revenue, e.currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Discounts</div>
                            <div className="font-medium tabular-nums text-orange-600">
                              {e.discounts > 0
                                ? `- ${formatCurrency(e.discounts, e.currency)}`
                                : "—"}
                            </div>
                          </div>
                          <div className="col-span-2 pt-2 border-t">
                            <div className="text-xs text-muted-foreground">
                              Net Revenue
                            </div>
                            <div className="font-bold text-teal-700 tabular-nums">
                              {formatCurrency(e.net_revenue, e.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  accent,
  iconBg,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent: string
  iconBg: string
}) {
  return (
    <div
      className={`rounded-lg border-l-4 ${accent} p-4 flex items-center gap-3`}
    >
      <div
        className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className="font-bold text-base md:text-lg tabular-nums truncate">
          {value}
        </div>
      </div>
    </div>
  )
}

function SortButton({
  label,
  field,
  sortField,
  sortDir,
  onClick,
  align = "left",
}: {
  label: string
  field: SortField
  sortField: SortField
  sortDir: SortDir
  onClick: () => void
  align?: "left" | "right"
}) {
  const active = sortField === field
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium text-xs uppercase tracking-wide hover:text-foreground transition-colors ${
        active ? "text-foreground" : "text-muted-foreground"
      } ${align === "right" ? "ml-auto" : ""}`}
    >
      {label}
      <ArrowUpDown
        className={`h-3 w-3 ${active ? "opacity-100" : "opacity-40"}`}
      />
    </button>
  )
}
