"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { differenceInSeconds, parseISO } from "date-fns"

interface FlipBookSectionProps {
  registeredCount: number
}

export default function FlipBookSection({ registeredCount }: FlipBookSectionProps) {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    setMounted(true)
    const targetDate = parseISO("2026-04-16T00:00:00")

    const timer = setInterval(() => {
      const now = new Date()
      const diffInSeconds = differenceInSeconds(targetDate, now)

      if (diffInSeconds <= 0) {
        clearInterval(timer)
        return
      }

      const days = Math.floor(diffInSeconds / (3600 * 24))
      const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600)
      const minutes = Math.floor((diffInSeconds % 3600) / 60)
      const seconds = diffInSeconds % 60

      setTimeLeft({ days, hours, minutes, seconds })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  if (!mounted) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="w-full max-w-5xl mx-auto mb-12 h-[600px] bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8"></div>

        <div className="w-full max-w-5xl mx-auto mb-12">
          <iframe
            allowFullScreen
            allow="clipboard-write"
            scrolling="no"
            className="w-full border border-border rounded-lg shadow-lg"
            src="https://heyzine.com/flip-book/1720ce36c8.html"
            style={{ height: "600px" }}
            title="Conference Flip Book"
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
            <div className="bg-primary/5 p-4 rounded-lg min-w-[100px]">
              <div className="text-3xl md:text-4xl font-bold text-primary" suppressHydrationWarning>
                {timeLeft.days}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Days</div>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg min-w-[100px]">
              <div className="text-3xl md:text-4xl font-bold text-primary" suppressHydrationWarning>
                {timeLeft.hours}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Hours</div>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg min-w-[100px]">
              <div className="text-3xl md:text-4xl font-bold text-primary" suppressHydrationWarning>
                {timeLeft.minutes}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Minutes</div>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg min-w-[100px]">
              <div className="text-3xl md:text-4xl font-bold text-primary" suppressHydrationWarning>
                {timeLeft.seconds}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Seconds</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
            <p className="text-lg md:text-xl text-muted-foreground text-center">
              Don't miss out on the 8th National Meeting!
            </p>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 w-full max-w-md">
              {/* Register Now Button */}
              <Link href="/pricing" className="flex-1">
                <Button
                  size="lg"
                  className="w-full h-full min-h-[72px] text-lg md:text-xl px-6 py-4 font-bold animate-pulse rounded-xl shadow-md"
                >
                  Register Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
