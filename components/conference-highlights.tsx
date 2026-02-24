"use client"

import { Users, Clock, MapPin, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

const highlights = [
  {
    icon: Users,
    title: "Expert Faculty",
    description: "Leading anesthesiologists and pain management specialists from Indonesia and abroad",
  },
  {
    icon: Clock,
    title: "3 Days of Learning",
    description: "Comprehensive program with keynotes, workshops, and interactive sessions",
  },
  {
    icon: MapPin,
    title: "Prime Location",
    description: "The Singhasari Hotel & Convention Batu in the heart of East Java",
  },
  {
    icon: Sparkles,
    title: "Cutting-Edge Topics",
    description: "Latest advances in pain management and anesthesia practices",
  },
]

export default function ConferenceHighlights() {
  const { ref, isVisible } = useScrollAnimation()

  return (
    null
  )
}
