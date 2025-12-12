"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Hotel, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function MyOrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    checkAuthAndLoadOrders()
  }, [])

  const checkAuthAndLoadOrders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items!inner (*)
        `)
        .eq("user_id", user.id)
        .eq("order_items.item_type", "hotel")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading orders:", error.message)
        throw error
      }

      setOrders(ordersData || [])
    } catch (error: any) {
      console.error("[v0] Error loading orders:", error.message)
      toast.error("Failed to load bookings")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      not_submitted: { label: "Not Submitted", variant: "secondary", icon: Clock },
      pending: { label: "Pending Review", variant: "default", icon: Clock },
      verified: { label: "Verified", variant: "default", icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
    }

    const config = statusConfig[status] || statusConfig.not_submitted
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit max-w-full whitespace-nowrap shrink-0">
        <Icon className="w-3 h-3 shrink-0" />
        <span className="text-xs sm:text-sm">{config.label}</span>
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen">
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="font-display text-4xl font-bold mb-2">My Hotel Bookings</h1>
              <p className="text-muted-foreground">View and manage your hotel reservations</p>
            </div>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Hotel className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-6">Start by booking a room for the conference</p>
                  <Link href="/hotel-booking">
                    <Button>Book a Room</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const item = order.order_items[0]
                  const totalAmount = order.order_items.reduce((sum: number, item: any) => {
                    const nights = item.nights || 1
                    return sum + (item.unit_price || 0) * nights
                  }, 0)
                  return (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <Hotel className="w-5 h-5 shrink-0" />
                              <span className="truncate">{item?.metadata?.hotel_name || "Hotel Booking"}</span>
                            </CardTitle>
                            <CardDescription>
                              Booked on {new Date(order.created_at).toLocaleDateString("id-ID")}
                            </CardDescription>
                          </div>
                          <div className="shrink-0">{getStatusBadge(order.status)}</div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 mb-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Room Type:</span>
                              <span className="font-medium">{item?.item_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Guest:</span>
                              <span className="font-medium">{item?.metadata?.guest_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Check-in:</span>
                              <span className="font-medium">
                                {item?.metadata?.check_in &&
                                  new Date(item.metadata.check_in).toLocaleDateString("id-ID")}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Nights:</span>
                              <span className="font-medium">{item?.metadata?.nights}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Check-out:</span>
                              <span className="font-medium">
                                {item?.metadata?.check_out &&
                                  new Date(item.metadata.check_out).toLocaleDateString("id-ID")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total:</span>
                              <span className="font-bold text-primary">Rp {totalAmount.toLocaleString("id-ID")}</span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/payment/order/${order.id}`}>
                          <Button className="w-full">View Details</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
