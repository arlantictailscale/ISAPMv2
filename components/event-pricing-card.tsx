"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Tag, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { isBefore, parseISO } from "date-fns"
import { type EventPricing, formatPrice, EARLY_BIRD_DEADLINE } from "@/lib/data/event-pricing"
import { cn } from "@/lib/utils"

interface EventPricingCardProps {
  pricing: EventPricing
  colorScheme?: "purple" | "orange" | "cyan" | "emerald"
  showFullTable?: boolean
  className?: string
}

export function EventPricingCard({
  pricing,
  colorScheme = "orange",
  showFullTable = false,
  className,
}: EventPricingCardProps) {
  const [isExpanded, setIsExpanded] = useState(showFullTable)
  const isEarlyBirdPeriod = isBefore(new Date(), parseISO(EARLY_BIRD_DEADLINE))

  const colorClasses = {
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      badge: "bg-purple-100 text-purple-700",
      button: "bg-purple-600 hover:bg-purple-700",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      badge: "bg-orange-100 text-orange-700",
      button: "bg-orange-600 hover:bg-orange-700",
    },
    cyan: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-700",
      badge: "bg-cyan-100 text-cyan-700",
      button: "bg-cyan-600 hover:bg-cyan-700",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      badge: "bg-emerald-100 text-emerald-700",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
  }

  const colors = colorClasses[colorScheme]

  // Get minimum price for display
  const minEarlyBird = Math.min(...pricing.participantTypes.map((pt) => pt.earlyBirdPrice))
  const minNormal = Math.min(...pricing.participantTypes.map((pt) => pt.normalPrice))
  const hasMultiplePrices = pricing.participantTypes.length > 1

  return (
    <div className={cn("rounded-lg border p-4 transition-all duration-200", colors.bg, colors.border, className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Tag className={cn("h-4 w-4", colors.text)} />
            <span className={cn("text-sm font-semibold", colors.text)}>Registration Fee</span>
            {isEarlyBirdPeriod && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Early Bird Active
              </Badge>
            )}
          </div>

          {/* Compact price display */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn("text-xl font-bold", colors.text)}>
              {hasMultiplePrices ? "From " : ""}
              {formatPrice(isEarlyBirdPeriod ? minEarlyBird : minNormal)}
            </span>
            {isEarlyBirdPeriod && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(minNormal)}</span>
            )}
          </div>

          {hasMultiplePrices && <p className="text-xs text-muted-foreground mt-1">Prices vary by participant type</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Details
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded pricing table */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="pb-2 font-semibold text-foreground">Participant</th>
                  <th className="pb-2 font-semibold text-foreground text-right">
                    {isEarlyBirdPeriod ? "Early Bird" : "Normal"}
                  </th>
                  {isEarlyBirdPeriod && <th className="pb-2 font-semibold text-muted-foreground text-right">Normal</th>}
                  <th className="pb-2 font-semibold text-muted-foreground text-right">On-Site</th>
                </tr>
              </thead>
              <tbody>
                {pricing.participantTypes.map((pt) => (
                  <tr key={pt.id} className="border-t border-border/30">
                    <td className="py-2 text-foreground">{pt.label}</td>
                    <td className={cn("py-2 text-right font-semibold", colors.text)}>
                      {formatPrice(isEarlyBirdPeriod ? pt.earlyBirdPrice : pt.normalPrice)}
                    </td>
                    {isEarlyBirdPeriod && (
                      <td className="py-2 text-right text-muted-foreground line-through">
                        {formatPrice(pt.normalPrice)}
                      </td>
                    )}
                    <td className="py-2 text-right text-muted-foreground">{formatPrice(pt.onSitePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <Button asChild size="sm" className={cn("text-white", colors.button)}>
              <Link href={`/pricing?event=${pricing.id}`}>
                <Ticket className="h-4 w-4 mr-2" />
                Register Now
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline pricing badge for compact display
interface PricingBadgeProps {
  eventId: string
  pricing: EventPricing
  colorScheme?: "purple" | "orange" | "cyan" | "emerald"
}

export function PricingBadge({ eventId, pricing, colorScheme = "orange" }: PricingBadgeProps) {
  const isEarlyBirdPeriod = isBefore(new Date(), parseISO(EARLY_BIRD_DEADLINE))
  const minPrice = Math.min(
    ...pricing.participantTypes.map((pt) => (isEarlyBirdPeriod ? pt.earlyBirdPrice : pt.normalPrice)),
  )
  const hasMultiplePrices = pricing.participantTypes.length > 1

  const colorClasses = {
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  }

  return (
    <Badge variant="outline" className={cn("text-xs font-semibold", colorClasses[colorScheme])}>
      {hasMultiplePrices ? "From " : ""}
      {formatPrice(minPrice)}
    </Badge>
  )
}
