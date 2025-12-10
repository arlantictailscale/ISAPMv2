"use client"

import { Gift, Sparkles, ArrowRight, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  getActiveSymposiumPromotion,
  getIncludedWebinarsForSymposium,
  calculateBundleSavings,
  formatCurrency,
} from "@/lib/data/promotions"

interface SymposiumBundleBannerProps {
  variant?: "full" | "compact" | "minimal"
  showCTA?: boolean
  className?: string
}

export function SymposiumBundleBanner({
  variant = "full",
  showCTA = true,
  className = "",
}: SymposiumBundleBannerProps) {
  const promotion = getActiveSymposiumPromotion()
  if (!promotion) return null

  const includedWebinars = getIncludedWebinarsForSymposium()
  const savings = calculateBundleSavings()
  const activeWebinarsCount = includedWebinars.filter((w) => w.status === "active").length

  if (variant === "minimal") {
    return (
      <Badge variant="secondary" className={`bg-emerald-100 text-emerald-700 border-emerald-200 ${className}`}>
        <Gift className="w-3 h-3 mr-1" />
        Includes {activeWebinarsCount > 0 ? activeWebinarsCount : 4} FREE Webinars
      </Badge>
    )
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg ${className}`}
      >
        <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full shrink-0">
          <Gift className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800">Special Bundle Deal</p>
          <p className="text-xs text-emerald-600">Buy Symposium, get 4 webinars FREE!</p>
        </div>
        {savings > 0 && <Badge className="bg-emerald-500 text-white shrink-0">Save {formatCurrency(savings)}</Badge>}
      </div>
    )
  }

  // Full variant
  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 border-0 ${className}`}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Left section - Main offer */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">Limited Time Offer</Badge>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{promotion.name}</h3>

            <p className="text-emerald-100 mb-4 max-w-lg">{promotion.description}</p>

            {/* Included webinars list */}
            <div className="space-y-2 mb-4">
              {includedWebinars.slice(0, 4).map((webinar) => (
                <div key={webinar.id} className="flex items-center gap-2 text-white/90">
                  <Check className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span className="text-sm">
                    {webinar.shortTitle}
                    {webinar.status === "active" && webinar.price > 0 && (
                      <span className="text-emerald-200 ml-2">({formatCurrency(webinar.price)} value)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {showCTA && (
              <Link href="/pricing">
                <Button className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold">
                  View Symposium Packages
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>

          {/* Right section - Savings highlight */}
          {savings > 0 && (
            <div className="flex flex-col items-center justify-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <p className="text-emerald-100 text-sm uppercase tracking-wide mb-1">Total Savings</p>
              <p className="text-3xl md:text-4xl font-bold text-white">{formatCurrency(savings)}</p>
              <p className="text-emerald-200 text-sm mt-1">FREE with any Symposium</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Badge component for individual items
export function FreeWithSymposiumBadge({ className = "" }: { className?: string }) {
  return (
    <Badge className={`bg-emerald-500 text-white border-0 ${className}`}>
      <Gift className="w-3 h-3 mr-1" />
      FREE with Symposium
    </Badge>
  )
}

// Small inline indicator
export function SymposiumBundleIndicator() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
      <Gift className="w-3 h-3" />
      Included in Symposium Bundle
    </span>
  )
}
