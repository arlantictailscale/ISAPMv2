"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, CreditCard, Hotel, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@supabase/ssr"

export function MobileBottomNav() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [participantCardUrl, setParticipantCardUrl] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Fetch participant card URL for a given user id (non-blocking)
    const fetchCardUrl = async (userId: string) => {
      try {
        const { data: card } = await supabase
          .from("participant_cards")
          .select("order_id")
          .eq("user_id", userId)
          .order("issued_at", { ascending: false })
          .limit(1)
          .single()

        if (card?.order_id) {
          setParticipantCardUrl(`/my-events/participant-card/${card.order_id}`)
        }
      } catch {
        // Silently fail - card URL is optional
      }
    }

    // Safety timeout - ensures nav renders even if Supabase completely fails
    const safetyTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    // Use onAuthStateChange as primary source - fires IMMEDIATELY with INITIAL_SESSION
    // This is more reliable than getSession() which can hang on slow mobile networks
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      clearTimeout(safetyTimeout)
      
      if (session?.user) {
        setIsLoggedIn(true)
        setIsLoading(false)
        // Fetch card URL in background - don't block nav render
        fetchCardUrl(session.user.id)
      } else {
        setIsLoggedIn(false)
        setParticipantCardUrl(null)
        setIsLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  if (isLoading || !isLoggedIn) {
    return null
  }

  // Build nav items with dynamic participant card URL
  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/my-events", icon: CalendarDays, label: "My Events" },
    ...(participantCardUrl ? [{ href: participantCardUrl, icon: CreditCard, label: "My Card" }] : []),
    { href: "/my-hotels", icon: Hotel, label: "Hotel" },
    { href: "/my-purchases", icon: Receipt, label: "Purchases" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-safe md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                isActive ? "text-teal-600" : "text-gray-500 hover:text-gray-900",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className={cn("font-medium", isActive && "font-semibold")}>{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-teal-600" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
