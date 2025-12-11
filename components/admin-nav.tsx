"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ShoppingCart,
  Users,
  Menu,
  CheckCircle,
  Receipt,
  UserCheck,
  Gift,
  BookOpen,
  Mail,
  BedDouble,
  Presentation,
  ChevronDown,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState } from "react"

const adminNavGroups = [
  {
    label: "Orders & Payments",
    items: [
      { title: "Payment Validation", href: "/admin/payment-validation", icon: CheckCircle },
      { title: "Cart Management", href: "/admin/carts", icon: ShoppingCart },
      { title: "Invoice Management", href: "/admin/invoices", icon: Receipt },
    ],
  },
  {
    label: "Users & Attendees",
    items: [
      { title: "User Management", href: "/admin/users", icon: Users },
      { title: "Confirmed Attendees", href: "/admin/confirmed-attendees", icon: UserCheck },
    ],
  },
  {
    label: "Content Management",
    items: [
      { title: "Webinar CMS", href: "/admin/webinar-cms", icon: BookOpen },
      { title: "E-Poster Submissions", href: "/admin/posters", icon: Presentation },
    ],
  },
  {
    label: "Access & Configuration",
    items: [
      { title: "Symposium Webinar Access", href: "/admin/symposium-webinar-access", icon: Gift },
      { title: "Room Availability", href: "/admin/room-availability", icon: BedDouble },
    ],
  },
  {
    label: "Tools",
    items: [{ title: "Email Test", href: "/admin/email-test", icon: Mail }],
  },
]

export function AdminNav() {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>(
    // Auto-open the group containing the current page
    adminNavGroups
      .filter((group) => group.items.some((item) => item.href === pathname))
      .map((group) => group.label),
  )

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-20 bottom-0 bg-background border-r z-40">
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminNavGroups.map((group) => (
            <Collapsible
              key={group.label}
              open={openGroups.includes(group.label)}
              onOpenChange={() => toggleGroup(group.label)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded-lg hover:bg-muted">
                {group.label}
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", openGroups.includes(group.label) && "rotate-180")}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
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
          <SheetContent side="left" className="w-72 p-4 overflow-y-auto">
            <nav className="space-y-4 mt-8">
              {adminNavGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
