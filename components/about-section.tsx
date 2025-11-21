"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

export default function AboutSection() {
  const { ref: mainRef, isVisible: mainVisible } = useScrollAnimation()
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation()

  return (
    null
  )
}
