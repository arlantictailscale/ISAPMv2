"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { trackLead, trackCompleteRegistration } from "@/lib/meta-pixel"

export default function SignUpSuccessPage() {
  useEffect(() => {
    // Track Lead and CompleteRegistration events for Meta Pixel
    trackLead({
      content_name: "ISAPM 2026 Registration",
      content_category: "Account Registration",
    })
    trackCompleteRegistration({
      content_name: "ISAPM 2026 Account",
      status: "pending_verification",
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">Registration Successful! Please Verify Your Email</CardTitle>
            <CardDescription className="text-center">A confirmation link has been sent to your inbox.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Thank you for registering for the ISAPM National Meeting 2026. To activate your account and proceed with conference registration, please check your email for a verification link. If you don&apos;t see it, please check your spam or junk folder. Once your email is confirmed, you can log in.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Having trouble? Please contact support at admin@isapm2026.org
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
