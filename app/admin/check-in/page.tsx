"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Camera,
  CameraOff,
  Search,
  User,
  Mail,
  Building,
  Briefcase,
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
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown")
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

  // Check camera permission status on mount
  useEffect(() => {
    async function checkCameraPermission() {
      try {
        // Check if permissions API is available
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: "camera" as PermissionName })
          setCameraPermission(result.state as "prompt" | "granted" | "denied")
          
          // Listen for permission changes
          result.onchange = () => {
            setCameraPermission(result.state as "prompt" | "granted" | "denied")
          }
        } else {
          // Permissions API not available, set to unknown
          setCameraPermission("unknown")
        }
      } catch (err) {
        // Permissions API might not support camera query
        setCameraPermission("unknown")
      }
    }
    
    checkCameraPermission()
  }, [])

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

  const startScanner = async () => {
    setInitializing(true)
    
    try {
      // Stop any existing scanner first
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
        } catch (e) {
          // Ignore stop errors
        }
        scannerRef.current = null
      }

      // Clear the container before initializing
      const container = document.getElementById("qr-reader")
      if (container) {
        container.innerHTML = ""
      }

      // First, request camera permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        })
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop())
        setCameraPermission("granted")
      } catch (permErr: any) {
        console.error("[v0] Camera permission denied:", permErr)
        setInitializing(false)
        setCameraPermission(permErr.name === "NotAllowedError" ? "denied" : "unknown")
        
        let errorMessage = "Camera access denied. "
        if (permErr.name === "NotAllowedError") {
          errorMessage += "Please allow camera access in your browser settings and try again."
        } else if (permErr.name === "NotFoundError") {
          errorMessage += "No camera found on this device."
        } else if (permErr.name === "NotReadableError") {
          errorMessage += "Camera is being used by another application."
        } else if (permErr.name === "OverconstrainedError") {
          errorMessage = "Camera constraints could not be satisfied. Trying alternative settings."
        } else {
          errorMessage += "Please check your browser permissions."
        }
        
        toast({
          title: "Camera Permission Required",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      // Get available cameras
      let cameras: { id: string; label: string }[] = []
      try {
        cameras = await Html5Qrcode.getCameras()
      } catch (camErr) {
        console.error("[v0] Failed to enumerate cameras:", camErr)
      }

      const html5QrCode = new Html5Qrcode("qr-reader", {
        verbose: false,
      })
      scannerRef.current = html5QrCode

      const qrboxSize = Math.min(250, window.innerWidth - 100)
      const config = {
        fps: 10,
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
        disableFlip: false,
      }

      const onScanSuccess = (decodedText: string) => {
        // Stop scanner and process the code
        html5QrCode.stop().then(() => {
          setScanning(false)
          setInitializing(false)
          scannerRef.current = null
          processQRCode(decodedText)
        }).catch(() => {
          setScanning(false)
          setInitializing(false)
          scannerRef.current = null
          processQRCode(decodedText)
        })
      }

      // Try with specific camera if available (prefer back camera)
      if (cameras.length > 0) {
        // Find back camera (usually contains "back", "rear", or "environment" in label)
        const backCamera = cameras.find(c => 
          c.label.toLowerCase().includes("back") || 
          c.label.toLowerCase().includes("rear") ||
          c.label.toLowerCase().includes("environment")
        )
        const cameraToUse = backCamera || cameras[0]
        
        try {
          await html5QrCode.start(
            cameraToUse.id,
            config,
            onScanSuccess,
            () => {} // QR code not detected - ignore
          )
          setScanning(true)
          setInitializing(false)
          return
        } catch (camErr) {
          console.log("[v0] Specific camera failed, trying facingMode:", camErr)
        }
      }

      // Fallback: Try environment camera (back camera on mobile)
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          () => {}
        )
        setScanning(true)
        setInitializing(false)
        return
      } catch (envErr) {
        console.log("[v0] Environment camera failed, trying user camera:", envErr)
      }

      // Fallback: Try user camera (front camera)
      try {
        await html5QrCode.start(
          { facingMode: "user" },
          config,
          onScanSuccess,
          () => {}
        )
        setScanning(true)
        setInitializing(false)
        return
      } catch (userErr) {
        console.log("[v0] User camera also failed:", userErr)
        throw new Error("Could not start camera. Please try refreshing the page.")
      }
    } catch (err: any) {
      console.error("[v0] Scanner initialization failed:", err)
      setInitializing(false)
      setScanning(false)
      toast({
        title: "Camera Error",
        description: err.message || "Could not access camera. Please check browser permissions or use manual entry.",
        variant: "destructive",
      })
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
    }
    setScanning(false)
    setInitializing(false)
    
    // Clear the container
    const container = document.getElementById("qr-reader")
    if (container) {
      container.innerHTML = ""
    }
  }

  const handleManualSearch = () => {
    if (!manualCode.trim()) return
    processQRCode(manualCode.trim())
    setManualCode("")
  }

  const resetScan = () => {
    setScanResult(null)
    setManualCode("")
  }

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

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
                    {/* Camera Scanner */}
                    <div className="relative">
                      <div
                        id="qr-reader"
                        className="w-full aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-gray-900"
                        style={{ minHeight: "300px" }}
                      />
                      
                      {/* Overlay states */}
                      {!scanning && !initializing && (
                        <div className="absolute inset-0 flex items-center justify-center max-w-md mx-auto">
                          <div className="text-center text-gray-400 p-8">
                            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Click Start Scanner to activate camera</p>
                            {cameraPermission === "denied" && (
                              <p className="text-red-400 text-sm mt-2">
                                Camera access was denied. Please enable it in your browser settings.
                              </p>
                            )}
                            {cameraPermission === "granted" && (
                              <p className="text-green-400 text-sm mt-2">
                                Camera permission granted
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {initializing && (
                        <div className="absolute inset-0 flex items-center justify-center max-w-md mx-auto bg-gray-900/90 rounded-xl">
                          <div className="text-center text-white p-8">
                            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-teal-400" />
                            <p className="font-medium">Initializing Camera...</p>
                            <p className="text-sm text-gray-400 mt-1">Please allow camera access</p>
                          </div>
                        </div>
                      )}
                      
                      {scanning && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-md">
                          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            Scanner Active - Point at QR code
                          </div>
                        </div>
                      )}

                      {processing && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl max-w-md mx-auto">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Processing...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-3">
                        {scanning ? (
                          <Button variant="destructive" onClick={stopScanner} size="lg">
                            <CameraOff className="w-4 h-4 mr-2" />
                            Stop Scanner
                          </Button>
                        ) : (
                          <Button 
                            onClick={startScanner} 
                            className="bg-teal-600 hover:bg-teal-700" 
                            size="lg"
                            disabled={initializing}
                          >
                            {initializing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4 mr-2" />
                                Start Scanner
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      {!scanning && !initializing && cameraPermission === "denied" && (
                        <p className="text-sm text-red-500">
                          Camera blocked. Click the camera icon in your browser&apos;s address bar to allow access.
                        </p>
                      )}
                    </div>

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
