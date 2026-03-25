"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
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
  Receipt,
  Video,
  Building2,
  ChevronDown,
  Shield,
  Mail,
  Gift,
  BookOpen,
  BedDouble,
  UserCheck,
  FolderOpen,
  Hotel,
  RefreshCw,
  Send,
  BarChart3,
  Tag,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { CartIcon } from "@/components/cart/cart-icon"

const adminNavItems = [
  { label: "Events Dashboard", href: "/admin/events", icon: Calendar },
  { label: "Payment Validation", href: "/admin/payment-validation", icon: CheckCircle },
  { label: "Cart Management", href: "/admin/carts", icon: ShoppingCart },
  { label: "Invoice Management", href: "/admin/invoices", icon: Receipt },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Confirmed Attendees", href: "/admin/confirmed-attendees", icon: UserCheck },
  { label: "Event CMS", href: "/admin/event-cms", icon: FolderOpen },
  { label: "Webinar CMS", href: "/admin/webinar-cms", icon: BookOpen },
  { label: "E-Poster Submissions", href: "/admin/posters", icon: Presentation },
  { label: "Symposium Webinar Access", href: "/admin/symposium-webinar-access", icon: Gift },
  { label: "Hotel Management", href: "/admin/hotel-management", icon: Hotel },
  { label: "Room Availability", href: "/admin/room-availability", icon: BedDouble },
  { label: "Email Test", href: "/admin/email-test", icon: Mail },
{ label: "Email Broadcast", href: "/admin/email-broadcast", icon: Send },
{ label: "Event Quotas", href: "/admin/event-quotas", icon: BarChart3 },
{ label: "Promo Codes", href: "/admin/promo-codes", icon: Tag },
]

