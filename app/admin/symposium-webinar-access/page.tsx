"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Gift,
  Users,
  Video,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Play,
  UserCheck,
  Calendar,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { backfillSymposiumWebinarGrants, revokeWebinarAccess } from "@/app/actions/webinar-access"
import { SYMPOSIUM_BONUS_WEBINAR_IDS, formatBonusValue } from "@/lib/webinar-access"
import { getWebinarById } from "@/lib/data/webinars"
import { formatDistanceToNow, format } from "date-fns"

interface WebinarGrant {
  id: string
  user_id: string
  order_id: string
  webinar_id: string
  granted_at: string
  granted_by: string | null
  grant_type: string
  expires_at: string | null
  status: string
  notes: string | null
  created_at: string
  profiles?: {
    full_name: string | null
  }
  orders?: {
    email: string
    full_name: string
  }
}

interface SymposiumOrder {
  id: string
  user_id: string
  email: string
  full_name: string
  created_at: string
  verified_at: string
  has_grants: boolean
  grant_count: number
}

export default function SymposiumWebinarAccessPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [grants, setGrants] = useState<WebinarGrant[]>([])
  const [symposiumOrders, setSymposiumOrders] = useState<SymposiumOrder[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isBackfilling, setIsBackfilling] = useState(false)
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)
  const [selectedGrant, setSelectedGrant] = useState<WebinarGrant | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
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
    await fetchData()
  }

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()

    // Fetch all grants
    const { data: grantsData, error: grantsError } = await supabase
      .from("symposium_webinar_grants")
      .select(`
        *,
        orders (
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    if (grantsError) {
      console.error("[v0] Error fetching grants:", grantsError)
    } else {
      setGrants(grantsData || [])
    }

    // Fetch verified Symposium orders to show which users have/don't have grants
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        email,
        full_name,
        created_at,
        order_items!inner (
          event_id,
          event_label,
          item_type
        ),
        order_payments!inner (
          payment_status,
          verified_at
        )
      `)
      .eq("order_payments.payment_status", "verified")
      .eq("order_items.item_type", "event")
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("[v0] Error fetching orders:", ordersError)
    } else {
      // Filter for Symposium orders and check if they have grants
      const symposiumOrdersList =
        ordersData
          ?.filter((order: any) =>
            order.order_items.some(
              (item: any) =>
                item.event_label?.toLowerCase().includes("symposium") ||
                item.event_id?.toLowerCase().includes("symposium"),
            ),
          )
          .map((order: any) => {
            const orderGrants = (grantsData || []).filter((g) => g.order_id === order.id)
            return {
              id: order.id,
              user_id: order.user_id,
              email: order.email,
              full_name: order.full_name,
              created_at: order.created_at,
              verified_at: order.order_payments?.[0]?.verified_at,
              has_grants: orderGrants.length > 0,
              grant_count: orderGrants.length,
            }
          }) || []

      setSymposiumOrders(symposiumOrdersList)
    }

    setLoading(false)
  }

  const handleBackfill = async () => {
    setIsBackfilling(true)
    try {
      const result = await backfillSymposiumWebinarGrants()

      if (result.success) {
        toast({
          title: "Backfill Complete",
          description: `Processed ${result.usersProcessed} users, created ${result.grantsCreated} grants.`,
        })
        await fetchData()
      } else {
        toast({
          title: "Backfill Failed",
          description: result.errors.join(", "),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during backfill",
        variant: "destructive",
      })
    } finally {
      setIsBackfilling(false)
    }
  }

  const handleRevoke = async () => {
    if (!selectedGrant) return

    setIsProcessing(true)
    const result = await revokeWebinarAccess(selectedGrant.id)

    if (result.success) {
      toast({
        title: "Access Revoked",
        description: "Webinar access has been revoked",
      })
      await fetchData()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to revoke access",
        variant: "destructive",
      })
    }

    setIsProcessing(false)
    setIsRevokeDialogOpen(false)
    setSelectedGrant(null)
  }

  const filteredGrants = useMemo(() => {
    if (!searchQuery.trim()) return grants
    const query = searchQuery.toLowerCase()
    return grants.filter(
      (g) =>
        g.orders?.email?.toLowerCase().includes(query) ||
        g.orders?.full_name?.toLowerCase().includes(query) ||
        g.webinar_id.toLowerCase().includes(query),
    )
  }, [grants, searchQuery])

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return symposiumOrders
    const query = searchQuery.toLowerCase()
    return symposiumOrders.filter(
      (o) => o.email?.toLowerCase().includes(query) || o.full_name?.toLowerCase().includes(query),
    )
  }, [symposiumOrders, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const totalGrants = grants.filter((g) => g.status === "active").length
    const uniqueUsers = new Set(grants.filter((g) => g.status === "active").map((g) => g.user_id)).size
    const ordersWithoutGrants = symposiumOrders.filter((o) => !o.has_grants).length
    const totalSymposiumOrders = symposiumOrders.length

    return {
      totalGrants,
      uniqueUsers,
      ordersWithoutGrants,
      totalSymposiumOrders,
    }
  }, [grants, symposiumOrders])

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-emerald-50/50 to-background">
        {/* Header */}
        <section className="py-8 px-4 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">Symposium Webinar Access</h1>
                <p className="text-emerald-100">Manage bonus webinar grants for Symposium buyers</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/10 rounded-lg">
              <p className="text-sm text-emerald-100">
                Symposium buyers receive <strong>4 bonus webinars</strong> (value: {formatBonusValue()})
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-6 px-4 -mt-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalGrants}</p>
                      <p className="text-xs text-muted-foreground">Active Grants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                      <p className="text-xs text-muted-foreground">Users with Access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalSymposiumOrders}</p>
                      <p className="text-xs text-muted-foreground">Symposium Buyers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className={stats.ordersWithoutGrants > 0 ? "border-amber-200 bg-amber-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.ordersWithoutGrants > 0 ? "bg-amber-100" : "bg-green-100"}`}
                    >
                      {stats.ordersWithoutGrants > 0 ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.ordersWithoutGrants}</p>
                      <p className="text-xs text-muted-foreground">Need Backfill</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or webinar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                {stats.ordersWithoutGrants > 0 && (
                  <Button
                    onClick={handleBackfill}
                    disabled={isBackfilling}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isBackfilling ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Backfill {stats.ordersWithoutGrants} Users
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-4 px-4">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Symposium Orders without Grants */}
            {filteredOrders.filter((o) => !o.has_grants).length > 0 && (
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    Symposium Buyers Without Grants
                  </CardTitle>
                  <CardDescription>
                    These users have verified Symposium purchases but haven&apos;t received their bonus webinars yet.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredOrders
                      .filter((o) => !o.has_grants)
                      .map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                        >
                          <div>
                            <p className="font-medium">{order.full_name}</p>
                            <p className="text-sm text-muted-foreground">{order.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-amber-700 border-amber-300">
                              No Grants
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Verified: {format(new Date(order.verified_at), "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Grants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  Active Webinar Grants
                </CardTitle>
                <CardDescription>All symposium bonus webinar access grants</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                ) : filteredGrants.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No grants found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGrants.map((grant) => {
                      const webinar = getWebinarById(grant.webinar_id)
                      return (
                        <div
                          key={grant.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border ${
                            grant.status === "active"
                              ? "bg-card"
                              : grant.status === "revoked"
                                ? "bg-red-50 border-red-200"
                                : "bg-gray-50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{grant.orders?.full_name || "Unknown"}</p>
                              <Badge
                                variant={
                                  grant.status === "active"
                                    ? "default"
                                    : grant.status === "revoked"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="shrink-0"
                              >
                                {grant.status}
                              </Badge>
                              <Badge variant="outline" className="shrink-0">
                                {grant.grant_type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{grant.orders?.email}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                {webinar?.shortTitle || grant.webinar_id}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDistanceToNow(new Date(grant.granted_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          {grant.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                              onClick={() => {
                                setSelectedGrant(grant)
                                setIsRevokeDialogOpen(true)
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bonus Webinars Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-600" />
                  Included Bonus Webinars
                </CardTitle>
                <CardDescription>
                  These webinars are automatically granted to Symposium buyers (total value: {formatBonusValue()})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SYMPOSIUM_BONUS_WEBINAR_IDS.map((webinarId) => {
                    const webinar = getWebinarById(webinarId)
                    return (
                      <div key={webinarId} className="p-4 border rounded-lg bg-indigo-50/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Video className="w-4 h-4 text-indigo-600" />
                          <span className="font-medium">{webinar?.shortTitle || webinarId}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {webinar?.description || "Coming soon"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {webinar?.status === "active" ? "Active" : webinar?.status || "Coming Soon"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Value: Rp {(webinar?.price || 100000).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />

      {/* Revoke Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Webinar Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this webinar access? The user will no longer be able to access this
              webinar.
            </DialogDescription>
          </DialogHeader>
          {selectedGrant && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="font-medium">{selectedGrant.orders?.full_name}</p>
              <p className="text-sm text-muted-foreground">{selectedGrant.orders?.email}</p>
              <p className="text-sm mt-2">
                Webinar: {getWebinarById(selectedGrant.webinar_id)?.shortTitle || selectedGrant.webinar_id}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Revoke Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
