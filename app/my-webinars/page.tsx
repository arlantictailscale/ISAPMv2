import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Gift, Video, Calendar, Clock, Users, CheckCircle, Play } from "lucide-react"
import { getWebinarById, formatWebinarDate, WEBINARS, WEBINAR_BUNDLE_ID } from "@/lib/data/webinars"
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

interface WebinarEntry {
  orderId: string
  userId: string
  email: string
  fullName: string
  eventId: string
  eventLabel: string
  itemType: string
  paymentStatus: string
  verifiedAt: string
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

interface ColorScheme {
  gradient: string
  gradientHover: string
  subtitleText: string
  border: string
  infoBg: string
  iconColor: string
  buttonGradient: string
  buttonHover: string
}

function getWebinarColorScheme(webinarId: string): ColorScheme {
  // Map webinar IDs to distinct color schemes
  const colorSchemes: Record<string, ColorScheme> = {
    webinar_equity_pain: {
      gradient: "from-indigo-600 to-purple-600",
      gradientHover: "from-indigo-700 to-purple-700",
      subtitleText: "text-indigo-100",
      border: "border-indigo-200",
      infoBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      buttonGradient: "from-indigo-600 to-purple-600",
      buttonHover: "hover:from-indigo-700 hover:to-purple-700",
    },
    webinar_2: {
      gradient: "from-emerald-600 to-teal-600",
      gradientHover: "from-emerald-700 to-teal-700",
      subtitleText: "text-emerald-100",
      border: "border-emerald-200",
      infoBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      buttonGradient: "from-emerald-600 to-teal-600",
      buttonHover: "hover:from-emerald-700 hover:to-teal-700",
    },
    webinar_3: {
      gradient: "from-orange-500 to-red-500",
      gradientHover: "from-orange-600 to-red-600",
      subtitleText: "text-orange-100",
      border: "border-orange-200",
      infoBg: "bg-orange-50",
      iconColor: "text-orange-600",
      buttonGradient: "from-orange-500 to-red-500",
      buttonHover: "hover:from-orange-600 hover:to-red-600",
    },
    webinar_4: {
      gradient: "from-pink-500 to-rose-500",
      gradientHover: "from-pink-600 to-rose-600",
      subtitleText: "text-pink-100",
      border: "border-pink-200",
      infoBg: "bg-pink-50",
      iconColor: "text-pink-600",
      buttonGradient: "from-pink-500 to-rose-500",
      buttonHover: "hover:from-pink-600 hover:to-rose-600",
    },
    webinar_5: {
      gradient: "from-cyan-500 to-blue-500",
      gradientHover: "from-cyan-600 to-blue-600",
      subtitleText: "text-cyan-100",
      border: "border-cyan-200",
      infoBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      buttonGradient: "from-cyan-500 to-blue-500",
      buttonHover: "hover:from-cyan-600 hover:to-blue-600",
    },
  }

  // Return matching scheme or default to indigo/purple
  return (
    colorSchemes[webinarId] || {
      gradient: "from-indigo-600 to-purple-600",
      gradientHover: "from-indigo-700 to-purple-700",
      subtitleText: "text-indigo-100",
      border: "border-indigo-200",
      infoBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      buttonGradient: "from-indigo-600 to-purple-600",
      buttonHover: "hover:from-indigo-700 hover:to-purple-700",
    }
  )
}

function PurchasedWebinarCard({ entry }: { entry: WebinarEntry }) {
  const webinarData = getWebinarById(entry.eventId)

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
        id: entry.eventId || "",
        title: entry.eventLabel || "Webinar",
        subtitle: "",
        date: "TBD",
        time: "TBD",
        speakers: [],
        benefits: [],
        slug: "",
      }

  const colors = getWebinarColorScheme(entry.eventId)

