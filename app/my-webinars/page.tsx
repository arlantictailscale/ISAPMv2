import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Gift, Video, Calendar, Clock, Users, CheckCircle, Play } from "lucide-react"
import { getWebinarById, formatWebinarDate } from "@/lib/data/webinars"
import { WebinarContentDisplay } from "@/components/webinar-content-display"

interface WebinarGrant {
  id: string
  user_id: string
  order_id: string
  webinar_id: string
  granted_at: string
  grant_type: string
  status: string
}

interface WebinarOrder {
  id: string
  user_id: string
  email: string
  full_name: string
  order_items: {
    id: string
    event_id: string
    event_label: string
    item_type: string
  }[]
  order_payments: {
    payment_status: string
    verified_at: string
  }[]
}

function BonusWebinarCard({ grant }: { grant: WebinarGrant }) {
  const webinarData = getWebinarById(grant.webinar_id)

  const webinarDetails = webinarData
    ? {
        title: webinarData.shortTitle,
        subtitle: webinarData.title,
        date: formatWebinarDate(webinarData.date),
        time: `${webinarData.time} ${webinarData.timezone}`,
        speakers: webinarData.speakers,
        benefits: webinarData.benefits.map((b) => b.description),
        slug: webinarData.slug,
        status: webinarData.status,
      }
    : {
        title: grant.webinar_id.replace(/_/g, " ").replace(/webinar/i, "Webinar"),
        subtitle: "",
        date: "Coming Soon",
        time: "TBD",
        speakers: [],
        benefits: [],
        slug: "",
        status: "coming_soon" as const,
      }

  return (
    <Card className="overflow-hidden border-emerald-200 shadow-lg">
      {/* Webinar Header with Bonus Badge */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Badge className="bg-amber-400/90 text-amber-900 border-amber-500 mb-3">
              <Gift className="w-3 h-3 mr-1" />
              Symposium Bonus
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-balance">{webinarDetails.title}</h2>
            {webinarDetails.subtitle && (
              <p className="text-emerald-100 text-sm sm:text-base line-clamp-2">{webinarDetails.subtitle}</p>
            )}
          </div>
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Video className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Date and Time */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-semibold text-sm">{webinarDetails.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-semibold text-sm">{webinarDetails.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
            <Gift className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">Access Type</p>
              <p className="font-semibold text-sm text-amber-700">Symposium Bonus</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold text-sm text-green-700">Access Granted</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-600" />
            Webinar Access & Materials
          </h3>
          <WebinarContentDisplay webinarId={grant.webinar_id} />
        </div>

        {/* Speakers */}
        {webinarDetails.speakers.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Session Speakers
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {webinarDetails.speakers.map((speaker, index) => (
                <div key={index} className="p-4 border rounded-xl bg-card hover:shadow-md transition-shadow">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {speaker.organization}
                  </Badge>
                  <p className="font-semibold text-sm mb-1">{speaker.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{speaker.topic}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What You'll Get */}
        {webinarDetails.benefits.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              What You&apos;ll Receive
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {webinarDetails.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grant Info */}
        <div className="border-t pt-4 mt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>Grant Type: {grant.grant_type.replace(/_/g, " ")}</span>
            <span>
              Granted:{" "}
              {new Date(grant.granted_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PurchasedWebinarCard({ order }: { order: WebinarOrder }) {
  const webinarItem = order.order_items.find((item) => item.item_type === "webinar")
  const payment = order.order_payments?.[0]
  const webinarData = webinarItem ? getWebinarById(webinarItem.event_id) : null

  const webinarDetails = webinarData
    ? {
        id: webinarData.id,
        title: webinarData.shortTitle,
        subtitle: webinarData.title,
        date: formatWebinarDate(webinarData.date),
        time: `${webinarData.time} ${webinarData.timezone}`,
        speakers: webinarData.speakers,
        benefits: webinarData.benefits.map((b) => b.description),
        slug: webinarData.slug,
      }
    : {
        id: webinarItem?.event_id || "",
        title: webinarItem?.event_label || "Webinar",
        subtitle: "",
        date: "TBD",
        time: "TBD",
        speakers: [],
        benefits: [],
        slug: "",
      }

  return (
    <Card className="overflow-hidden border-indigo-200 shadow-lg">
      {/* Webinar Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Badge className="bg-white/20 text-white border-white/30 mb-3">
              <CheckCircle className="w-3 h-3 mr-1" />
              Access Confirmed
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-balance">{webinarDetails.title}</h2>
            {webinarDetails.subtitle && (
              <p className="text-indigo-100 text-sm sm:text-base line-clamp-2">{webinarDetails.subtitle}</p>
            )}
          </div>
          <div className="shrink-0">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
              <Video className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Date and Time */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-semibold text-sm">{webinarDetails.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-semibold text-sm">{webinarDetails.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold text-sm text-green-700">Registered</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Speakers</p>
              <p className="font-semibold text-sm">{webinarDetails.speakers.length} Experts</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-600" />
            Webinar Access & Materials
          </h3>
          <WebinarContentDisplay webinarId={webinarDetails.id} />
          <p className="text-xs text-muted-foreground mt-3">
            The webinar link will be sent to your email ({order.email}) before the event.
          </p>
        </div>

        {/* Speakers */}
        {webinarDetails.speakers.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Session Speakers
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {webinarDetails.speakers.map((speaker, index) => (
                <div key={index} className="p-4 border rounded-xl bg-card hover:shadow-md transition-shadow">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {speaker.organization}
                  </Badge>
                  <p className="font-semibold text-sm mb-1">{speaker.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{speaker.topic}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What You'll Get */}
        {webinarDetails.benefits.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              What You&apos;ll Receive
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {webinarDetails.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="border-t pt-4 mt-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>Order ID: {order.id.slice(0, 8)}</span>
            <span>Registered: {order.full_name}</span>
            <span>
              Approved:{" "}
              {payment?.verified_at
                ? new Date(payment.verified_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function MyWebinarsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch webinar orders with verified payments
  const { data: webinarOrders } = await supabase
    .from("orders")
    .select(`
      id,
      user_id,
      email,
      full_name,
      order_items!inner(id, event_id, event_label, item_type),
      order_payments!inner(payment_status, verified_at)
    `)
    .eq("user_id", user.id)
    .eq("order_items.item_type", "webinar")
    .eq("order_payments.payment_status", "verified")
    .order("created_at", { ascending: false })

  // Fetch symposium bonus grants
  const { data: bonusGrants } = await supabase
    .from("symposium_webinar_grants")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const approvedWebinars = (webinarOrders || []) as WebinarOrder[]
  const uniqueBonusGrants = (bonusGrants || []).filter(
    (grant, index, self) => index === self.findIndex((g) => g.webinar_id === grant.webinar_id),
  ) as WebinarGrant[]

  const hasAnyWebinars = approvedWebinars.length > 0 || uniqueBonusGrants.length > 0

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-indigo-50/50 to-background">
        {/* Header Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">My Webinars</h1>
                <p className="text-indigo-100">Access your purchased and bonus webinars</p>
              </div>
            </div>
            {hasAnyWebinars && (
              <div className="flex flex-wrap gap-4 mt-6">
                {approvedWebinars.length > 0 && (
                  <div className="bg-white/10 rounded-lg px-4 py-2">
                    <span className="text-indigo-200 text-sm">Purchased:</span>
                    <span className="font-bold ml-2">{approvedWebinars.length}</span>
                  </div>
                )}
                {uniqueBonusGrants.length > 0 && (
                  <div className="bg-amber-400/20 rounded-lg px-4 py-2">
                    <Gift className="w-4 h-4 inline mr-1" />
                    <span className="text-amber-200 text-sm">Symposium Bonus:</span>
                    <span className="font-bold ml-2">{uniqueBonusGrants.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {!hasAnyWebinars ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                    <Video className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">No Webinars Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven&apos;t purchased any webinars yet, or your payment is still being processed.
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/webinar">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Video className="w-4 h-4 mr-2" />
                        Browse Webinars
                      </Button>
                    </Link>
                    <Link href="/my-purchases">
                      <Button variant="outline">Check Payment Status</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Symposium Bonus Webinars */}
                {uniqueBonusGrants.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-500" />
                      <h2 className="text-lg font-semibold">Symposium Bonus Webinars</h2>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        {uniqueBonusGrants.length} included
                      </Badge>
                    </div>
                    {uniqueBonusGrants.map((grant) => (
                      <BonusWebinarCard key={grant.id} grant={grant} />
                    ))}
                  </div>
                )}

                {/* Purchased Webinars */}
                {approvedWebinars.length > 0 && (
                  <div className="space-y-6">
                    {uniqueBonusGrants.length > 0 && (
                      <div className="flex items-center gap-2 pt-4">
                        <Video className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold">Purchased Webinars</h2>
                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                          {approvedWebinars.length} purchased
                        </Badge>
                      </div>
                    )}
                    {approvedWebinars.map((order) => (
                      <PurchasedWebinarCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
