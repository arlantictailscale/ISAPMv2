"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tag, X, Loader2, Check, AlertCircle } from "lucide-react"
import { validatePromoCode, type PromoValidationResult, type CartItemDiscount } from "@/app/actions/promo-code"
import { cn } from "@/lib/utils"

interface PromoCodeInputProps {
  cartItems: Array<{
    id: string
    event_slug: string
    event_type: string
    price: number
    participant_type?: string
  }>
  onPromoApplied: (result: PromoValidationResult | null) => void
  appliedPromo: PromoValidationResult | null
}

export function PromoCodeInput({ cartItems, onPromoApplied, appliedPromo }: PromoCodeInputProps) {
  const [code, setCode] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleApplyPromo = () => {
    if (!code.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await validatePromoCode(code, cartItems)
      
      if (result.valid) {
        onPromoApplied(result)
        setCode("")
      } else {
        setError(result.error || "Invalid promo code")
      }
    })
  }

  const handleRemovePromo = () => {
    onPromoApplied(null)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleApplyPromo()
    }
  }

  if (appliedPromo?.valid && appliedPromo.promo_code) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-800">{appliedPromo.promo_code.code}</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  Applied
                </Badge>
              </div>
              <p className="text-sm text-green-600">{appliedPromo.promo_code.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemovePromo}
            className="text-green-600 hover:text-green-800 hover:bg-green-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Show discount breakdown */}
        {appliedPromo.item_discounts && appliedPromo.item_discounts.some(d => d.discount_amount > 0) && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Discount Applied:</p>
            {appliedPromo.item_discounts
              .filter(d => d.discount_amount > 0)
              .map((discount, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {discount.rule_description || discount.event_slug}
                  </span>
                  <span className="text-green-600 font-medium">
                    -Rp {discount.discount_amount.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            className={cn(
              "pl-9 uppercase",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            disabled={isPending}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApplyPromo}
          disabled={isPending || !code.trim()}
          className="shrink-0"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </Button>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
