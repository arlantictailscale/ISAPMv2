"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, UserCircle } from "lucide-react"
import Link from "next/link"

interface ProfileIncompleteAlertProps {
  missingFields: string[]
  completionPercentage: number
  variant?: "default" | "destructive"
  showButton?: boolean
  className?: string
}

export function ProfileIncompleteAlert({
  missingFields,
  completionPercentage,
  variant = "destructive",
  showButton = true,
  className = "",
}: ProfileIncompleteAlertProps) {
  return (
    <Alert variant={variant} className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Profile Incomplete ({completionPercentage}% Complete)</span>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>You must complete your profile before making a purchase. Please provide the following information:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        {showButton && (
          <Link href="/profile">
            <Button variant={variant === "destructive" ? "default" : "outline"} size="sm" className="mt-2">
              <UserCircle className="mr-2 h-4 w-4" />
              Complete Profile
            </Button>
          </Link>
        )}
      </AlertDescription>
    </Alert>
  )
}
