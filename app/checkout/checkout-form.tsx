"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { createOrderFromCart } from "@/app/actions/checkout"
import { useCart } from "@/lib/cart/cart-context"

interface CheckoutFormProps {
  defaultValues: {
    full_name: string
    email: string
    phone: string
    institution: string
    position: string
  }
  profileComplete: boolean
}

export function CheckoutForm({ defaultValues, profileComplete }: CheckoutFormProps) {
  const router = useRouter()
  const { refreshCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(defaultValues)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profileComplete) {
      toast.error("Complete your profile first", {
        description: "You must complete all required profile fields before placing an order.",
      })
      router.push("/profile")
      return
    }

    // Validate required fields
    if (!formData.full_name || !formData.email || !formData.phone || !formData.institution || !formData.position) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createOrderFromCart(formData)

      if (result.error) {
        toast.error("Checkout failed", {
          description: result.error,
        })
        setIsSubmitting(false)
        return
      }

      await refreshCart()

      toast.success("Order created successfully!")

      router.replace("/my-purchases")
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      toast.error("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          disabled={!profileComplete}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={!profileComplete}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
          disabled={!profileComplete}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="institution">Institution / Organization *</Label>
        <Input
          id="institution"
          name="institution"
          value={formData.institution}
          onChange={handleChange}
          required
          disabled={!profileComplete}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Position / Profession *</Label>
        <Input
          id="position"
          name="position"
          value={formData.position}
          onChange={handleChange}
          required
          disabled={!profileComplete}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !profileComplete}>
        {!profileComplete ? (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Complete Profile to Continue
          </>
        ) : isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Order...
          </>
        ) : (
          "Place Order"
        )}
      </Button>
    </form>
  )
}
