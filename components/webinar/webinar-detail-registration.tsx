"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingCart, CheckCircle2, Video, Award, PlayCircle, FileText, MessageCircle } from "lucide-react"
import { addToCart } from "@/app/actions/cart"
import { createBrowserClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/data/event-pricing"
import { toast } from "sonner"
import type { Webinar } from "@/lib/data/webinars"

interface WebinarDetailRegistrationProps {
  webinar: Webinar
}

export function WebinarDetailRegistration({ webinar }: WebinarDetailRegistrationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAdded, setIsAdded] = useState(false)
  const [debugMsg, setDebugMsg] = useState("")

  useEffect(() => {
    if (isAdded) {
      const timer = setTimeout(() => setIsAdded(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isAdded])

  async function handleRegister() {
    console.log("[v0] handleRegister called")
    setDebugMsg("Button clicked...")

    try {
      const supabase = createBrowserClient()
      console.log("[v0] Getting user")
      setDebugMsg("Getting user...")

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.log("[v0] Auth error:", authError)
        setDebugMsg("Auth error: " + authError.message)
        return
      }

      console.log("[v0] User:", user?.id || "Not logged in")

      if (!user) {
        console.log("[v0] Redirecting to login")
        setDebugMsg("Redirecting to login...")
        router.push(`/auth/login?redirect=/webinar/${webinar.slug}`)
        return
      }

      setDebugMsg("Adding to cart...")

      const cartItem = {
        item_type: "webinar" as const,
        event_id: webinar.id,
        event_label: webinar.title,
        participant_type: "general",
        unit_price: webinar.price,
        currency: webinar.currency || "IDR",
        quantity: 1,
      }

      console.log("[v0] Cart item:", cartItem)

      const result = await addToCart(cartItem)

      console.log("[v0] Result:", result)
      setDebugMsg("Result: " + JSON.stringify(result))

      if (result.data) {
        setIsAdded(true)
        toast.success("Added to Cart", {
          description: `${webinar.shortTitle} has been added to your cart.`,
        })
      } else if (result.error) {
        toast.error("Error", {
          description: result.error,
        })
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      setDebugMsg("Error: " + String(error))
      toast.error("Error", {
        description: "Something went wrong. Please try again.",
      })
    }
  }

  function onButtonClick() {
    console.log("[v0] Button onClick fired")
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
          {/* Debug display - remove after testing */}
          {debugMsg && <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-sm">Debug: {debugMsg}</div>}

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

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isAdded ? (
                  <Button onClick={goToCart} className="flex-1 bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Added! View Cart
                  </Button>
                ) : (
                  <Button type="button" onClick={onButtonClick} disabled={isPending} className="flex-1" size="lg">
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Register Now
                      </>
                    )}
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
    </section>
  )
}
