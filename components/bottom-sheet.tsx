"use client"

import type * as React from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface BottomSheetProps {
  children: React.ReactNode
  trigger: React.ReactNode
  className?: string
}

export function BottomSheet({ children, trigger, className }: BottomSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        className={cn(
          "h-[85vh] rounded-t-3xl border-t-2 border-border/50",
          "md:hidden", // Only show on mobile
          className,
        )}
      >
        {children}
      </SheetContent>
    </Sheet>
  )
}
