"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShoppingCart,
  Users,
  ChevronDown,
  CheckCircle,
  Receipt,
  UserCheck,
  Gift,
  BookOpen,
  Mail,
  BedDouble,
  Presentation,
  Send,
  Calendar,
  BarChart3,
  ScanLine,
  QrCode,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const adminNavItems = [
  { title: "Events Dashboard", href: "/admin/events", icon: Calendar },
  { title: "Check-In Scanner", href: "/admin/check-in", icon: ScanLine },
  { title: "Participant Cards", href: "/admin/participant-cards", icon: QrCode },
  { title: "Payment Validation", href: "/admin/payment-validation", icon: CheckCircle },
  { title: "Cart Management", href: "/admin/carts", icon: ShoppingCart },
  { title: "Invoice Management", href: "/admin/invoices", icon: Receipt },
  { title: "User Management", href: "/admin/users", icon: Users },
  { title: "Confirmed Attendees", href: "/admin/confirmed-attendees", icon: UserCheck },
  { title: "Webinar CMS", href: "/admin/webinar-cms", icon: BookOpen },
  { title: "E-Poster Submissions", href: "/admin/posters", icon: Presentation },
  { title: "Symposium Webinar Access", href: "/admin/symposium-webinar-access", icon: Gift },
  { title: "Room Availability", href: "/admin/room-availability", icon: BedDouble },
  { title: "Email Test", href: "/admin/email-test", icon: Mail },
  { title: "Email Broadcast", href: "/admin/email-broadcast", icon: Send },
  { title: "Event Quotas", href: "/admin/event-quotas", icon: BarChart3 },
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
        <DropdownMenuContent align="start" className="w-[280px] max-h-[70vh] overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
                    isActive && "bg-primary/10 text-primary font-medium",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{item.title}</span>
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
