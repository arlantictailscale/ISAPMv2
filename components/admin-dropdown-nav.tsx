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
} from "lucide-react"
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

const adminNavGroups = [
  {
    label: "Orders & Payments",
    items: [
      {
        title: "Payment Validation",
        href: "/admin/payment-validation",
        icon: CheckCircle,
        description: "Review and approve payments",
      },
      { title: "Cart Management", href: "/admin/carts", icon: ShoppingCart, description: "Monitor shopping carts" },
      { title: "Invoice Management", href: "/admin/invoices", icon: Receipt, description: "Manage invoices" },
    ],
  },
  {
    label: "Users & Attendees",
    items: [
      { title: "User Management", href: "/admin/users", icon: Users, description: "Manage user accounts" },
      {
        title: "Confirmed Attendees",
        href: "/admin/confirmed-attendees",
        icon: UserCheck,
        description: "View confirmed attendees",
      },
    ],
  },
  {
    label: "Content Management",
    items: [
      { title: "Webinar CMS", href: "/admin/webinar-cms", icon: BookOpen, description: "Manage webinar content" },
      {
        title: "E-Poster Submissions",
        href: "/admin/posters",
        icon: Presentation,
        description: "Review poster submissions",
      },
    ],
  },
  {
    label: "Access & Configuration",
    items: [
      {
        title: "Symposium Webinar Access",
        href: "/admin/symposium-webinar-access",
        icon: Gift,
        description: "Grant webinar access",
      },
      {
        title: "Room Availability",
        href: "/admin/room-availability",
        icon: BedDouble,
        description: "Configure hotel rooms",
      },
    ],
  },
  {
    label: "Tools",
    items: [{ title: "Email Test", href: "/admin/email-test", icon: Mail, description: "Test email sending" }],
  },
]

// Flatten for finding current page
const allAdminItems = adminNavGroups.flatMap((g) => g.items)

export function AdminDropdownNav() {
  const pathname = usePathname()
  const currentPage = allAdminItems.find((item) => item.href === pathname)

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
        <DropdownMenuContent align="start" className="w-[300px] max-h-[70vh] overflow-y-auto">
          {adminNavGroups.map((group, index) => (
            <div key={group.label}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">{group.label}</DropdownMenuLabel>
              {group.items.map((item) => {
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
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
