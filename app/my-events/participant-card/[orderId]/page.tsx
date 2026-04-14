"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react"
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
  card_token: string
  user_id: string
  order_id: string
  full_name: string
  email: string
  institution: string | null
  position: string | null
  events: Array<{
    event_id: string
    event_label: string
    participant_type: string
    participant_type_label: string
  }>
  is_checked_in: boolean
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

  const handleDownload = async () => {
    if (!card) return

    try {
      // Create a canvas to draw the card
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")

      // Card dimensions (2x for retina)
      const scale = 2
      const width = 600 * scale
      const height = 800 * scale
      canvas.width = width
      canvas.height = height

      // Background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)

      // Header background
      const headerHeight = 120 * scale
      const gradient = ctx.createLinearGradient(0, 0, width, 0)
      gradient.addColorStop(0, "#0d9488")
      gradient.addColorStop(1, "#0f766e")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, headerHeight)

      // Header text
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${32 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillText("ISAPM 2026", 30 * scale, 50 * scale)
      ctx.font = `${14 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#99f6e4"
      ctx.fillText("Indonesian Society for the Study of Pain Medicine", 30 * scale, 80 * scale)

      // Status badge
      const badgeText = card.is_checked_in ? "Checked In" : "Active"
      ctx.font = `bold ${12 * scale}px system-ui, -apple-system, sans-serif`
      const badgeWidth = ctx.measureText(badgeText).width + 20 * scale
      ctx.fillStyle = card.is_checked_in ? "#f59e0b" : "#ffffff"
      ctx.beginPath()
      ctx.roundRect(width - badgeWidth - 30 * scale, 35 * scale, badgeWidth, 30 * scale, 15 * scale)
      ctx.fill()
      ctx.fillStyle = card.is_checked_in ? "#ffffff" : "#0d9488"
      ctx.fillText(badgeText, width - badgeWidth - 20 * scale, 55 * scale)

      // Get QR code as data URL from the hidden canvas
      const qrCanvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement
      if (qrCanvas) {
        const qrSize = 180 * scale
        const qrX = 30 * scale
        const qrY = headerHeight + 30 * scale
        
        // QR code border
        ctx.fillStyle = "#f9fafb"
        ctx.beginPath()
        ctx.roundRect(qrX - 10 * scale, qrY - 10 * scale, qrSize + 20 * scale, qrSize + 20 * scale, 12 * scale)
        ctx.fill()
        ctx.strokeStyle = "#e5e7eb"
        ctx.lineWidth = 2 * scale
        ctx.stroke()
        
        // Draw QR code
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)
        
        // QR code token
        ctx.font = `${10 * scale}px monospace`
        ctx.fillStyle = "#9ca3af"
        ctx.fillText(card.card_token.substring(0, 12) + "...", qrX, qrY + qrSize + 20 * scale)
      }

      // Participant info
      const infoX = 250 * scale
      const infoY = headerHeight + 40 * scale

      // Name
      ctx.font = `bold ${24 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#111827"
      ctx.fillText(card.full_name, infoX, infoY)

      // Position
      if (card.position) {
        ctx.font = `${14 * scale}px system-ui, -apple-system, sans-serif`
        ctx.fillStyle = "#6b7280"
        ctx.fillText(card.position, infoX, infoY + 30 * scale)
      }

      // Email
      ctx.font = `${13 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#6b7280"
      ctx.fillText(card.email, infoX, infoY + 70 * scale)

      // Institution
      if (card.institution) {
        ctx.fillText(card.institution, infoX, infoY + 95 * scale)
      }

      // Issued date
      ctx.font = `${11 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#9ca3af"
      ctx.fillText(`Issued: ${format(new Date(card.issued_at), "MMMM d, yyyy")}`, infoX, infoY + 130 * scale)

      if (card.checked_in_at) {
        ctx.fillStyle = "#0d9488"
        ctx.fillText(`Checked in: ${format(new Date(card.checked_in_at), "MMMM d, yyyy 'at' h:mm a")}`, infoX, infoY + 150 * scale)
      }

      // Divider line
      const dividerY = headerHeight + 230 * scale
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1 * scale
      ctx.beginPath()
      ctx.moveTo(30 * scale, dividerY)
      ctx.lineTo(width - 30 * scale, dividerY)
      ctx.stroke()

      // Registered Events section
      ctx.font = `bold ${14 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#111827"
      ctx.fillText("Registered Events", 30 * scale, dividerY + 30 * scale)

      // Events list
      let eventY = dividerY + 60 * scale
      card.events.forEach((event) => {
        ctx.fillStyle = "#f3f4f6"
        ctx.beginPath()
        ctx.roundRect(30 * scale, eventY, width - 60 * scale, 50 * scale, 8 * scale)
        ctx.fill()

        ctx.font = `500 ${13 * scale}px system-ui, -apple-system, sans-serif`
        ctx.fillStyle = "#111827"
        ctx.fillText(event.event_label, 45 * scale, eventY + 22 * scale)
        
        ctx.font = `${11 * scale}px system-ui, -apple-system, sans-serif`
        ctx.fillStyle = "#6b7280"
        ctx.fillText(event.participant_type_label, 45 * scale, eventY + 40 * scale)

        eventY += 60 * scale
      })

      // Venue section
      const venueY = eventY + 20 * scale
      ctx.strokeStyle = "#e5e7eb"
      ctx.beginPath()
      ctx.moveTo(30 * scale, venueY)
      ctx.lineTo(width - 30 * scale, venueY)
      ctx.stroke()

      ctx.font = `bold ${13 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#111827"
      ctx.fillText("The Singhasari Resort", 30 * scale, venueY + 30 * scale)
      
      ctx.font = `${12 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#6b7280"
      ctx.fillText("Batu, Malang, East Java, Indonesia", 30 * scale, venueY + 50 * scale)
      ctx.fillText("April 16-18, 2026", 30 * scale, venueY + 70 * scale)

      // Footer
      const footerY = height - 60 * scale
      ctx.fillStyle = "#f9fafb"
      ctx.fillRect(0, footerY, width, 60 * scale)
      
      ctx.font = `${10 * scale}px system-ui, -apple-system, sans-serif`
      ctx.fillStyle = "#9ca3af"
      ctx.textAlign = "center"
      ctx.fillText("Present this card at the registration desk for check-in.", width / 2, footerY + 25 * scale)
      ctx.fillText("This card is non-transferable.", width / 2, footerY + 42 * scale)

      // Download the canvas
      const link = document.createElement("a")
      link.download = `ISAPM2026-participant-card-${card.full_name.replace(/[^a-zA-Z0-9]/g, "_")}.png`
      link.href = canvas.toDataURL("image/png", 1.0)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Failed to download card:", err)
      alert("Failed to download card. Please try using the Print option instead.")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-8">
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
        <main className="container mx-auto px-4 pt-24 pb-8">
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
                <Button onClick={() => router.push("/my-events")}>
                  Back to My Events
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const qrValue = card.card_token

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-8">
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
            id="participant-card-printable"
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
                  variant={!card.is_checked_in ? "default" : "secondary"}
                  className={!card.is_checked_in ? "bg-white text-teal-700" : ""}
                >
                  {card.is_checked_in ? "Checked In" : "Active"}
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
                    {/* Hidden canvas QR code for download */}
                    <QRCodeCanvas
                      id="qr-code-canvas"
                      value={qrValue}
                      size={360}
                      level="H"
                      includeMargin={false}
                      bgColor="#ffffff"
                      fgColor="#0d9488"
                      style={{ display: "none" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-mono">{card.card_token.substring(0, 12)}...</p>
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
                    <p className="font-medium text-gray-900">The Singhasari Resort</p>
                    <p>Batu, Malang, East Java, Indonesia</p>
                    <p className="mt-1">April 16-18, 2026</p>
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
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          
          /* Show only the participant card */
          #participant-card-printable,
          #participant-card-printable * {
            visibility: visible !important;
          }
          
          /* Position the card at the top */
          #participant-card-printable {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Ensure backgrounds print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Hide navigation and footer */
          nav, footer, .print\\:hidden {
            display: none !important;
          }
          
          /* Ensure proper page sizing */
          @page {
            margin: 0.5in;
            size: auto;
          }
        }
      `}</style>
    </div>
  )
}
