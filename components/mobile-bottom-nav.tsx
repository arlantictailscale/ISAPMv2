"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, ShoppingCart, User, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart } from "@/lib/cart/cart-context"

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/webinar", icon: Video, label: "Webinars" },
  { href: "/cart", icon: ShoppingCart, label: "Cart", showBadge: true },
  { href: "/dashboard", icon: User, label: "Account" },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-safe md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive ? "text-teal-600" : "text-gray-500 hover:text-gray-900",
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.showBadge && itemCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
