"use client"

import type React from "react"

import { useState, useImperativeHandle, forwardRef } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createOrderFromCart } from "@/app/actions/checkout"
import { useCart } from "@/lib/cart/cart-context"
import { ConfettiTrigger } from "@/components/confetti-trigger"

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

export interface CheckoutFormHandle {
  submit: () => Promise<void>
  isSubmitting: boolean
}

export const CheckoutForm = forwardRef<CheckoutFormHandle, CheckoutFormProps>(function CheckoutForm(
  { defaultValues, profileComplete },
  ref,
) {
  const router = useRouter()
  const { refreshCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(defaultValues)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async () => {
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

      setShowConfetti(true)

      toast.success("Order created successfully!")

      setTimeout(() => {
        if (result.data?.id) {
          router.replace(`/payment/order/${result.data.id}`)
        } else {
          router.replace("/my-purchases")
        }
      }, 1500)
    } catch (error) {
      console.error("[v0] Checkout error:", error)
      toast.error("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    isSubmitting,
  }))

  return (
    <>
      <ConfettiTrigger trigger={showConfetti} />

      <div className="space-y-4">
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
      </div>
    </>
  )
})
