"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
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
    <section className="py-8 bg-gradient-to-r from-primary/5 to-primary/10 border-y border-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-primary/20">
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-bold text-primary tabular-nums leading-none">{count.toLocaleString()}</div>
              <div className="text-sm font-medium text-muted-foreground">Registered Accounts</div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">Join the Community!</h3>
            <p className="text-muted-foreground text-sm mb-3 max-w-md">
              Be part of the 8th National Meeting of ISAPM. Secure your spot today.
            </p>
            <Link href="/pricing">
              <Button size="default" className="font-semibold shadow-md hover:shadow-lg transition-all">
                Register Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
