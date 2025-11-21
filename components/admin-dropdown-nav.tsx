"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, FileText, Users, Hotel, ChevronDown, CheckCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const adminNavItems = [
  {
    title: "Cart Management",
    href: "/admin/carts",
    icon: ShoppingCart,
    description: "Monitor shopping carts and orders",
  },
  {
    title: "Payment Validation",
    href: "/admin/payment-validation",
    icon: CheckCircle,
    description: "Review and approve payments",
  },
  {
    title: "Hotel Bookings",
    href: "/admin/hotel-bookings",
    icon: Hotel,
    description: "Manage hotel reservations",
  },
  {
    title: "E-Poster Submissions",
    href: "/admin/posters",
    icon: FileText,
    description: "Review poster submissions",
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
    description: "Manage user accounts",
  },
]

export function AdminDropdownNav() {
  const pathname = usePathname()
  const currentPage = adminNavItems.find((item) => item.href === pathname)

  return (
    <div className="mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto gap-2 bg-transparent" size="lg">
            {currentPage?.icon && <currentPage.icon className="h-4 w-4" />}
            <span className="font-medium">{currentPage?.title || "Admin Menu"}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[280px]">
          <DropdownMenuLabel>Admin Sections</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    isActive && "bg-primary/10 text-primary font-medium",
                  )}
                >
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
