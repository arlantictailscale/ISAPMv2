"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import QRScanner from "@/components/qr-scanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  User,
  Mail,
  Building,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  QrCode,
} from "lucide-react"

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
  checked_in_by: string | null
}

type ScanResult = {
  status: "success" | "already_checked_in" | "not_found" | "error"
  card?: ParticipantCard
  message: string
}

export default function AdminCheckInPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [manualCode, setManualCode] = useState("")
  const [processing, setProcessing] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [recentCheckIns, setRecentCheckIns] = useState<ParticipantCard[]>([])
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 })

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
      setLoading(false)
      fetchStats()
      fetchRecentCheckIns()
    }

    checkAuth()
  }, [router])

  const fetchStats = async () => {
    const supabase = createClient()
    const { count: total } = await supabase
      .from("participant_cards")
      .select("*", { count: "exact", head: true })

    const { count: checkedIn } = await supabase
      .from("participant_cards")
      .select("*", { count: "exact", head: true })
      .eq("is_checked_in", true)

    setStats({ total: total || 0, checkedIn: checkedIn || 0 })
  }

  const fetchRecentCheckIns = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("participant_cards")
      .select("*")
      .eq("is_checked_in", true)
      .order("checked_in_at", { ascending: false })
      .limit(5)

    if (data) setRecentCheckIns(data)
  }

  const processQRCode = useCallback(async (code: string) => {
    if (processing) return
    setProcessing(true)

    try {
      // Extract token from QR code (format: ISAPM2026:token)
      let token = code
      if (code.startsWith("ISAPM2026:")) {
        token = code.replace("ISAPM2026:", "")
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Look up the participant card by token or card_token
      const { data: card, error } = await supabase
        .from("participant_cards")
        .select("*")
        .eq("card_token", token)
        .single()

      if (error || !card) {
        setScanResult({
          status: "not_found",
          message: "No participant found with this QR code. Please verify the code is correct.",
        })
        return
      }

      // Check if already checked in
      if (card.is_checked_in) {
        setScanResult({
          status: "already_checked_in",
          card,
          message: `This participant was already checked in on ${format(new Date(card.checked_in_at!), "MMM d, yyyy 'at' h:mm a")}`,
        })
        return
      }

      // Perform check-in
      const { error: updateError } = await supabase
        .from("participant_cards")
        .update({
          is_checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: user?.id,
        })
        .eq("id", card.id)

      if (updateError) throw updateError

      const updatedCard = {
        ...card,
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user?.id,
      }

      setScanResult({
        status: "success",
        card: updatedCard,
        message: "Check-in successful!",
      })

      toast({
        title: "Check-in Successful",
        description: `${card.full_name} has been checked in.`,
      })

      // Refresh stats and recent check-ins
      fetchStats()
      fetchRecentCheckIns()
    } catch (err: any) {
      console.error("Check-in error:", err)
      setScanResult({
        status: "error",
        message: err.message || "An error occurred during check-in",
      })
    } finally {
      setProcessing(false)
    }
  }, [processing, toast])

  const handleManualSearch = () => {
    if (!manualCode.trim()) return
    processQRCode(manualCode.trim())
    setManualCode("")
  }

  const resetScan = () => {
    setScanResult(null)
    setManualCode("")
  }



  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Check-In Scanner</h1>
            <p className="text-sm text-gray-500">Scan participant QR codes for event check-in</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin/events")}>
            Back to Admin
          </Button>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Scanner Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-teal-600" />
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
            </div>

            {/* Scanner / Result Area */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                {scanResult ? (
                  // Scan Result
                  <div className="space-y-6">
                    <div className="text-center">
                      {scanResult.status === "success" && (
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                      )}
                      {scanResult.status === "already_checked_in" && (
                        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="w-10 h-10 text-amber-600" />
                        </div>
                      )}
                      {(scanResult.status === "not_found" || scanResult.status === "error") && (
                        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                          <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {scanResult.status === "success" && "Check-In Successful"}
                        {scanResult.status === "already_checked_in" && "Already Checked In"}
                        {scanResult.status === "not_found" && "Not Found"}
                        {scanResult.status === "error" && "Error"}
                      </h3>
                      <p className="text-gray-600">{scanResult.message}</p>
                    </div>

                    {scanResult.card && (
                      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                            <User className="w-8 h-8 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{scanResult.card.full_name}</h4>
                            <p className="text-gray-600">{scanResult.card.position}</p>
                          </div>
                        </div>

                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{scanResult.card.email}</span>
                          </div>
                          {scanResult.card.institution && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building className="w-4 h-4" />
                              <span>{scanResult.card.institution}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <QrCode className="w-4 h-4" />
                            <span className="font-mono text-xs">{scanResult.card.card_token.substring(0, 12)}...</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            Registered Events
                          </h5>
                          <div className="space-y-2">
                            {scanResult.card.events.map((event, i) => (
                              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                                <span className="font-medium text-gray-900 text-sm">{event.event_label}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {event.participant_type_label}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <Button onClick={resetScan} className="w-full bg-teal-600 hover:bg-teal-700">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Scan Next Participant
                    </Button>
                  </div>
                ) : (
                  // Scanner
                  <div className="space-y-6">
                    {/* QR Scanner Component */}
                    <QRScanner 
                      onScan={processQRCode}
                      onError={(error) => {
                        toast({
                          title: "Camera Error",
                          description: error,
                          variant: "destructive",
                        })
                      }}
                    />
                    
                    {processing && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 text-center shadow-xl">
                          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Processing check-in...</p>
                        </div>
                      </div>
                    )}

                    {/* Manual Entry */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or enter code manually</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter card number or token..."
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                      />
                      <Button onClick={handleManualSearch} disabled={!manualCode.trim() || processing}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Check-ins Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                {recentCheckIns.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No check-ins yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentCheckIns.map((card) => (
                      <div key={card.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">{card.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {card.checked_in_at && format(new Date(card.checked_in_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/admin/participant-cards")}
                  >
                    <User className="w-4 h-4 mr-2" />
                    View All Cards
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/admin/confirmed-attendees")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Confirmed Attendees
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
