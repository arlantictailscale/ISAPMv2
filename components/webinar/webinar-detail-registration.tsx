"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ShoppingCart,
  CheckCircle2,
  Video,
  Award,
  PlayCircle,
  FileText,
  MessageCircle,
  User,
  LogIn,
} from "lucide-react"
import { addToCart } from "@/app/actions/cart"
import { createBrowserClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/data/event-pricing"
import { toast } from "sonner"
import { useCart } from "@/lib/cart/cart-context"
import type { Webinar } from "@/lib/data/webinars"

interface WebinarDetailRegistrationProps {
  webinar: Webinar
}

type ButtonState = "idle" | "loading" | "success"

export function WebinarDetailRegistration({ webinar }: WebinarDetailRegistrationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [buttonState, setButtonState] = useState<ButtonState>("idle")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { refreshCart } = useCart()

  useEffect(() => {
    if (buttonState === "success") {
      const timer = setTimeout(() => setButtonState("idle"), 3000)
      return () => clearTimeout(timer)
    }
  }, [buttonState])

  async function handleRegister() {
    console.log("[v0] handleRegister called")
    setButtonState("loading")

    try {
      const supabase = createBrowserClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      console.log("[v0] Auth check - user:", user, "error:", authError)

      if (authError) {
        console.log("[v0] Auth error:", authError)
        setButtonState("idle")
        return
      }

      if (!user) {
        console.log("[v0] No user found, showing login prompt")
        setButtonState("idle")
        setShowLoginPrompt(true)
        return
      }

      const cartItem = {
        item_type: "webinar" as const,
        event_id: webinar.id,
        event_label: webinar.title,
        participant_type_id: "general",
        participant_type_label: "General Admission",
        unit_price: webinar.price,
        currency: webinar.currency || "IDR",
      }

      const result = await addToCart(cartItem)

      if (result.data) {
        setButtonState("success")
        await refreshCart()
        toast.success("Added to Cart", {
          description: `${webinar.shortTitle} has been added to your cart.`,
        })
      } else if (result.error) {
        setButtonState("idle")
        toast.error("Error", {
          description: result.error,
        })
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      setButtonState("idle")
      toast.error("Error", {
        description: "Something went wrong. Please try again.",
      })
    }
  }

  function onButtonClick() {
    if (buttonState !== "idle") return
    startTransition(() => {
      handleRegister()
    })
  }

  const goToCart = () => {
    router.push("/cart")
  }

  return (
    <section id="register" className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-white/20 text-white border-0 mb-2">Limited Spots</Badge>
                  <CardTitle className="text-2xl">Register Now</CardTitle>
                  <p className="text-white/80 mt-1">Secure your spot for this exclusive webinar</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">Registration Fee</p>
                  <p className="text-3xl font-bold">{formatPrice(webinar.price)}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* What's Included */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">{"What's Included:"}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4 text-primary" />
                    <span>Live Webinar Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <span>Q&A Session</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-primary" />
                    <span>Certificate</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <PlayCircle className="w-4 h-4 text-primary" />
                    <span>30-Day Recording</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Presentation Slides</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {buttonState === "success" ? (
                  <Button
                    onClick={goToCart}
                    className="flex-1 bg-green-500 hover:bg-green-600 relative overflow-hidden group animate-success-pulse"
                    size="lg"
                  >
                    {/* Success particles */}
                    <span className="absolute inset-0 pointer-events-none">
                      <span className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-[particle1_0.6s_ease-out_forwards]" />
                      <span className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-[particle2_0.6s_ease-out_forwards]" />
                      <span className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-[particle3_0.6s_ease-out_forwards]" />
                      <span className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full animate-[particle4_0.6s_ease-out_forwards]" />
                    </span>
                    <CheckCircle2 className="w-5 h-5 mr-2 animate-[bounceIn_0.5s_ease-out]" />
                    <span className="animate-[fadeIn_0.3s_ease-out]">Added! View Cart</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={onButtonClick}
                    disabled={buttonState === "loading" || isPending}
                    className="flex-1 relative overflow-hidden group transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
                    size="lg"
                  >
                    {/* Loading progress bar */}
                    {buttonState === "loading" && (
                      <span className="absolute bottom-0 left-0 h-1 bg-white/30 animate-[loadingProgress_1.5s_ease-in-out_infinite]" />
                    )}

                    {/* Button content */}
                    <span className="relative flex items-center justify-center">
                      {buttonState === "loading" ? (
                        <>
                          {/* Animated cart with item dropping in */}
                          <span className="relative w-5 h-5 mr-2">
                            <ShoppingCart className="w-5 h-5 animate-[cartWiggle_0.5s_ease-in-out_infinite]" />
                            <span className="absolute -top-1 left-1/2 w-2 h-2 bg-white rounded-sm animate-[dropIn_0.6s_ease-in-out_infinite]" />
                          </span>
                          <span className="animate-pulse">Adding...</span>
                          {/* Loading dots */}
                          <span className="ml-1 flex gap-0.5">
                            <span
                              className="w-1 h-1 bg-white rounded-full animate-[loadingDot_1s_ease-in-out_infinite]"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="w-1 h-1 bg-white rounded-full animate-[loadingDot_1s_ease-in-out_infinite]"
                              style={{ animationDelay: "200ms" }}
                            />
                            <span
                              className="w-1 h-1 bg-white rounded-full animate-[loadingDot_1s_ease-in-out_infinite]"
                              style={{ animationDelay: "400ms" }}
                            />
                          </span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-5deg]" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </span>
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By registering, you agree to our terms of service and privacy policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

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
                router.push(`/auth/login?redirect=/webinar/${webinar.slug}`)
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
                router.push(`/auth/sign-up?redirect=/webinar/${webinar.slug}`)
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
    </section>
  )
}
