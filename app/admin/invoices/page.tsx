"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/cart/utils"
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import {
  Download,
  FileText,
  Search,
  Calendar,
  RefreshCw,
  Building,
  Mail,
  User,
  Receipt,
  Gift,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface InvoiceRecord {
  id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  payment_method: string
  payment_status: string
  invoice_number: string | null
  sponsor_name: string | null
  created_at: string
  verified_at: string | null
  orders: {
    id: string
    full_name: string
    email: string
    phone: string
    institution: string | null
    total_amount: number
    currency: string
    order_items: Array<{
      event_label: string
      item_type: string
    }>
  }
}

export default function AdminInvoicesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("verified")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Check admin access and fetch data
  useEffect(() => {
    async function checkAdminAndFetchData() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (profile?.role !== "admin") {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
      await fetchInvoices()
    }

    checkAdminAndFetchData()
  }, [router])

  async function fetchInvoices() {
    setRefreshing(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("order_payments")
      .select(
        `
        id,
        order_id,
        user_id,
        amount,
        currency,
        payment_method,
        payment_status,
        invoice_number,
        sponsor_name,
        created_at,
        verified_at,
        orders!order_payments_order_id_fkey (
          id,
          full_name,
          email,
          phone,
          institution,
          total_amount,
          currency,
          order_items (
            event_label,
            item_type
          )
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching invoices:", error)
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      })
    } else {
      setInvoices((data as unknown as InvoiceRecord[]) || [])
    }

    setLoading(false)
    setRefreshing(false)
  }

  // Filter invoices based on search and filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          invoice.orders?.full_name?.toLowerCase().includes(query) ||
          invoice.orders?.email?.toLowerCase().includes(query) ||
          invoice.orders?.phone?.toLowerCase().includes(query) ||
          invoice.orders?.institution?.toLowerCase().includes(query) ||
          invoice.invoice_number?.toLowerCase().includes(query) ||
          invoice.sponsor_name?.toLowerCase().includes(query) ||
          invoice.order_id?.toLowerCase().includes(query)

        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== "all" && invoice.payment_status !== statusFilter) {
        return false
      }

      // Payment type filter
      if (paymentTypeFilter !== "all") {
        const isSponsored = invoice.payment_method?.toLowerCase() === "sponsored"
        if (paymentTypeFilter === "sponsored" && !isSponsored) return false
        if (paymentTypeFilter === "regular" && isSponsored) return false
      }

      // Date filter
      if (dateFilter !== "all") {
        const createdDate = new Date(invoice.created_at)
        const now = new Date()

        if (dateFilter === "today") {
          if (
            !isWithinInterval(createdDate, {
              start: startOfDay(now),
              end: endOfDay(now),
            })
          )
            return false
        } else if (dateFilter === "7days") {
          if (
            !isWithinInterval(createdDate, {
              start: startOfDay(subDays(now, 7)),
              end: endOfDay(now),
            })
          )
            return false
        } else if (dateFilter === "30days") {
          if (
            !isWithinInterval(createdDate, {
              start: startOfDay(subDays(now, 30)),
              end: endOfDay(now),
            })
          )
            return false
        }
      }

      return true
    })
  }, [invoices, searchQuery, statusFilter, paymentTypeFilter, dateFilter])

  // Summary statistics
  const stats = useMemo(() => {
    const verified = invoices.filter((i) => i.payment_status === "verified")
    const pending = invoices.filter((i) => i.payment_status === "pending")
    const rejected = invoices.filter((i) => i.payment_status === "rejected")
    const sponsored = invoices.filter(
      (i) => i.payment_method?.toLowerCase() === "sponsored" && i.payment_status === "verified",
    )

    const totalVerifiedAmount = verified.reduce((sum, i) => sum + (i.amount || 0), 0)

    return {
      total: invoices.length,
      verified: verified.length,
      pending: pending.length,
      rejected: rejected.length,
      sponsored: sponsored.length,
      totalAmount: totalVerifiedAmount,
    }
  }, [invoices])

  async function handleDownload(invoice: InvoiceRecord) {
    if (!invoice.invoice_number) {
      toast({
        title: "Invoice Not Available",
        description: "This payment does not have an invoice number yet.",
        variant: "destructive",
      })
      return
    }

    setDownloadingId(invoice.id)

    try {
      const response = await fetch(`/api/invoice/generate?orderId=${invoice.order_id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate invoice")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      const isSponsored = invoice.payment_method?.toLowerCase() === "sponsored"
      const prefix = isSponsored ? "Registration-Certificate" : "Invoice"
      a.download = `${prefix}-ISAPM-2026-${invoice.invoice_number}.pdf`

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: `${prefix} ${invoice.invoice_number} is being downloaded.`,
      })
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download invoice",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleBulkDownload() {
    const verifiedInvoices = filteredInvoices.filter((i) => i.payment_status === "verified" && i.invoice_number)

    if (verifiedInvoices.length === 0) {
      toast({
        title: "No Invoices",
        description: "No verified invoices available for download.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Bulk Download Started",
      description: `Downloading ${verifiedInvoices.length} invoices. This may take a moment.`,
    })

    for (const invoice of verifiedInvoices) {
      await handleDownload(invoice)
      // Add a small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 font-mono">Invoice Management</h1>
              <p className="text-slate-600 mt-1">Download and manage payment invoices</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchInvoices} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={handleBulkDownload}
                className="bg-teal-600 hover:bg-teal-700"
                disabled={
                  filteredInvoices.filter((i) => i.payment_status === "verified" && i.invoice_number).length === 0
                }
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.verified}</p>
                    <p className="text-xs text-slate-500">Verified Invoices</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.pending}</p>
                    <p className="text-xs text-slate-500">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.sponsored}</p>
                    <p className="text-xs text-slate-500">Sponsored</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100">
                    <Receipt className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(stats.totalAmount, "IDR")}</p>
                    <p className="text-xs text-slate-500">Total Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, invoice number, sponsor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {/* Payment Type Filter */}
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="regular">Bank Transfer</SelectItem>
                    <SelectItem value="sponsored">Sponsored</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mb-4 text-sm text-slate-600">
            Showing {filteredInvoices.length} of {invoices.length} records
          </div>

          {/* Invoice Table */}
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No invoices found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Invoice #</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => {
                        const isSponsored = invoice.payment_method?.toLowerCase() === "sponsored"
                        return (
                          <TableRow key={invoice.id} className="hover:bg-slate-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <span className="font-mono text-sm">{invoice.invoice_number || "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span className="font-medium text-slate-800">
                                    {invoice.orders?.full_name || "Unknown"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Mail className="w-3 h-3" />
                                  {invoice.orders?.email}
                                </div>
                                {invoice.orders?.institution && (
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Building className="w-3 h-3" />
                                    {invoice.orders.institution}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isSponsored ? (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                  <Gift className="w-3 h-3 mr-1" />
                                  Sponsored
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Bank Transfer
                                </Badge>
                              )}
                              {isSponsored && invoice.sponsor_name && (
                                <p className="text-xs text-slate-500 mt-1">by {invoice.sponsor_name}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-slate-800">
                                {formatCurrency(invoice.amount, invoice.currency)}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(invoice.created_at), "dd MMM yyyy")}
                                </div>
                                {invoice.verified_at && (
                                  <div className="text-xs text-slate-500">
                                    Verified: {format(new Date(invoice.verified_at), "dd MMM yyyy")}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={
                                  invoice.payment_status === "verified" && invoice.invoice_number
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() => handleDownload(invoice)}
                                disabled={
                                  downloadingId === invoice.id ||
                                  invoice.payment_status !== "verified" ||
                                  !invoice.invoice_number
                                }
                                className={
                                  invoice.payment_status === "verified" && invoice.invoice_number
                                    ? "bg-teal-600 hover:bg-teal-700"
                                    : ""
                                }
                              >
                                {downloadingId === invoice.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                                <span className="ml-2 hidden sm:inline">Download</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
