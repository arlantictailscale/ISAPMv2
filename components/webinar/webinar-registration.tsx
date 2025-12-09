"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle, ShoppingCart, Loader2, AlertCircle } from "lucide-react"
import { addToCart } from "@/app/actions/cart"
import { createClient } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/data/event-pricing"

const webinarDetails = {
  id: "webinar_equity_pain",
  label: "Webinar: Achieving Equity in Pain Management Services in Indonesia",
  price: 100000,
  currency: "IDR",
}

const benefits = [
  "Access to live webinar session",
  "Q&A session with expert speakers",
  "Digital certificate of attendance",
  "Recording access for 7 days",
  "Presentation materials (PDF)",
]

export function WebinarRegistration() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAddToCart = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to login with return URL
        router.push(`/auth/login?redirect=/webinar`)
        return
      }

      // Add webinar to cart
      const result = await addToCart({
        item_type: "webinar",
        event_id: webinarDetails.id,
        event_label: webinarDetails.label,
        participant_type_id: "general",
        participant_type_label: "General Participant",
        unit_price: webinarDetails.price,
        currency: webinarDetails.currency,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        // Redirect to cart after short delay
        setTimeout(() => {
          router.push("/cart")
        }, 1500)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("[v0] Error adding webinar to cart:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="registration" className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">Register for the Webinar</h2>
          <p className="text-muted-foreground">
            Secure your spot and gain access to this valuable learning opportunity
          </p>
        </div>

        <Card className="overflow-hidden border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
            <CardTitle className="text-xl">Webinar Registration</CardTitle>
            <CardDescription>Friday, January 30, 2026 | 13:00 WIB</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Benefits */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">What you'll get:</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price & Action */}
              <div className="flex flex-col justify-center">
                <div className="bg-muted/50 rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Registration Fee</p>
                  <p className="text-4xl font-bold text-primary mb-6">{formatPrice(webinarDetails.price)}</p>

                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm mb-4 justify-center">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success ? (
                    <div className="flex items-center gap-2 text-primary justify-center">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Added to cart! Redirecting...</span>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      onClick={handleAddToCart}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Register Now
                        </>
                      )}
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground mt-4">
                    By registering, you agree to our terms and conditions
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            After adding to cart, proceed to checkout and complete payment via bank transfer.
            <br />
            You will receive a confirmation email with the webinar link after payment verification.
          </p>
        </div>
      </div>
    </section>
  )
}
