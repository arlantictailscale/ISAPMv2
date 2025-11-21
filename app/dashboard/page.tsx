"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, ClipboardList, FileText, Users, Presentation, Hotel } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface UserProfile {
  id: string
  role: string
  first_name: string
  last_name: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, role, first_name, last_name")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("[v0] Error fetching profile:", error)
        toast.error("Failed to load profile")
        return
      }

      setProfile(profileData)
    } catch (err) {
      console.error("[v0] Error checking auth:", err)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const isAdmin = profile?.role === "admin"

  const userCards = [
    {
      title: "My Profile",
      description: "View and update your personal information",
      icon: User,
      href: "/profile",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "My E-Posters",
      description: "Manage your poster submissions",
      icon: FileText,
      href: "/my-posters",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "My Purchases",
      description: "View all your CPD courses and hotel bookings",
      icon: ClipboardList,
      href: "/my-purchases",
      color: "from-green-500 to-green-600",
    },
  ]

  const adminCards = [
    {
      title: "User Management",
      description: "View and manage user roles",
      icon: Users,
      href: "/admin/users",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "E-Poster Submissions",
      description: "Review poster submissions",
      icon: Presentation,
      href: "/admin/posters",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      title: "Hotel Booking Management",
      description: "Review and approve hotel bookings",
      icon: Hotel,
      href: "/admin/hotel-bookings",
      color: "from-orange-500 to-orange-600",
    },
  ]

  const allCards = isAdmin ? adminCards : userCards

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">
              Welcome back, {profile?.first_name || "User"}!
            </h1>
            <p className="text-lg text-muted-foreground">
              {isAdmin ? "Admin Dashboard - Manage the conference" : "Access your conference information"}
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allCards.map((card) => {
                const Icon = card.icon
                return (
                  <Link key={card.href} href={card.href}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                      <CardHeader>
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{card.title}</CardTitle>
                        <CardDescription className="text-base">{card.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
                          View details
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
