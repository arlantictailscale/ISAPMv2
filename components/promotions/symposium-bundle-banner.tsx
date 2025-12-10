"use client"

import { Gift, ArrowRight, Check } from "lucide-react"
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

  if (variant === "minimal") {
    return (
      <Badge
        variant="outline"
        className={`text-emerald-600 border-emerald-200 bg-emerald-50/50 font-normal ${className}`}
      >
        <Gift className="w-3 h-3 mr-1" />
        +4 Webinars included
      </Badge>
    )
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full shrink-0">
          <Gift className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700">
            Symposium includes <span className="font-medium text-emerald-600">4 webinars</span> at no extra cost
          </p>
        </div>
        {savings > 0 && <span className="text-sm text-slate-500 shrink-0">{formatCurrency(savings)} value</span>}
      </div>
    )
  }

  return (
    <Card className={`bg-slate-50 border border-slate-200 ${className}`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Left section - Main content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                <Gift className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">{promotion.name}</h3>
            </div>

            <p className="text-slate-600 mb-4 max-w-lg">{promotion.description}</p>

            {/* Included webinars list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {includedWebinars.slice(0, 4).map((webinar) => (
                <div key={webinar.id} className="flex items-center gap-2 text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm">{webinar.shortTitle}</span>
                </div>
              ))}
            </div>

            {showCTA && (
              <Link href="/pricing">
                <Button variant="outline" size="sm" className="text-slate-600 hover:text-slate-800 bg-transparent">
                  View Symposium Packages
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>

          {/* Right section - Savings (subtle) */}
          {savings > 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-4 bg-white rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Bundle Value</p>
              <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(savings)}</p>
              <p className="text-xs text-slate-500 mt-1">included with Symposium</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export function FreeWithSymposiumBadge({ className = "" }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-emerald-600 border-emerald-200 bg-emerald-50/50 font-normal ${className}`}
    >
      <Gift className="w-3 h-3 mr-1" />
      Included with Symposium
    </Badge>
  )
}

export function SymposiumBundleIndicator() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <Gift className="w-3 h-3 text-emerald-500" />
      Included with Symposium
    </span>
  )
}
