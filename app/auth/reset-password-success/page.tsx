"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ResetPasswordSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Password Reset Successful</CardTitle>
            <CardDescription className="text-center">Your password has been changed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center">
              ✓ Your password has been successfully reset. You can now log in with your new password.
            </div>
            <Link href="/auth/login" className="block">
              <Button className="w-full">Return to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
