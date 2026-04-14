"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import * as XLSX from "xlsx"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Download,
  User,
  Mail,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  Eye,
  RefreshCw,
  Filter,
  Loader2,
  ScanLine,
} from "lucide-react"

interface ParticipantCard {
  id: string
  card_number: string
  secure_token: string
  user_id: string
  order_id: string
  full_name: string
  email: string
  phone: string | null
  institution: string | null
  position: string | null
  events: Array<{
    event_id: string
    event_label: string
    participant_type: string
    participant_type_label: string
  }>
  status: string
  issued_at: string
  checked_in_at: string | null
  checked_in_by: string | null
}

export default function AdminParticipantCardsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<ParticipantCard[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [selectedCard, setSelectedCard] = useState<ParticipantCard | null>(null)
  const [exporting, setExporting] = useState(false)

  // Check admin access
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "admin") {
        router.push("/")
        return
      }

      setIsAdmin(true)
      fetchCards()
    }

    checkAuth()
  }, [router])

  const fetchCards = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("participant_cards")
        .select("*")
        .order("issued_at", { ascending: false })

      if (error) throw error
      setCards(data || [])
    } catch (err: any) {
      console.error("Error fetching cards:", err)
      toast({
        title: "Error",
        description: "Failed to load participant cards",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get unique events for filter
  const uniqueEvents = useMemo(() => {
    const events = new Map<string, string>()
    cards.forEach((card) => {
      card.events.forEach((event) => {
        events.set(event.event_id, event.event_label)
      })
    })
    return Array.from(events.entries())
  }, [cards])

  // Filter cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        card.full_name.toLowerCase().includes(searchLower) ||
        card.email.toLowerCase().includes(searchLower) ||
        card.card_number.toLowerCase().includes(searchLower) ||
        (card.institution && card.institution.toLowerCase().includes(searchLower))

      // Status filter
      const matchesStatus = statusFilter === "all" || card.status === statusFilter

      // Event filter
      const matchesEvent =
        eventFilter === "all" ||
        card.events.some((e) => e.event_id === eventFilter)

      return matchesSearch && matchesStatus && matchesEvent
    })
  }, [cards, searchQuery, statusFilter, eventFilter])

  // Stats
  const stats = useMemo(() => {
    const total = cards.length
    const active = cards.filter((c) => c.status === "active").length
    const checkedIn = cards.filter((c) => c.status === "checked_in").length
    const revoked = cards.filter((c) => c.status === "revoked").length
    return { total, active, checkedIn, revoked }
  }, [cards])

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportData = filteredCards.map((card) => ({
        "Card Number": card.card_number,
        "Full Name": card.full_name,
        Email: card.email,
        Phone: card.phone || "",
        Institution: card.institution || "",
        Position: card.position || "",
        Events: card.events.map((e) => e.event_label).join(", "),
        "Participant Types": card.events.map((e) => e.participant_type_label).join(", "),
        Status: card.status,
        "Issued At": card.issued_at ? format(new Date(card.issued_at), "yyyy-MM-dd HH:mm") : "",
        "Checked In At": card.checked_in_at ? format(new Date(card.checked_in_at), "yyyy-MM-dd HH:mm") : "",
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Participant Cards")
      XLSX.writeFile(wb, `participant-cards-${format(new Date(), "yyyy-MM-dd")}.xlsx`)

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} participant cards`,
      })
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>
      case "checked_in":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Checked In</Badge>
      case "revoked":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Revoked</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Participant Cards</h1>
              <p className="text-sm text-gray-500">Manage all issued participant cards</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/admin/check-in")}>
                <ScanLine className="w-4 h-4 mr-2" />
                Scanner
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin")}>
                Back to Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total Cards</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  <p className="text-sm text-gray-500">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.checkedIn}</p>
                  <p className="text-sm text-gray-500">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.revoked}</p>
                  <p className="text-sm text-gray-500">Revoked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, card number, or institution..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {uniqueEvents.map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchCards}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card Number</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Checked In</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        {cards.length === 0 ? "No participant cards issued yet" : "No cards match your filters"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCards.map((card) => (
                      <TableRow key={card.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">{card.card_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{card.full_name}</p>
                            <p className="text-sm text-gray-500">{card.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {card.institution || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {card.events.slice(0, 2).map((event, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {event.event_id.toUpperCase()}
                              </Badge>
                            ))}
                            {card.events.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{card.events.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(card.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(card.issued_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {card.checked_in_at
                            ? format(new Date(card.checked_in_at), "MMM d, h:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCard(card)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Info */}
            <div className="px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {filteredCards.length} of {cards.length} cards
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Card Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Participant Card Details</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-6">
              {/* Participant Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{selectedCard.full_name}</h3>
                  <p className="text-gray-600">{selectedCard.position}</p>
                  {getStatusBadge(selectedCard.status)}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <QrCode className="w-4 h-4" />
                  <span className="font-mono">{selectedCard.card_number}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{selectedCard.email}</span>
                </div>
                {selectedCard.institution && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="w-4 h-4" />
                    <span>{selectedCard.institution}</span>
                  </div>
                )}
              </div>

              {/* Events */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Registered Events
                </h4>
                <div className="space-y-2">
                  {selectedCard.events.map((event, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                      <span className="font-medium text-gray-900">{event.event_label}</span>
                      <Badge variant="secondary">{event.participant_type_label}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Issued:</span>
                  <span className="text-gray-900">
                    {format(new Date(selectedCard.issued_at), "MMMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                {selectedCard.checked_in_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Checked In:</span>
                    <span className="text-green-600 font-medium">
                      {format(new Date(selectedCard.checked_in_at), "MMMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
