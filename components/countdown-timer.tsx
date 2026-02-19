"use client"

import { useEffect, useState } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const calculateTimeLeft = () => {
      const eventDate = new Date("2026-04-16T00:00:00").getTime()
      const now = new Date().getTime()
      const difference = eventDate - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return null
  }

  const TimerBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white text-cyan-500 rounded-lg p-2 sm:p-4 md:p-6 min-w-16 sm:min-w-20 md:min-w-24 shadow-lg">
        <p className="text-xl sm:text-2xl md:text-4xl font-bold font-mono text-center">{String(value).padStart(2, "0")}</p>
      </div>
      <p className="text-xs sm:text-sm md:text-base font-semibold text-white mt-1 sm:mt-2 uppercase tracking-wide">{label}</p>
    </div>
  )

  return (
    <div className="flex justify-center gap-2 sm:gap-3 md:gap-6 max-w-full px-4">
      <TimerBox value={timeLeft.days} label="Days" />
      <TimerBox value={timeLeft.hours} label="Hours" />
      <TimerBox value={timeLeft.minutes} label="Minutes" />
      <TimerBox value={timeLeft.seconds} label="Seconds" />
    </div>
  )
}
