"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Bell,
  CheckCircle2,
  ShoppingCart,
  Loader2,
  User,
  LogIn,
  ShoppingBag,
} from "lucide-react"
import { type Webinar, formatWebinarDate, getWebinarPricing } from "@/lib/data/webinars"
import { formatPrice } from "@/lib/data/event-pricing"
import { addToCart } from "@/app/actions/cart"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useCart } from "@/lib/cart/cart-context"

interface WebinarCardProps {
  webinar: Webinar
  index: number
  onViewDetails?: () => void
}

export function WebinarCard({ webinar, index, onViewDetails }: WebinarCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdding, setIsAdding] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { refreshCart } = useCart()

  const isActive = webinar.status === "active"
  const isComingSoon = webinar.status === "coming_soon"
  const isSoldOut = webinar.status === "sold_out"

  const handleAddToCart = async () => {
    setIsAdding(true)

    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsAdding(false)
        setShowLoginPrompt(true)
        return
      }

      const pricing = getWebinarPricing(webinar.id)
      if (!pricing) {
        toast.error("Pricing information not available")
        setIsAdding(false)
        return
      }

      const cartItem = {
        item_type: "webinar" as const,
        event_id: webinar.id,
        event_label: webinar.title,
        participant_type_id: "general",
        participant_type_label: "General Admission",
        unit_price: pricing.price,
        currency: "IDR",
      }

      const result = await addToCart(cartItem)

      if (result.error) {
        if (result.error === "This item is already in your cart") {
          toast.info("Already in Cart", {
            description: `${webinar.shortTitle || webinar.title} is already in your cart.`,
            icon: <ShoppingBag className="w-4 h-4" />,
            action: {
              label: "View Cart",
              onClick: () => router.push("/cart"),
            },
          })
        } else {
          toast.error(result.error)
        }
      } else if (result.data) {
        await refreshCart()
        toast.success("Added to cart!", {
          description: webinar.shortTitle || webinar.title,
        })
      }
    } catch (error) {
      console.error("Error in handleAddToCart:", error)
      toast.error("Failed to add to cart")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <Card
        className={`group relative overflow-hidden transition-all duration-300 ${
          isActive
            ? "border-primary/20 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            : "border-muted bg-muted/30"
        }`}
      >
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          {isActive && (
            <Badge className="bg-green-500 text-white border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Open Registration
            </Badge>
          )}
          {isComingSoon && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
              <Bell className="w-3 h-3 mr-1" />
              Coming Soon
            </Badge>
          )}
          {isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
        </div>

        {/* Webinar Number Indicator */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
            }`}
          >
            {index + 1}
          </div>
        </div>

        <CardContent className="p-6 pt-16">
          {/* Title */}
          <h3
            className={`text-xl font-bold mb-3 line-clamp-2 ${isActive ? "text-foreground" : "text-muted-foreground"}`}
          >
            {isActive ? webinar.shortTitle : webinar.title}
          </h3>

          {/* Description */}
          <p className={`text-sm mb-4 line-clamp-3 ${isActive ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
            {webinar.description}
          </p>

          {/* Date & Time for Active Webinars */}
          {isActive && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formatWebinarDate(webinar.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  {webinar.time} {webinar.timezone} ({webinar.duration})
                </span>
              </div>
              {webinar.speakers.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{webinar.speakers.length} Expert Speakers</span>
                </div>
              )}
            </div>
          )}

          {/* Speaker Avatars for Active Webinars */}
          {isActive && webinar.speakers.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {webinar.speakers.slice(0, 4).map((speaker) => (
                  <div key={speaker.id} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                    <Image
                      src={speaker.image || "/placeholder.svg"}
                      alt={speaker.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {webinar.speakers.length > 4 ? `+${webinar.speakers.length - 4} more` : "speakers"}
              </span>
            </div>
          )}

          {/* Tags for Active Webinars */}
          {isActive && webinar.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {webinar.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-4 border-t">
            {isActive ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Registration Fee</p>
                  <p className="text-lg font-bold text-primary">{formatPrice(webinar.price)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="border-primary/30 hover:bg-primary/10 bg-transparent"
                  >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                    <span className="ml-1 hidden sm:inline">Add to Cart</span>
                  </Button>
                  <Button size="sm" className="group/btn" onClick={onViewDetails}>
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-lg font-medium text-muted-foreground">TBD</p>
                </div>
                <Button variant="outline" disabled>
                  <Bell className="w-4 h-4 mr-1" />
                  Notify Me
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Sign In Required</DialogTitle>
            <DialogDescription className="text-center">
              Please sign in or create an account to add items to your cart and complete your registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              className="w-full"
              onClick={() => {
                setShowLoginPrompt(false)
                router.push(`/auth/login?redirect=/webinar`)
              }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                setShowLoginPrompt(false)
                router.push(`/auth/sign-up?redirect=/webinar`)
              }}
            >
              <User className="w-4 h-4 mr-2" />
              Create Account
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Creating an account only takes a minute and gives you access to exclusive webinar content.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
