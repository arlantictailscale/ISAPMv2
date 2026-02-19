import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail, ArrowRight } from "lucide-react"

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="w-full max-w-md px-4">
        <Card className="border-teal-200 shadow-lg">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-teal-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>Your email address has been successfully confirmed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-teal-900">Welcome to ISAPM 2026!</p>
                  <p className="text-sm text-teal-700 leading-relaxed">
                    Your account is now active. You can sign in and access the conference portal to register for events,
                    submit posters, and manage your profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full bg-teal-600 hover:bg-teal-700">
                <Link href="/auth/login" className="gap-2">
                  Continue to Login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Need help? Contact us at{" "}
              <a href="mailto:admin@isapm2026.org" className="text-teal-600 hover:underline">
                admin@isapm2026.org
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
