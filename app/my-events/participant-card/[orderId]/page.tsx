"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Printer, Calendar, MapPin, User, Mail, Building, Briefcase, ArrowLeft, AlertCircle } from "lucide-react"

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
}

export default function ParticipantCardPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const cardRef = useRef<HTMLDivElement>(null)

  const [card, setCard] = useState<ParticipantCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCard() {
      try {
        const supabase = createClient()

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Fetch participant card for this order
        const { data: cardData, error: cardError } = await supabase
          .from("participant_cards")
          .select("*")
          .eq("order_id", orderId)
          .eq("user_id", user.id)
          .single()

        if (cardError) {
          if (cardError.code === "PGRST116") {
            setError("No participant card found for this registration. Please ensure your payment has been verified.")
          } else {
            throw cardError
          }
          return
        }

        setCard(cardData)
      } catch (err: any) {
        console.error("Error fetching participant card:", err)
        setError(err.message || "Failed to load participant card")
      } finally {
        setLoading(false)
      }
    }

    fetchCard()
  }, [orderId, router])

  const handleDownload = () => {
    if (!cardRef.current) return

    // Create a canvas from the card element
    import("html2canvas").then(({ default: html2canvas }) => {
      html2canvas(cardRef.current!, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      }).then((canvas) => {
        const link = document.createElement("a")
        link.download = `participant-card-${card?.card_number}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
      })
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Participant Card Not Available</h2>
                <p className="text-gray-600 mb-6">
                  {error || "Your participant card will be available once your payment has been verified."}
                </p>
                <Button onClick={() => router.push("/my-registrations")}>
                  View My Registrations
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const qrValue = `ISAPM2026:${card.secure_token}`

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="print:hidden"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          {/* Participant Card */}
          <div
            ref={cardRef}
            className="bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none"
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">ISAPM 2026</h1>
                  <p className="text-teal-100 text-sm">Indonesian Society for the Study of Pain Medicine</p>
                </div>
                <Badge
                  variant={card.status === "active" ? "default" : "secondary"}
                  className={card.status === "active" ? "bg-white text-teal-700" : ""}
                >
                  {card.status === "active" ? "Active" : card.status === "checked_in" ? "Checked In" : card.status}
                </Badge>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* QR Code Section */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm">
                    <QRCodeSVG
                      value={qrValue}
                      size={180}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#0d9488"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-mono">{card.card_number}</p>
                </div>

                {/* Participant Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{card.full_name}</h2>
                    {card.position && (
                      <p className="text-gray-600">{card.position}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{card.email}</span>
                    </div>
                    {card.institution && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{card.institution}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2">Issued: {format(new Date(card.issued_at), "MMMM d, yyyy")}</p>
                    {card.checked_in_at && (
                      <p className="text-xs text-teal-600">
                        Checked in: {format(new Date(card.checked_in_at), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Registered Events */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Registered Events
                </h3>
                <div className="grid gap-2">
                  {card.events.map((event, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{event.event_label}</p>
                        <p className="text-xs text-gray-500">{event.participant_type_label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Details */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Royal Ambarrukmo Yogyakarta</p>
                    <p>April 17-19, 2026</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-gray-50 px-6 py-4 text-center">
              <p className="text-xs text-gray-500">
                Present this card at the registration desk for check-in.
                <br />
                This card is non-transferable.
              </p>
            </div>
          </div>

          {/* Instructions */}
          <Card className="mt-6 border-0 shadow-md print:hidden">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">1.</span>
                  Download or print this participant card before the event.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">2.</span>
                  Present this QR code at the registration desk upon arrival.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">3.</span>
                  You can also show the QR code from your mobile device.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">4.</span>
                  Keep this card safe - it grants access to your registered events.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #__next > div > main > div > div:nth-child(2),
          #__next > div > main > div > div:nth-child(2) * {
            visibility: visible;
          }
          #__next > div > main > div > div:nth-child(2) {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