  return (
    <Card className={`overflow-hidden ${colors.border} shadow-lg`}>
      {/* Webinar Header - Use dynamic gradient */}
      <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Badge className="bg-white/20 text-white border-white/30 mb-3">
              <CheckCircle className="w-3 h-3 mr-1" />
              Access Confirmed
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-balance">{webinarDetails.title}</h2>
            {webinarDetails.subtitle && (
              <p className={`${colors.subtitleText} text-sm sm:text-base line-clamp-2`}>{webinarDetails.subtitle}</p>
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
        {/* Date and Time - Use dynamic info background and icon colors */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className={`flex items-center gap-3 p-4 ${colors.infoBg} rounded-xl`}>
            <Calendar className={`w-5 h-5 ${colors.iconColor}`} />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-semibold text-sm">{webinarDetails.date}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 ${colors.infoBg} rounded-xl`}>
            <Clock className={`w-5 h-5 ${colors.iconColor}`} />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-semibold text-sm">{webinarDetails.time}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 ${colors.infoBg} rounded-xl`}>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold text-sm text-green-600">Registered</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-4 ${colors.infoBg} rounded-xl`}>
            <Users className={`w-5 h-5 ${colors.iconColor}`} />
            <div>
              <p className="text-xs text-muted-foreground">Speakers</p>
              <p className="font-semibold text-sm">{webinarDetails.speakers.length} Experts</p>
            </div>
          </div>
        </div>

        {/* Webinar Access & Materials Section - Use dynamic icon color */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Play className={`w-5 h-5 ${colors.iconColor}`} />
            Webinar Access & Materials
          </h3>
          <WebinarContentDisplay webinarId={webinarDetails.id} />
        </div>

        {/* Access Button - Use dynamic button gradient */}
        {webinarDetails.slug && (
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Link href={`/webinar/${webinarDetails.slug}`} className="flex-1">
              <Button className={`w-full bg-gradient-to-r ${colors.buttonGradient} ${colors.buttonHover}`}>
                <Play className="w-4 h-4 mr-2" />
                View Webinar Details
              </Button>
            </Link>
          </div>
        )}
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
      order_items(id, event_id, event_label, item_type),
      order_payments(payment_status, verified_at)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const webinarEntries: WebinarEntry[] = []
  const seenEventIds = new Set<string>()

  for (const order of webinarOrders || []) {
    const payment = order.order_payments?.[0]
    if (payment?.payment_status !== "verified") continue

    for (const item of order.order_items || []) {
      if (item.item_type === "webinar") {
        // Check if this is a bundle purchase - expand into all 4 webinars
        if (item.event_id === WEBINAR_BUNDLE_ID) {
          // Add all webinars from the bundle
          for (const webinar of WEBINARS) {
            if (!seenEventIds.has(webinar.id)) {
              seenEventIds.add(webinar.id)
              webinarEntries.push({
                orderId: order.id,
                userId: order.user_id,
                email: order.email,
                fullName: order.full_name,
                eventId: webinar.id,
                eventLabel: webinar.title,
                itemType: item.item_type,
                paymentStatus: payment.payment_status,
                verifiedAt: payment.verified_at,
              })
            }
          }
        } else if (!seenEventIds.has(item.event_id)) {
          // Individual webinar purchase
          seenEventIds.add(item.event_id)
          webinarEntries.push({
            orderId: order.id,
            userId: order.user_id,
            email: order.email,
            fullName: order.full_name,
            eventId: item.event_id,
            eventLabel: item.event_label,
            itemType: item.item_type,
            paymentStatus: payment.payment_status,
            verifiedAt: payment.verified_at,
          })
        }
      }
    }
  }

  // Fetch symposium bonus grants
  const { data: bonusGrants } = await supabase
    .from("symposium_webinar_grants")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const uniqueBonusGrants = (bonusGrants || []).filter(
    (grant, index, self) => index === self.findIndex((g) => g.webinar_id === grant.webinar_id),
  ) as WebinarGrant[]

  const hasAnyWebinars = webinarEntries.length > 0 || uniqueBonusGrants.length > 0

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
                {webinarEntries.length > 0 && (
                  <div className="bg-white/10 rounded-lg px-4 py-2">
                    <span className="text-indigo-200 text-sm">Purchased:</span>
                    <span className="font-bold ml-2">{webinarEntries.length}</span>
                  </div>
                )}
                {uniqueBonusGrants.length > 0 && (
                  <div className="bg-amber-400/20 rounded-lg px-4 py-2">
                    <span className="text-amber-200 text-sm">Bonus:</span>
                    <span className="font-bold ml-2">{uniqueBonusGrants.length}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {!hasAnyWebinars ? (
            <Card className="p-12 text-center border-dashed">
              <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">No Webinars Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t purchased any webinars or received bonus access yet.
              </p>
              <Link href="/webinar">
                <Button>Browse Available Webinars</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Purchased Webinars Section */}
              {webinarEntries.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Video className="w-6 h-6 text-indigo-600" />
                    Purchased Webinars
                  </h2>
                  <div className="space-y-6">
                    {webinarEntries.map((entry) => (
                      <PurchasedWebinarCard key={`${entry.orderId}-${entry.eventId}`} entry={entry} />
                    ))}
                  </div>
                </section>
              )}

              {/* Bonus Webinars Section */}
              {uniqueBonusGrants.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Gift className="w-6 h-6 text-emerald-600" />
                    Symposium Bonus Webinars
                  </h2>
                  <div className="space-y-6">
                    {uniqueBonusGrants.map((grant) => (
                      <BonusWebinarCard key={grant.id} grant={grant} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
