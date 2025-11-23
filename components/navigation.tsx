"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Menu,
  X,
  LogOut,
  User,
  FileText,
  Users,
  Presentation,
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Calendar,
  CheckCircle,
  Settings,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CartIcon } from "@/components/cart/cart-icon"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("user")
  const [isScrolled, setIsScrolled] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          try {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .maybeSingle()

            if (error) {
              console.error("[v0] Error fetching user role:", error.message)
              // Default to 'user' role if database fails
              setUserRole("user")
            } else if (profile?.role) {
              setUserRole(profile.role)
            } else {
              setUserRole("user")
            }
          } catch (profileError) {
            console.error("[v0] Failed to fetch profile, using default role:", profileError)
            // Gracefully fallback to 'user' role if Supabase is down
            setUserRole("user")
          }
        }
      } catch (authError) {
        console.error("[v0] Auth check failed:", authError)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription?.unsubscribe()
  }, [supabase])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Events", href: "/events" },
    { label: "e-Poster", href: "/call-for-papers" },
    { label: "Venue", href: "/venue" },
  ]

  return (
    <nav
      className={`fixed top-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/98 border-b border-border shadow-md" : "bg-background/60 border-b border-border/50"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/isapm-logo.png" alt="ISAPM Logo" width={40} height={40} className="w-10 h-10" />
            <span className="font-display text-xl font-bold text-primary inline whitespace-nowrap">ISAPM 2026</span>
          </Link>

          <div className="hidden md:flex flex-grow justify-end items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/pricing">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Register Now
              </Button>
            </Link>
            <div className="flex gap-3 items-center">
              {!isLoading && user && <CartIcon />}
              {!isLoading && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href="/dashboard">
                      <DropdownMenuItem>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem>
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/my-events">
                      <DropdownMenuItem>
                        <Calendar className="w-4 h-4 mr-2" />
                        My Events
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/my-posters">
                      <DropdownMenuItem>
                        <FileText className="w-4 h-4 mr-2" />
                        My E-Posters
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/my-purchases">
                      <DropdownMenuItem>
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        My Purchases
                      </DropdownMenuItem>
                    </Link>
                    {userRole === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href="/admin/users">
                          <DropdownMenuItem className="text-primary">
                            <Users className="w-4 h-4 mr-2" />
                            User Management (Admin)
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin/payment-validation">
                          <DropdownMenuItem className="text-primary">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Payment Validation (Admin)
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin/posters">
                          <DropdownMenuItem className="text-primary">
                            <Presentation className="w-4 h-4 mr-2" />
                            E-Poster Submissions (Admin)
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin/confirmed-attendees">
                          <DropdownMenuItem className="text-primary">
                            <Users className="w-4 h-4 mr-2" />
                            Confirmed Attendees (Admin)
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin/room-availability">
                          <DropdownMenuItem className="text-primary">
                            <Settings className="w-4 h-4 mr-2" />
                            Room Availability (Admin)
                          </DropdownMenuItem>
                        </Link>
                        <Link href="/admin/carts">
                          <DropdownMenuItem className="text-primary">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Cart Management (Admin)
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex justify-end items-center gap-2 md:hidden">
            {!isLoading && user && <CartIcon />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg text-center"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <Link href="/pricing" className="block mx-2" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Register Now
              </Button>
            </Link>

            <div className="border-t border-border pt-4 space-y-2">
              {!isLoading && user ? (
                <>
                  <Link
                    href="/cart"
                    className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <ShoppingCart className="w-4 h-4 inline mr-2" />
                    My Cart
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/my-events"
                    className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    My Events
                  </Link>
                  <Link
                    href="/my-posters"
                    className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    My E-Posters
                  </Link>
                  <Link
                    href="/my-purchases"
                    className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    My Purchases
                  </Link>
                  {userRole === "admin" && (
                    <>
                      <Link
                        href="/admin/users"
                        className="block px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        User Management (Admin)
                      </Link>
                      <Link
                        href="/admin/payment-validation"
                        className="block px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        Payment Validation (Admin)
                      </Link>
                      <Link
                        href="/admin/posters"
                        className="block px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        E-Poster Submissions (Admin)
                      </Link>
                      <Link
                        href="/admin/confirmed-attendees"
                        className="block px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        Confirmed Attendees (Admin)
                      </Link>
                      <Link
                        href="/admin/room-availability"
                        className="block px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        Room Availability (Admin)
                      </Link>
                      <Link
                        href="/admin/carts"
                        className="block px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        Cart Management (Admin)
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-center"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