const navItems = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Webinar", href: "/webinar" },
  { label: "e-Poster", href: "/call-for-papers" },
  { label: "Venue", href: "/venue" },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authTimedOut, setAuthTimedOut] = useState(false)
  const [userRole, setUserRole] = useState<string>("user")
  const [isScrolled, setIsScrolled] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const isMounted = useRef(true)
  const maxRetries = 2 // Limit retries to prevent infinite loop

  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const isAdmin = useMemo(() => userRole === "admin", [userRole])



  const fetchUserRole = useCallback(
    async (userId: string) => {
      try {
        const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()

        if (error) {
          console.error("Error fetching user role:", error.message)
          return "user"
        }
        return profile?.role || "user"
      } catch (profileError) {
        console.error("Failed to fetch profile:", profileError)
        return "user"
      }
    },
    [supabase],
  )

  const checkUser = useCallback(async () => {
    if (!isMounted.current) return

    setIsLoading(true)
    setAuthTimedOut(false)

    try {
      // Detect mobile for longer timeout (mobile browsers are slower)
      const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== "undefined" ? navigator.userAgent : ""
      )
      // Mobile needs longer timeout due to slower JS execution
      const timeout = isMobile ? 5000 : 2000
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeout))
      
      const sessionResult = await Promise.race([sessionPromise, timeoutPromise])

      if (!isMounted.current) return

      if (sessionResult && sessionResult.data?.session?.user) {
        const sessionUser = sessionResult.data.session.user
        setUser(sessionUser)
        setIsLoading(false)
        setAuthTimedOut(false)
        // Clear reload flag on successful auth
        sessionStorage.removeItem("isapm_auth_reloaded")

        // Check sessionStorage cache for role first (avoids DB call)
        const cachedRole = sessionStorage.getItem(`user_role_${sessionUser.id}`)
        const cacheTime = sessionStorage.getItem(`user_role_time_${sessionUser.id}`)
        const isCacheValid = cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000 // 5 min cache

        if (cachedRole && isCacheValid) {
          setUserRole(cachedRole)
        } else {
          // Fetch and cache role
          fetchUserRole(sessionUser.id).then((role) => {
            if (isMounted.current) {
              setUserRole(role)
              sessionStorage.setItem(`user_role_${sessionUser.id}`, role)
              sessionStorage.setItem(`user_role_time_${sessionUser.id}`, Date.now().toString())
            }
          })
        }
        // Removed redundant getUser() call - middleware already validates sessions
      } else if (sessionResult === null) {
        if (isMounted.current) {
          setAuthTimedOut(true)
          setIsLoading(false)
        }
      } else {
        setUser(null)
        setIsLoading(false)
        setAuthTimedOut(false)
        // Clear reload flag - auth check completed (even if no session)
        sessionStorage.removeItem("isapm_auth_reloaded")
      }
    } catch (authError) {
      console.error("Auth check failed:", authError)
      if (isMounted.current) {
        setAuthTimedOut(true)
        setIsLoading(false)
      }
    }
  }, [supabase, fetchUserRole])

  useEffect(() => {
    if (!authTimedOut) return

    // On first timeout, try a page reload (which helps on mobile Chrome)
    // Use sessionStorage to track if we've already tried reloading this session
    const hasReloadedKey = "isapm_auth_reloaded"
    const hasReloaded = sessionStorage.getItem(hasReloadedKey)

    if (!hasReloaded) {
      // First timeout - try reloading the page (bypasses some mobile browser cache issues)
      sessionStorage.setItem(hasReloadedKey, "true")
      // Small delay to allow any pending operations to complete
      setTimeout(() => {
        if (isMounted.current) {
          window.location.reload()
        }
      }, 500)
      return
    }

    // Already reloaded once this session, try soft retry
    if (retryCount < maxRetries) {
      const retryTimer = setTimeout(() => {
        if (isMounted.current) {
          setRetryCount((prev) => prev + 1)
          setAuthTimedOut(false)
          checkUser()
        }
      }, 1000) // Wait 1 second before retry
      return () => clearTimeout(retryTimer)
    }
    // After max retries, show login button - don't loop forever
  }, [authTimedOut, retryCount, checkUser])

  useEffect(() => {
    isMounted.current = true
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return

      const currentUser = session?.user || null
      setUser(currentUser)
      setAuthTimedOut(false)

      if (currentUser) {
        const role = await fetchUserRole(currentUser.id)
        if (isMounted.current) setUserRole(role)
      } else {
        setUserRole("user")
      }

      setIsLoading(false)
    })

    return () => {
      isMounted.current = false
      subscription?.unsubscribe()
    }
  }, [supabase, fetchUserRole, checkUser])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }, [supabase, router])

  const handleManualRetry = useCallback(() => {
    setRetryCount(0)
    setAuthTimedOut(false)
    setIsLoading(true)
    checkUser()
  }, [checkUser])

  const renderAuthTimeoutUI = () => {
    // If still within retry limit, show loading
    if (retryCount < maxRetries) {
      return (
        <div className="flex items-center justify-center px-3 h-8 bg-muted animate-pulse rounded-md">
          <span className="text-xs text-muted-foreground">Retrying...</span>
        </div>
      )
    }
    // After max retries, show login button (don't block the user)
    return (
      <Link href="/auth/login">
        <Button variant="outline" size="sm">
          Login
        </Button>
      </Link>
    )
  }

  const renderMobileAuthTimeoutUI = () => {
    // If still within retry limit, show loading
    if (retryCount < maxRetries) {
      return (
        <div className="flex items-center justify-center w-full h-10 bg-muted animate-pulse rounded-md mt-2">
          <span className="text-xs text-muted-foreground">Retrying...</span>
        </div>
      )
    }
    // After max retries, show login button (don't block the user)
    return (
      <Link href="/auth/login" className="w-full mt-2">
        <Button variant="outline" size="sm" className="w-full">
          Login
        </Button>
      </Link>
    )
  }

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled ? "glass-nav shadow-lg" : "bg-background/60 backdrop-blur-sm border-b border-border/50",
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 max-w-full overflow-visible">
        <div className="flex items-center justify-between h-16 overflow-visible">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/isapm-2026-banner.png"
              alt="ISAPM 2026 - Indonesian Society of Anesthesiology for Pain Management National Meeting, April 16-18, 2026, The Singhasari Hotel, Batu, Malang"
              width={200}
              height={50}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          <div className="hidden md:flex flex-grow justify-end items-center gap-8 overflow-visible">
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
            <div className="flex gap-3 items-center overflow-visible">
              {user && <CartIcon />}
              {isLoading ? (
                <div className="flex items-center justify-center px-3 h-8 bg-muted animate-pulse rounded-md">
                  <span className="text-xs text-muted-foreground">Loading account...</span>
                </div>
              ) : authTimedOut ? (
                renderAuthTimeoutUI()
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto">
                    <Link href="/dashboard">
                      <DropdownMenuItem>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="text-xs text-muted-foreground">My Account</DropdownMenuLabel>
                      <Link href="/profile">
                        <DropdownMenuItem>
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/my-purchases">
                        <DropdownMenuItem>
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          My Purchases
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/my-events">
                        <DropdownMenuItem>
                          <Calendar className="w-4 h-4 mr-2" />
                          My Events
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/my-webinars">
                        <DropdownMenuItem>
                          <Video className="w-4 h-4 mr-2" />
                          My Webinars
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/my-posters">
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          My E-Posters
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/my-hotels">
                        <DropdownMenuItem>
                          <Building2 className="w-4 h-4 mr-2" />
                          My Hotels
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuGroup>

                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-primary flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Admin Panel
                        </DropdownMenuLabel>
                        {adminNavItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link key={item.href} href={item.href}>
                              <DropdownMenuItem className="text-primary">
                                <Icon className="w-4 h-4 mr-2" />
                                {item.label}
                              </DropdownMenuItem>
                            </Link>
                          )
                        })}
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

          <div className="flex justify-end items-center gap-2 md:hidden overflow-visible">
            {user && <CartIcon />}
            <button
              type="button"
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
                className="block px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/pricing" onClick={() => setIsOpen(false)}>
              <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Register Now
              </Button>
            </Link>

            {isLoading ? (
              <div className="flex items-center justify-center w-full h-10 bg-muted animate-pulse rounded-md mt-2">
                <span className="text-xs text-muted-foreground">Loading account...</span>
              </div>
            ) : authTimedOut ? (
              renderMobileAuthTimeoutUI()
            ) : user ? (
              <div className="border-t pt-4 mt-4 space-y-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground font-medium">My Account</p>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
                <Link
                  href="/my-purchases"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <ShoppingBag className="w-4 h-4" />
                  My Purchases
                </Link>
                <Link
                  href="/my-events"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Calendar className="w-4 h-4" />
                  My Events
                </Link>
                <Link
                  href="/my-webinars"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Video className="w-4 h-4" />
                  My Webinars
                </Link>
                <Link
                  href="/my-posters"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="w-4 h-4" />
                  My E-Posters
                </Link>
                <Link
                  href="/my-hotels"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Building2 className="w-4 h-4" />
                  My Hotels
                </Link>

                {isAdmin && (
                  <>
                    <div className="border-t my-3" />
                    <button
                      type="button"
                      onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${adminMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {adminMenuOpen && (
                      <div className="ml-2 border-l-2 border-primary/20 pl-2 space-y-1">
                        {adminNavItems.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}

                <div className="border-t my-2" />
                <button
                  type="button"
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-muted rounded-lg transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                  Login
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
