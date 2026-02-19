"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Printer } from "lucide-react"
import Image from "next/image"

interface Registration {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  institution: string
  position: string
  registration_type: string
  order_date: string
  event: string
}

interface Payment {
  payment_status: string
  verified_at: string
}

export default function BadgePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const registrationId = params.registrationId as string

  const [registration, setRegistration] = useState<Registration | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch registration
        const { data: regData, error: regError } = await supabase
          .from("registrations")
          .select("*")
          .eq("id", registrationId)
          .eq("user_id", user.id)
          .single()

        if (regError || !regData) {
          router.push("/my-purchases")
          return
        }

        // Fetch payment
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .select("payment_status, verified_at")
          .eq("registration_id", registrationId)
          .single()

        if (paymentError || !paymentData || paymentData.payment_status !== "verified") {
          router.push("/my-purchases")
          return
        }

        setRegistration(regData)
        setPayment(paymentData)

        // Generate QR code using a public API
        const qrData = encodeURIComponent(registrationId)
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`)
      } catch (err) {
        console.error("Error fetching data:", err)
        router.push("/my-purchases")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [registrationId, router, supabase])

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your badge...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!registration || !payment) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 overflow-x-hidden">
        <section className="py-12 px-4 max-w-full">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-4 print:hidden no-print">
              <Button onClick={handlePrint} className="w-full">
                <Printer className="w-4 h-4 mr-2" />
                Print Badge
              </Button>
            </div>

            {/* Visible Badge for Display */}
            <div
              id="participant-badge"
              className="mx-auto print-only max-w-full"
              style={{
                width: "95mm",
                height: "126mm",
                backgroundColor: "#ffffff",
              }}
            >
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: "2px solid #0066cc",
                  borderRadius: "8px",
                  overflow: "hidden",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    background: "linear-gradient(to right, #0066cc, #0052a3)",
                    color: "#ffffff",
                    padding: "16px",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <Image
                      src="/images/isapm-logo.png"
                      alt="ISAPM Logo"
                      width={60}
                      height={60}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "9999px",
                        padding: "6px",
                      }}
                    />
                  </div>
                  <h1
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      lineHeight: "1.3",
                      margin: 0,
                    }}
                  >
                    ISAPM 8th National Meeting 2026
                  </h1>
                  <p
                    style={{
                      fontSize: "14px",
                      opacity: 0.9,
                      marginTop: "4px",
                      margin: 0,
                    }}
                  >
                    Malang, 16-18 April 2026
                  </p>
                </div>

                {/* Content */}
                <div
                  style={{
                    padding: "24px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {/* Participant Name */}
                    <div
                      style={{
                        textAlign: "center",
                        paddingBottom: "16px",
                        borderBottom: "2px solid rgba(0, 102, 204, 0.2)",
                        marginBottom: "16px",
                      }}
                    >
                      <h2
                        style={{
                          fontSize: "30px",
                          fontWeight: "bold",
                          lineHeight: "1.3",
                          margin: 0,
                          color: "#000000",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {registration.first_name} {registration.last_name}
                      </h2>
                    </div>

                    {/* Position, Institution, Course & QR */}
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        alignItems: "flex-start",
                        paddingBottom: "16px",
                        borderBottom: "2px solid rgba(0, 102, 204, 0.2)",
                        marginBottom: "16px",
                      }}
                    >
                      {/* Left column */}
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#0066cc",
                            margin: 0,
                            marginBottom: "8px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {registration.position}
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "#666666",
                            margin: 0,
                            marginBottom: "8px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {registration.institution}
                        </p>
                        <div
                          style={{
                            paddingTop: "8px",
                            borderTop: "1px solid #e5e5e5",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#666666",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {registration.event}
                          </p>
                        </div>
                      </div>

                      {/* Right: QR Code */}
                      <div style={{ flexShrink: 0 }}>
                        {qrCodeUrl && (
                          <div
                            style={{
                              padding: "8px",
                              backgroundColor: "#ffffff",
                              border: "2px solid #cccccc",
                              borderRadius: "4px",
                            }}
                          >
                            <img
                              src={qrCodeUrl || "/placeholder.svg"}
                              alt="QR"
                              width={96}
                              height={96}
                              crossOrigin="anonymous"
                              style={{
                                display: "block",
                                imageRendering: "crisp-edges",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Registration Type */}
                    <div
                      style={{
                        paddingBottom: "16px",
                        borderBottom: "2px solid rgba(0, 102, 204, 0.2)",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          lineHeight: "1.6",
                          textAlign: "center",
                          margin: 0,
                          color: "#000000",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {registration.registration_type}
                      </p>
                    </div>
                  </div>

                  {/* Registration ID */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      paddingTop: "16px",
                      flexShrink: 0,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#666666",
                        margin: 0,
                        fontFamily: "monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ID: {registrationId.substring(0, 16)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <Card className="print:hidden no-print">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">Important Information</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Please print this badge for your records</li>
                  <li>• Present this badge at the conference registration desk</li>
                  <li>• Keep your badge visible throughout the event</li>
                  <li>• Contact us if you need to update any information</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />

      <style jsx global>{`
        @media print {
          * {
            visibility: hidden;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Hide all non-badge elements */
          header, 
          footer, 
          nav,
          .no-print,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Only show the badge */
          #participant-badge,
          #participant-badge * {
            visibility: visible !important;
          }
          
          #participant-badge {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          
          @page {
            size: 95mm 126mm;
            margin: 0;
          }
          
          body, main, section {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </>
  )
}
