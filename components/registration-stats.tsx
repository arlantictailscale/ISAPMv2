"use client"

import { useState, useEffect } from "react"
import { getRegisteredCount } from "@/app/actions/public-stats"

interface RegistrationStatsProps {
  initialCount: number
}

export default function RegistrationStats({ initialCount }: RegistrationStatsProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const interval = setInterval(async () => {
      const newCount = await getRegisteredCount()
      if (newCount > 0) {
        setCount(newCount)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 to-primary/10 border-y border-primary/10">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Join the Community!</h3>
          <p className="text-muted-foreground text-base">
            Be part of the 8th National Meeting of ISAPM. Secure your spot today.
          </p>
        </div>
      </div>
    </section>
  )
}
