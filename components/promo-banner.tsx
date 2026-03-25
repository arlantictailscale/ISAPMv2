"use client"

import { useState } from "react"
import { X, Gift, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="container mx-auto px-4 py-3 relative">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 bg-white/20 rounded-full p-2">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base">
                  SPECIAL OFFER for AREMANEST FKUB Alumni!
                </span>
                <span className="text-xs sm:text-sm opacity-90 hidden sm:inline">
                  Up to 50% discount on selected events
                </span>
              </div>
              
              {/* Mobile: Show/Hide details */}
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="sm:hidden flex items-center gap-1 text-xs mt-1 opacity-90 hover:opacity-100"
              >
                {isExpanded ? "Hide details" : "View details"}
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/events">
              <Button 
                size="sm" 
                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold text-xs sm:text-sm whitespace-nowrap"
              >
                Register Now
              </Button>
            </Link>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Expanded details for mobile */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/20 sm:hidden">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-bold shrink-0">50% OFF</span>
                <span>Symposium Registration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-bold shrink-0">30% OFF</span>
                <span>Workshop: Pediatric Essential Pain Management & Cancer Pain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-bold shrink-0">50% OFF</span>
                <span>Workshop: Adjunct Therapy for Pain Management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-yellow-300 text-orange-800 text-xs px-2 py-0.5 rounded font-bold shrink-0">SPECIAL</span>
                <span>Refer a Nurse (IDR 500K) or GP (IDR 1.5M) for Adjunct Therapy Workshop</span>
              </li>
            </ul>
            <p className="text-xs mt-3 opacity-80">Limited slots available. Use promo code <strong className="text-yellow-200">AREMANEST2026</strong> at checkout.</p>
          </div>
        )}
        
        {/* Desktop expanded view */}
        <div className="hidden sm:block mt-3 pt-3 border-t border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-bold shrink-0">50% OFF</span>
              <span>Symposium Registration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-bold shrink-0">30% OFF</span>
              <span>Workshop: Pediatric & Cancer Pain</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded font-bold shrink-0">50% OFF</span>
              <span>Workshop: Adjunct Therapy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-300 text-orange-800 text-xs px-2 py-0.5 rounded font-bold shrink-0">SPECIAL</span>
              <span>Nurse: IDR 500K / GP: IDR 1.5M</span>
            </div>
          </div>
          <p className="text-xs mt-2 opacity-80">Limited slots available. Contact admin or use promo code <strong>AREMANEST2026</strong> at checkout.</p>
        </div>
      </div>
    </div>
  )
}
