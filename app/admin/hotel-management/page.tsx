"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Hotel,
  RefreshCw,
  Users,
  CheckCircle,
  Clock,
  DollarSign,
  Search,
  Eye,
  XCircle,
  BedDouble,
  Crown,
  Loader2,
  BarChart3,
  BookOpen,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getHotelBookings, getHotelStats, updateRoomSettings, getRoomSettings, cancelBooking } from "@/app/actions/hotel-management"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

export default function HotelManagementPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState(null)
  const [roomSettings, setRoomSettings] = useState({
    deluxe_rooms: 50,
    premier_rooms: 20,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [roomTypeFilter, setRoomTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Dialogs
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [bookingsRes, statsRes, settingsRes] = await Promise.all([
        getHotelBookings({
          searchQuery,
          roomType: roomTypeFilter,
          status: statusFilter,
        }),
        getHotelStats(),
        getRoomSettings(),
      ])

      console.log("[v0] Loaded bookings:", bookingsRes.bookings.length)
      console.log("[v0] Loaded stats:", statsRes.stats)
      console.log("[v0] Loaded settings:", settingsRes.settings)

      setBookings(bookingsRes.bookings)
      setStats(statsRes.stats)
      if (settingsRes.settings) {
        console.log("[v0] Setting room settings to:", settingsRes.settings)
        setRoomSettings(settingsRes.settings)
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, roomTypeFilter, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      console.log("[v0] Saving room settings:", roomSettings)
      const result = await updateRoomSettings(roomSettings)
      console.log("[v0] Save result:", result)
      if (result.success) {
        console.log("[v0] Settings saved successfully, reloading data")
        toast.success("Settings saved successfully!", {
          description: `Deluxe: ${roomSettings.deluxe_rooms} rooms, Premier: ${roomSettings.premier_rooms} rooms`,
        })
        await loadData()
      } else {
        console.error("[v0] Failed to save settings:", result.error)
        toast.error("Failed to save settings", {
          description: result.error || "Unknown error occurred",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      toast.error("Error saving settings", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    setSaving(true)
    try {
      const result = await cancelBooking(selectedBooking.order_id)
      if (result.success) {
        setShowCancelDialog(false)
        setSelectedBooking(null)
        await loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoomTypeBadge = (roomType) => {
    if (roomType === "premier") {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
          <Crown className="w-3 h-3 mr-1" />
          Premier
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
        <BedDouble className="w-3 h-3 mr-1" />
        Deluxe
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Hotel className="w-7 h-7 text-teal-600" />
              Hotel Management
            </h1>
            <p className="text-gray-500 mt-1">Manage room inventory, bookings, and availability</p>
          </div>
          <Button onClick={loadData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.totalBookings || 0}</p>
                          <p className="text-sm text-gray-500">Total Bookings</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.confirmedBookings || 0}</p>
                          <p className="text-sm text-gray-500">Confirmed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats?.pendingBookings || 0}</p>
                          <p className="text-sm text-gray-500">Pending</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <DollarSign className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-lg font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                          <p className="text-sm text-gray-500">Revenue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Occupancy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BedDouble className="w-5 h-5 text-blue-600" />
                        Deluxe Room Occupancy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Booked</span>
                          <span className="font-semibold">
                            {stats?.occupancyRate.deluxe.booked || 0} / {stats?.occupancyRate.deluxe.total || 50}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${stats?.occupancyRate.deluxe.percentage || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Available:{" "}
                            {(stats?.occupancyRate.deluxe.total || 50) - (stats?.occupancyRate.deluxe.booked || 0)}
                          </span>
                          <span className="font-medium text-blue-600">
                            {stats?.occupancyRate.deluxe.percentage || 0}% Occupied
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Crown className="w-5 h-5 text-purple-600" />
                        Premier Room Occupancy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Booked</span>
                          <span className="font-semibold">
                            {stats?.occupancyRate.premier.booked || 0} / {stats?.occupancyRate.premier.total || 20}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-purple-600 h-3 rounded-full transition-all"
                            style={{ width: `${stats?.occupancyRate.premier.percentage || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Available:{" "}
                            {(stats?.occupancyRate.premier.total || 20) - (stats?.occupancyRate.premier.booked || 0)}
                          </span>
                          <span className="font-medium text-purple-600">
                            {stats?.occupancyRate.premier.percentage || 0}% Occupied
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookings.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No bookings found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Guest</TableHead>
                              <TableHead>Room</TableHead>
                              <TableHead>Check-in</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.slice(0, 5).map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{booking.guest_name}</p>
                                    <p className="text-sm text-gray-500">{booking.guest_email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{getRoomTypeBadge(booking.room_type)}</TableCell>
                                <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg">All Bookings</CardTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search guest..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                    <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Room Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        <SelectItem value="deluxe">Deluxe</SelectItem>
                        <SelectItem value="premier">Premier</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Hotel className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Guest</TableHead>
                          <TableHead>Room Type</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Check-out</TableHead>
                          <TableHead>Nights</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{booking.guest_name}</p>
                                <p className="text-sm text-gray-500">{booking.guest_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getRoomTypeBadge(booking.room_type)}</TableCell>
                            <TableCell>{formatDate(booking.check_in_date)}</TableCell>
                            <TableCell>{formatDate(booking.check_out_date)}</TableCell>
                            <TableCell>{booking.nights}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(booking.total_price)}</TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking)
                                    setShowDetailsDialog(true)
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {booking.status !== "cancelled" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedBooking(booking)
                                      setShowCancelDialog(true)
                                    }}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-blue-600" />
                    Deluxe Room Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="deluxe-rooms">Total Rooms Available</Label>
                    <Input
                      id="deluxe-rooms"
                      type="number"
                      min={0}
                      value={roomSettings.deluxe_rooms}
                      onChange={(e) =>
                        setRoomSettings((prev) => ({
                          ...prev,
                          deluxe_rooms: Number.parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500">
                      Currently booked: {stats?.occupancyRate.deluxe.booked || 0} rooms
                    </p>
                    <p className="text-sm text-gray-500">
                      Remaining: {roomSettings.deluxe_rooms - (stats?.occupancyRate.deluxe.booked || 0)} rooms
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    Premier Room Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="premier-rooms">Total Rooms Available</Label>
                    <Input
                      id="premier-rooms"
                      type="number"
                      min={0}
                      value={roomSettings.premier_rooms}
                      onChange={(e) =>
                        setRoomSettings((prev) => ({
                          ...prev,
                          premier_rooms: Number.parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500">
                      Currently booked: {stats?.occupancyRate.premier.booked || 0} rooms
                    </p>
                    <p className="text-sm text-gray-500">
                      Remaining: {roomSettings.premier_rooms - (stats?.occupancyRate.premier.booked || 0)} rooms
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-2">
                <Button onClick={handleSaveSettings} disabled={saving} className="w-full sm:w-auto">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Guest Name</p>
                    <p className="font-medium">{selectedBooking.guest_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-sm">{selectedBooking.guest_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Room Type</p>
                    <div className="mt-1">{getRoomTypeBadge(selectedBooking.room_type)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{formatDate(selectedBooking.check_in_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{formatDate(selectedBooking.check_out_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nights</p>
                    <p className="font-medium">{selectedBooking.nights}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="font-medium">{selectedBooking.quantity} room(s)</p>
                  </div>
                  {selectedBooking.extra_beds > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Extra Beds</p>
                      <p className="font-medium">{selectedBooking.extra_beds}</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Price</span>
                    <span className="text-xl font-bold text-teal-600">
                      {formatCurrency(selectedBooking.total_price)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Order ID: {selectedBooking.order_id.slice(0, 8)}...</p>
                  <p>Booked on: {formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Booking Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="py-4">
                <p>
                  <strong>Guest:</strong> {selectedBooking.guest_name}
                </p>
                <p>
                  <strong>Room:</strong> {selectedBooking.room_type}
                </p>
                <p>
                  <strong>Dates:</strong> {formatDate(selectedBooking.check_in_date)} -{" "}
                  {formatDate(selectedBooking.check_out_date)}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Booking
              </Button>
              <Button variant="destructive" onClick={handleCancelBooking} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cancel Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  )
}
