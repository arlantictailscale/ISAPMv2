"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ShoppingCart, FileText, Users, Menu, CheckCircle, Settings } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const adminNavItems = [
  {
    title: "Cart Management",
    href: "/admin/carts",
    icon: ShoppingCart,
  },
  {
    title: "Payment Validation",
    href: "/admin/payment-validation",
    icon: CheckCircle,
  },
  {
    title: "E-Poster Submissions",
    href: "/admin/posters",
    icon: FileText,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Room Availability",
    href: "/admin/room-availability",
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-20 bottom-0 bg-background border-r z-40">
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-20 left-0 right-0 bg-background border-b z-40 p-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-transparent">
              <Menu className="h-4 w-4" />
              Admin Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <nav className="space-y-2 mt-8">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
