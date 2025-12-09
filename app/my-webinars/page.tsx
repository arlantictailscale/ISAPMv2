import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video, Calendar, Clock, CheckCircle, ExternalLink, Users, FileText, Play } from "lucide-react"
import Link from "next/link"

interface WebinarOrder {
  id: string
  created_at: string
  full_name: string
  email: string
  order_items: {
    id: string
    item_type: string
    event_id: string
    event_label: string
    unit_price: number
    currency: string
  }[]
  order_payments: {
    id: string
    payment_status: string
    verified_at: string
  }[]
}

export default async function MyWebinarsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch orders that contain webinar items with approved payments
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      created_at,
      full_name,
      email,
      order_items!inner (
        id,
        item_type,
        event_id,
        event_label,
        unit_price,
        currency
      ),
      order_payments (
        id,
        payment_status,
        verified_at
      )
    `)
    .eq("user_id", user.id)
    .eq("order_items.item_type", "webinar")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error loading webinars:", error.message)
  }

  // Filter for only approved webinars
  const approvedWebinars =
    orders?.filter((order: WebinarOrder) => {
      const payment = order.order_payments?.[0]
      return payment?.payment_status === "verified"
    }) || []

  // Webinar details (static for now - can be moved to database later)
  const webinarDetails = {
    title: "Achieving Equity in Pain Management Services in Indonesia",
    subtitle: "Synergy between Anesthesiologists, Government Regulations, and BPJS Health Financing Schemes",
    date: "Friday, January 30, 2026",
    time: "13:00 WIB - End",
    speakers: [
      {
        name: "Prof. dr. Dante Saksono Harbuwono, Sp.PD, KEMD, Ph.D",
        organization: "Ministry of Health (Kemenkes)",
        topic:
          "National Policy Direction for Equity in Pain Management: Integration into the Cancer, Heart, Stroke, and Uro-Nephrology (KJSU) Priority Programs",
      },
      {
        name: "Dr. dr. A. Muh. Takdir Musba, Sp.An-TI, Subsp. M.N. (K)",
        organization: "ISAPM",
        topic: "Mapping the National Pain Management Workforce: Distribution, Competencies, and Challenges",
      },
      {
        name: "Irjen. Pol. Dr. dr. Asep Hendradiana, Sp.An-TI, Subsp.TI(K), M.Kes.",
        organization: "PP Perdatin",
        topic: "National Clinical Practice Guidelines (PNPK) for Pain: Standardization for Quality and Equity",
      },
      {
        name: "Prof. dr. Ali Ghufron Mukti, M.Sc., Ph.D., AAK",
        organization: "BPJS Kesehatan",
        topic: "Equitable and Clinical Need-Based Financing for Pain Services: Strategies to Support Equal Access",
      },
    ],
    benefits: [
      "Live webinar access with Q&A session",
      "Certificate of participation (SKP)",
      "Recording access for 30 days",
      "Presentation materials (PDF)",
    ],
  }

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
                <p className="text-indigo-100">Access your purchased webinars</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {approvedWebinars.length === 0 ? (
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
                {approvedWebinars.map((order: WebinarOrder) => {
                  const webinarItem = order.order_items.find((item) => item.item_type === "webinar")
                  const payment = order.order_payments?.[0]

                  return (
                    <Card key={order.id} className="overflow-hidden border-indigo-200 shadow-lg">
                      {/* Webinar Header */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <Badge className="bg-white/20 text-white border-white/30 mb-3">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Access Confirmed
                            </Badge>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-balance">{webinarDetails.title}</h2>
                            <p className="text-indigo-100 text-sm sm:text-base">{webinarDetails.subtitle}</p>
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

                        {/* Access Buttons */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-8">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Play className="w-5 h-5 text-indigo-600" />
                            Webinar Access
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Join Webinar (Coming Soon)
                            </Button>
                            <Button variant="outline" disabled>
                              <FileText className="w-4 h-4 mr-2" />
                              Download Materials
                            </Button>
                            <Button variant="outline" disabled>
                              <Video className="w-4 h-4 mr-2" />
                              View Recording
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">
                            The webinar link will be sent to your email ({order.email}) before the event.
                          </p>
                        </div>

                        {/* Speakers */}
                        <div className="mb-8">
                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Session Speakers
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {webinarDetails.speakers.map((speaker, index) => (
                              <div
                                key={index}
                                className="p-4 border rounded-xl bg-card hover:shadow-md transition-shadow"
                              >
                                <Badge variant="secondary" className="mb-2 text-xs">
                                  {speaker.organization}
                                </Badge>
                                <p className="font-semibold text-sm mb-1">{speaker.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{speaker.topic}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* What You'll Get */}
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
