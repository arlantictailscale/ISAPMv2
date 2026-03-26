import { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Hotel, ExternalLink, Building2, AlertCircle } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Promotional Rate Sold Out | ISAPM 2026",
  description: "The special promotional hotel rates for ISAPM 2026 have been fully booked. Book directly with the hotel or through online travel platforms.",
}

// Force dynamic rendering to always check fresh availability
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function HotelSoldOutPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background pt-16 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sold Out Notice */}
          <Card className="mt-8 border-amber-200 bg-white shadow-lg">
            <CardContent className="pt-8 pb-10 px-6 sm:px-10">
              <div className="text-center space-y-6">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                  <Hotel className="w-10 h-10 text-amber-600" />
                </div>
                
                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    Promotional Rate Sold Out
                  </h1>
                  <p className="text-amber-600 font-medium text-lg">
                    ISAPM 2026 Special Hotel Package
                  </p>
                </div>
                
                {/* Message */}
                <div className="max-w-lg mx-auto space-y-4 text-slate-600">
                  <p className="text-base leading-relaxed">
                    We apologize, but the special promotional rates for hotel accommodation 
                    through our website have been fully booked. Thank you for your overwhelming 
                    interest in the ISAPM 8th National Meeting 2026!
                  </p>
                  <p className="text-sm text-slate-500">
                    You can still book directly with the hotel or through online travel platforms 
                    at regular rates.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 pt-6">
                  <p className="text-sm font-medium text-slate-700 mb-4">
                    Alternative Booking Options
                  </p>
                  
                  {/* Hotel Official Website - Primary */}
                  <a
                    href="https://www.thesinghasari.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors mb-4 max-w-sm mx-auto"
                  >
                    <Building2 className="w-5 h-5" />
                    Hotel Official Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  
                  <p className="text-xs text-slate-500 mb-3">Or book through these platforms:</p>
                  
                  {/* OTA Options Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                    {/* Traveloka */}
                    <a
                      href="https://www.traveloka.com/en-id/hotel/detail?spec=09-04-2026.10-04-2026.1.1.HOTEL.3000010000303.The%20Singhasari%20Resort%20Batu.2&loginPromo=1&prevSearchId=1860731724614365329&priceDisplay=NIGHTNOTAX&iuid=d185076a-ca27-4b31-a1f2-7509eef6a831"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group"
                    >
                      <img 
                        src="https://d1785e74lyxkqq.cloudfront.net/_next/static/v2/9/97f3e7a54e9c6987283b78e016664776.svg" 
                        alt="Traveloka" 
                        className="h-5 object-contain"
                      />
                      <span className="text-xs text-slate-500 group-hover:text-blue-600">Traveloka</span>
                    </a>
                    
                    {/* Tiket.com */}
                    <a
                      href="https://www.tiket.com/id-id/hotel/indonesia/the-singhasari-resort-batu-412001639950331681"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group"
                    >
                      <img 
                        src="https://s-light.tiket.photos/t/01E25EBZS3W0FY9GTG6C42E1SE/original/core-ina/2023/11/15/c36b23ef-ac3f-44c2-8c0c-5e84c0a32f9e-1700019959330-d43ba6be5d9cba4f84c4a4db85f78a1f.png" 
                        alt="Tiket.com" 
                        className="h-5 object-contain"
                      />
                      <span className="text-xs text-slate-500 group-hover:text-blue-600">Tiket.com</span>
                    </a>
                    
                    {/* Agoda */}
                    <a
                      href="https://www.agoda.com/the-singhasari-resort/hotel/malang-id.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-300 transition-colors group"
                    >
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Agoda_transparent_logo.png" 
                        alt="Agoda" 
                        className="h-5 object-contain"
                      />
                      <span className="text-xs text-slate-500 group-hover:text-red-600">Agoda</span>
                    </a>
                    
                    {/* Booking.com */}
                    <a
                      href="https://www.booking.com/hotel/id/the-singhasari-resort-batu.en-gb.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group"
                    >
                      <img 
                        src="https://cf.bstatic.com/static/img/favicon/9f92ee64ab887057f3dabbe4a26cd9e9e8c4e7a9.svg" 
                        alt="Booking.com" 
                        className="h-5 object-contain"
                      />
                      <span className="text-xs text-slate-500 group-hover:text-blue-600">Booking.com</span>
                    </a>
                  </div>
                </div>

                {/* Hotel Info */}
                <div className="bg-slate-50 rounded-xl p-5 text-left max-w-md mx-auto">
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-teal-600" />
                    The Singhasari Hotel & Convention
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary" className="bg-white">Event Venue</Badge>
                    <Badge variant="secondary" className="bg-white">April 16-19, 2026</Badge>
                  </div>
                </div>

                {/* Contact Support */}
                <div className="pt-4">
                  <p className="text-sm text-slate-500 mb-2">
                    Need assistance with your registration?
                  </p>
                  <Button 
                    variant="outline" 
                    asChild
                  >
                    <a href="https://wa.me/6289602626709" target="_blank" rel="noopener noreferrer">
                      Contact Support
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Availability Status */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Current Availability Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Deluxe Room (Promotional)</span>
                  <Badge variant="destructive">Sold Out</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-600">Premier Room (Promotional)</span>
                  <Badge variant="destructive">Sold Out</Badge>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Promotional rates through ISAPM 2026 registration are no longer available.
              </p>
            </CardContent>
          </Card>
          
          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Button variant="ghost" asChild>
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
