"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"
import * as XLSX from "xlsx"

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  Circle,
  Download,
  FileSpreadsheet,
  Gift,
  Loader2,
  RefreshCw,
  Search,
  ArrowUpDown,
  Calendar,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Wallet,
  AlertTriangle,
} from "lucide-react"

type SponsorPayment = {
  id: string
  order_id: string
  amount: number
  currency: string
  payment_method: string
  payment_status: string
  sponsor_name: string | null
  invoice_number: string | null
  notes: string | null
  created_at: string
  verified_at: string | null
  sponsor_externally_paid: boolean | null
  sponsor_externally_paid_at: string | null
  sponsor_externally_paid_by: string | null
  sponsor_external_payment_notes: string | null
  orders: {
    id: string
    full_name: string
    email: string
    phone: string | null
    institution: string | null
    position: string | null
    total_amount: number
    currency: string
    created_at: string
    order_items: Array<{
      id: string
      event_label: string | null
      item_type: string
      unit_price: number
    }>
  }
}

type StatusFilter = "all" | "paid" | "unpaid"
type SortField = "date" | "sponsor" | "amount" | "attendee" | "status"
type SortDir = "asc" | "desc"

const formatCurrency = (amount: number, currency = "IDR") => {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("id-ID")}`
  }
}

export default function SponsorReviewPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [payments, setPayments] = useState<SponsorPayment[]>([])

  // Filters
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Notes dialog
  const [notesTarget, setNotesTarget] = useState<SponsorPayment | null>(null)
  const [notesDraft, setNotesDraft] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Detail dialog
  const [detailTarget, setDetailTarget] = useState<SponsorPayment | null>(null)

  useEffect(() => {
    void checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkAuth() {
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
      router.push("/dashboard")
      return
    }

    setIsAdmin(true)
    await fetchPayments()
  }

  async function fetchPayments() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("order_payments")
        .select(
          `
          id,
          order_id,
          amount,
          currency,
          payment_method,
          payment_status,
          sponsor_name,
          invoice_number,
          notes,
          created_at,
          verified_at,
          sponsor_externally_paid,
          sponsor_externally_paid_at,
          sponsor_externally_paid_by,
          sponsor_external_payment_notes,
          orders:order_id (
            id,
            full_name,
            email,
            phone,
            institution,
            position,
            total_amount,
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
        .eq("payment_method", "sponsored")
        .eq("payment_status", "verified")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Exclude cancelled orders
      const rows = ((data || []) as any[])
        .filter((r) => r.orders && r.orders.status !== "cancelled")
        .map((r) => ({
          ...r,
          orders: Array.isArray(r.orders) ? r.orders[0] : r.orders,
        })) as SponsorPayment[]

      setPayments(rows)
    } catch (err: any) {
      console.error("[v0] Error fetching sponsor payments:", err)
      toast.error(err.message || "Failed to load sponsor payments")
    } finally {
      setLoading(false)
    }
  }

  // Derived: filtered + sorted
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const from = fromDate ? new Date(fromDate).getTime() : null
    const to = toDate ? new Date(toDate).getTime() + 24 * 60 * 60 * 1000 : null

    return payments.filter((p) => {
      if (status === "paid" && !p.sponsor_externally_paid) return false
      if (status === "unpaid" && p.sponsor_externally_paid) return false

      if (from || to) {
        const ts = new Date(p.created_at).getTime()
        if (from && ts < from) return false
        if (to && ts > to) return false
      }

      if (!needle) return true
      const haystack = [
        p.sponsor_name,
        p.invoice_number,
        p.orders?.full_name,
        p.orders?.email,
        p.orders?.institution,
        p.orders?.phone,
        p.notes,
        p.sponsor_external_payment_notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [payments, search, status, fromDate, toDate])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === "asc" ? 1 : -1
    arr.sort((a, b) => {
      switch (sortField) {
        case "sponsor":
          return (a.sponsor_name || "").localeCompare(b.sponsor_name || "") * dir
        case "attendee":
          return (a.orders?.full_name || "").localeCompare(b.orders?.full_name || "") * dir
        case "amount":
          return (a.amount - b.amount) * dir
        case "status": {
          const av = a.sponsor_externally_paid ? 1 : 0
          const bv = b.sponsor_externally_paid ? 1 : 0
          return (av - bv) * dir
        }
        case "date":
        default:
          return (
            (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
          )
      }
    })
    return arr
  }, [filtered, sortField, sortDir])

  const totals = useMemo(() => {
    const total = filtered.length
    const paid = filtered.filter((p) => p.sponsor_externally_paid).length
    const unpaid = total - paid
    const totalAmount = filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const paidAmount = filtered
      .filter((p) => p.sponsor_externally_paid)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const unpaidAmount = totalAmount - paidAmount
    return { total, paid, unpaid, totalAmount, paidAmount, unpaidAmount }
  }, [filtered])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir(field === "date" || field === "amount" ? "desc" : "asc")
    }
  }

  async function toggleExternalPaid(payment: SponsorPayment, next: boolean) {
    setTogglingId(payment.id)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const updates: Record<string, any> = {
        sponsor_externally_paid: next,
        sponsor_externally_paid_at: next ? new Date().toISOString() : null,
        sponsor_externally_paid_by: next ? user?.email || user?.id || null : null,
      }

      const { error } = await supabase
        .from("order_payments")
        .update(updates)
        .eq("id", payment.id)

      if (error) throw error

      setPayments((prev) =>
        prev.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                sponsor_externally_paid: next,
                sponsor_externally_paid_at: updates.sponsor_externally_paid_at,
                sponsor_externally_paid_by: updates.sponsor_externally_paid_by,
              }
            : p,
        ),
      )

      toast.success(next ? "Marked as paid externally" : "Marked as unpaid")
    } catch (err: any) {
      console.error("[v0] Toggle error:", err)
      toast.error(err.message || "Failed to update status")
    } finally {
      setTogglingId(null)
    }
  }

  async function saveExternalNotes() {
    if (!notesTarget) return
    setIsSavingNotes(true)
    try {
      const { error } = await supabase
        .from("order_payments")
        .update({ sponsor_external_payment_notes: notesDraft || null })
        .eq("id", notesTarget.id)

      if (error) throw error

      setPayments((prev) =>
        prev.map((p) =>
          p.id === notesTarget.id
            ? { ...p, sponsor_external_payment_notes: notesDraft || null }
            : p,
        ),
      )
      toast.success("Notes saved")
      setNotesTarget(null)
      setNotesDraft("")
    } catch (err: any) {
      console.error("[v0] Save notes error:", err)
      toast.error(err.message || "Failed to save notes")
    } finally {
      setIsSavingNotes(false)
    }
  }

  function buildExportRows() {
    return sorted.map((p) => ({
      "Created At": format(new Date(p.created_at), "yyyy-MM-dd HH:mm"),
      Sponsor: p.sponsor_name || "—",
      Invoice: p.invoice_number || "—",
      "Attendee Name": p.orders?.full_name || "—",
      "Attendee Email": p.orders?.email || "—",
      "Attendee Phone": p.orders?.phone || "—",
      Institution: p.orders?.institution || "—",
      Items: (p.orders?.order_items || [])
        .map((it) => it.event_label || it.item_type)
        .join("; "),
      Amount: Number(p.amount || 0),
      Currency: p.currency,
      "Externally Paid": p.sponsor_externally_paid ? "Yes" : "No",
      "Paid At": p.sponsor_externally_paid_at
        ? format(new Date(p.sponsor_externally_paid_at), "yyyy-MM-dd HH:mm")
        : "",
      "Paid By": p.sponsor_externally_paid_by || "",
      "Internal Notes": p.notes || "",
      "External Payment Notes": p.sponsor_external_payment_notes || "",
    }))
  }

  function exportExcel() {
    try {
      const rows = buildExportRows()
      const ws = XLSX.utils.json_to_sheet(rows)
      const summary = [
        { Metric: "Total Sponsored Payments", Value: totals.total },
        { Metric: "Externally Paid", Value: totals.paid },
        { Metric: "Pending External Payment", Value: totals.unpaid },
        { Metric: "Total Amount (IDR)", Value: Math.round(totals.totalAmount) },
        { Metric: "Paid Amount (IDR)", Value: Math.round(totals.paidAmount) },
        { Metric: "Outstanding (IDR)", Value: Math.round(totals.unpaidAmount) },
        { Metric: "Generated", Value: format(new Date(), "yyyy-MM-dd HH:mm") },
      ]
      const sws = XLSX.utils.json_to_sheet(summary)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Sponsor Payments")
      XLSX.utils.book_append_sheet(wb, sws, "Summary")
      XLSX.writeFile(wb, `sponsor-payments-${format(new Date(), "yyyyMMdd-HHmm")}.xlsx`)
    } catch (err: any) {
      console.error("[v0] Excel export error:", err)
      toast.error(err.message || "Excel export failed")
    }
  }

  function exportCSV() {
    try {
      const rows = buildExportRows()
      if (rows.length === 0) {
        toast.error("Nothing to export")
        return
      }
      const headers = Object.keys(rows[0])
      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const v = (r as any)[h] ?? ""
              const s = String(v).replace(/"/g, '""')
              return /[",\n]/.test(s) ? `"${s}"` : s
            })
            .join(","),
        ),
      ].join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sponsor-payments-${format(new Date(), "yyyyMMdd-HHmm")}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error("[v0] CSV export error:", err)
      toast.error(err.message || "CSV export failed")
    }
  }

  if (!isAdmin || loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen flex items-center justify-center pt-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-muted/20 pt-20 md:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">
                Sponsor Payment Review
              </h1>
              <p className="text-sm text-muted-foreground mt-1 text-pretty">
                Track accepted sponsored payments and mark when sponsors have settled
                externally.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => fetchPayments()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <SummaryCard
              label="Total Sponsored"
              value={String(totals.total)}
              sub={formatCurrency(totals.totalAmount)}
              icon={<Gift className="h-5 w-5" />}
              accent="border-l-purple-500 bg-purple-50"
              iconBg="bg-purple-100 text-purple-700"
            />
            <SummaryCard
              label="Externally Paid"
              value={String(totals.paid)}
              sub={formatCurrency(totals.paidAmount)}
              icon={<CheckCircle2 className="h-5 w-5" />}
              accent="border-l-emerald-500 bg-emerald-50"
              iconBg="bg-emerald-100 text-emerald-700"
            />
            <SummaryCard
              label="Pending"
              value={String(totals.unpaid)}
              sub={formatCurrency(totals.unpaidAmount)}
              icon={<AlertTriangle className="h-5 w-5" />}
              accent="border-l-amber-500 bg-amber-50"
              iconBg="bg-amber-100 text-amber-700"
            />
            <SummaryCard
              label="Net Outstanding"
              value={formatCurrency(totals.unpaidAmount)}
              sub={`of ${formatCurrency(totals.totalAmount)}`}
              icon={<Wallet className="h-5 w-5" />}
              accent="border-l-teal-500 bg-teal-50"
              iconBg="bg-teal-100 text-teal-700"
            />
          </div>

          {/* Filter bar */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative md:col-span-2">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Search sponsor, attendee, invoice, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as StatusFilter)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Externally Paid</SelectItem>
                    <SelectItem value="unpaid">Pending External</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {(search || status !== "all" || fromDate || toDate) && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Showing {sorted.length} of {payments.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch("")
                      setStatus("all")
                      setFromDate("")
                      setToDate("")
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data list */}
          {sorted.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <Gift className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-foreground">No sponsored payments</p>
                <p className="text-sm">
                  Accepted sponsored payments will appear here once verified.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-hidden rounded-md">
                    <Table className="w-full table-fixed">
                      <colgroup>
                        <col className="w-[20%]" />
                        <col className="w-[22%]" />
                        <col className="w-[14%]" />
                        <col className="w-[11%]" />
                        <col className="w-[17%]" />
                        <col className="w-[16%]" />
                      </colgroup>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-3">
                            <SortHeader
                              label="Sponsor"
                              active={sortField === "sponsor"}
                              dir={sortDir}
                              onClick={() => toggleSort("sponsor")}
                            />
                          </TableHead>
                          <TableHead className="px-3">
                            <SortHeader
                              label="Attendee"
                              active={sortField === "attendee"}
                              dir={sortDir}
                              onClick={() => toggleSort("attendee")}
                            />
                          </TableHead>
                          <TableHead className="px-3 text-right">
                            <SortHeader
                              label="Amount"
                              active={sortField === "amount"}
                              dir={sortDir}
                              onClick={() => toggleSort("amount")}
                              align="right"
                            />
                          </TableHead>
                          <TableHead className="px-3">
                            <SortHeader
                              label="Date"
                              active={sortField === "date"}
                              dir={sortDir}
                              onClick={() => toggleSort("date")}
                            />
                          </TableHead>
                          <TableHead className="px-3">
                            <SortHeader
                              label="External Paid"
                              active={sortField === "status"}
                              dir={sortDir}
                              onClick={() => toggleSort("status")}
                            />
                          </TableHead>
                          <TableHead className="px-3 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sorted.map((p) => (
                          <TableRow key={p.id} className="align-top">
                            <TableCell className="px-3 py-3">
                              <div className="font-medium truncate" title={p.sponsor_name || ""}>
                                {p.sponsor_name || "—"}
                              </div>
                              {p.invoice_number && (
                                <div className="text-xs text-muted-foreground truncate font-mono">
                                  {p.invoice_number}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <div
                                className="font-medium truncate"
                                title={p.orders?.full_name}
                              >
                                {p.orders?.full_name}
                              </div>
                              <div
                                className="text-xs text-muted-foreground truncate"
                                title={p.orders?.email}
                              >
                                {p.orders?.email}
                              </div>
                              {p.orders?.institution && (
                                <div
                                  className="text-xs text-muted-foreground truncate"
                                  title={p.orders.institution}
                                >
                                  {p.orders.institution}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-right tabular-nums font-semibold">
                              {formatCurrency(p.amount, p.currency)}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-sm">
                              {format(new Date(p.created_at), "yyyy-MM-dd")}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(p.created_at), "HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={!!p.sponsor_externally_paid}
                                  disabled={togglingId === p.id}
                                  onCheckedChange={(v) => toggleExternalPaid(p, v)}
                                />
                                {p.sponsor_externally_paid ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                                    Paid
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="border-amber-300 text-amber-700 bg-amber-50"
                                  >
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              {p.sponsor_externally_paid_at && (
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                  {format(
                                    new Date(p.sponsor_externally_paid_at),
                                    "yyyy-MM-dd HH:mm",
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDetailTarget(p)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNotesTarget(p)
                                    setNotesDraft(p.sponsor_external_payment_notes || "")
                                  }}
                                >
                                  Notes
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {sorted.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {p.sponsor_name || "—"}
                          </div>
                          {p.invoice_number && (
                            <div className="text-xs text-muted-foreground font-mono truncate">
                              {p.invoice_number}
                            </div>
                          )}
                        </div>
                        {p.sponsor_externally_paid ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shrink-0">
                            Paid
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-amber-700 bg-amber-50 shrink-0"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{p.orders?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{p.orders?.email}</span>
                        </div>
                        {p.orders?.institution && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{p.orders.institution}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{format(new Date(p.created_at), "yyyy-MM-dd HH:mm")}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="text-sm">
                          <div className="text-xs text-muted-foreground">Amount</div>
                          <div className="font-semibold tabular-nums">
                            {formatCurrency(p.amount, p.currency)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">
                            Paid externally
                          </Label>
                          <Switch
                            checked={!!p.sponsor_externally_paid}
                            disabled={togglingId === p.id}
                            onCheckedChange={(v) => toggleExternalPaid(p, v)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => setDetailTarget(p)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setNotesTarget(p)
                            setNotesDraft(p.sponsor_external_payment_notes || "")
                          }}
                        >
                          Notes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Notes dialog */}
      <Dialog
        open={!!notesTarget}
        onOpenChange={(open) => {
          if (!open) {
            setNotesTarget(null)
            setNotesDraft("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>External Payment Notes</DialogTitle>
            <DialogDescription>
              Record reference numbers, transfer dates, or any detail about the
              sponsor&apos;s external settlement.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            placeholder="e.g., Paid via bank transfer ref #12345 on 2026-03-14"
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNotesTarget(null)
                setNotesDraft("")
              }}
              disabled={isSavingNotes}
            >
              Cancel
            </Button>
            <Button onClick={saveExternalNotes} disabled={isSavingNotes}>
              {isSavingNotes ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Notes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <Dialog
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sponsored Payment Details</DialogTitle>
            <DialogDescription>
              Full order and sponsor information for this accepted sponsored payment.
            </DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoBlock label="Sponsor" value={detailTarget.sponsor_name || "—"} />
                <InfoBlock
                  label="Invoice"
                  value={detailTarget.invoice_number || "—"}
                  mono
                />
                <InfoBlock
                  label="Amount"
                  value={formatCurrency(detailTarget.amount, detailTarget.currency)}
                />
                <InfoBlock
                  label="Submitted"
                  value={format(new Date(detailTarget.created_at), "yyyy-MM-dd HH:mm")}
                />
              </div>

              <div className="border-t pt-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Attendee
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoBlock
                    label="Name"
                    icon={<User className="h-3.5 w-3.5" />}
                    value={detailTarget.orders?.full_name || "—"}
                  />
                  <InfoBlock
                    label="Email"
                    icon={<Mail className="h-3.5 w-3.5" />}
                    value={detailTarget.orders?.email || "—"}
                  />
                  <InfoBlock
                    label="Phone"
                    icon={<Phone className="h-3.5 w-3.5" />}
                    value={detailTarget.orders?.phone || "—"}
                  />
                  <InfoBlock
                    label="Institution"
                    icon={<Building2 className="h-3.5 w-3.5" />}
                    value={detailTarget.orders?.institution || "—"}
                  />
                </div>
              </div>

              {detailTarget.orders?.order_items?.length ? (
                <div className="border-t pt-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Items
                  </div>
                  <ul className="space-y-1">
                    {detailTarget.orders.order_items.map((it) => (
                      <li
                        key={it.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate">
                          {it.event_label || it.item_type}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatCurrency(it.unit_price, detailTarget.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="border-t pt-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  External Settlement
                </div>
                <div className="flex items-center gap-3">
                  {detailTarget.sponsor_externally_paid ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <div>
                        <div className="font-medium">Externally Paid</div>
                        {detailTarget.sponsor_externally_paid_at && (
                          <div className="text-xs text-muted-foreground">
                            {format(
                              new Date(detailTarget.sponsor_externally_paid_at),
                              "yyyy-MM-dd HH:mm",
                            )}
                            {detailTarget.sponsor_externally_paid_by
                              ? ` by ${detailTarget.sponsor_externally_paid_by}`
                              : ""}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Circle className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="font-medium">Pending External Payment</div>
                        <div className="text-xs text-muted-foreground">
                          Sponsor has not yet settled this amount externally.
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {detailTarget.sponsor_external_payment_notes && (
                  <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                    {detailTarget.sponsor_external_payment_notes}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  icon,
  accent,
  iconBg,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  accent: string
  iconBg: string
}) {
  return (
    <Card className={`border-l-4 ${accent}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-lg md:text-xl font-bold truncate">{value}</div>
            {sub && (
              <div className="text-xs text-muted-foreground truncate">{sub}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  align?: "left" | "right"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ${
        align === "right" ? "w-full justify-end" : ""
      }`}
    >
      <span>{label}</span>
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${active ? "text-foreground" : "opacity-50"} ${
          active && dir === "asc" ? "rotate-180" : ""
        }`}
      />
    </button>
  )
}

function InfoBlock({
  label,
  value,
  icon,
  mono,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className={`font-medium break-words ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  )
}
