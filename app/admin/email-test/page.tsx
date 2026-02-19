"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Mail, Send, CheckCircle, XCircle, Package } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function EmailTestPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [emailType, setEmailType] = useState<"welcome" | "order">("order")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const sendTestEmail = async () => {
    if (!email || !name) {
      setResult({ success: false, message: "Please enter both email and name" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, emailType }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
        setEmail("")
        setName("")
      } else {
        setResult({ success: false, message: data.error || "Failed to send email" })
      }
    } catch (error) {
      setResult({ success: false, message: "Network error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Email System Test</h1>
          <p className="text-muted-foreground">Test the new cart-based email automation system</p>
        </div>

        {result && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg border p-4 ${
              result.success ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {result.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <p>{result.message}</p>
          </div>
        )}

        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-cyan-100 p-3">
              <Mail className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Send Test Email</h2>
              <p className="text-sm text-muted-foreground">Test welcome or order confirmation emails</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email Type</label>
              <Select value={emailType} onValueChange={(value) => setEmailType(value as "welcome" | "order")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Welcome Email</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="order">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>Order Confirmation</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                {emailType === "welcome"
                  ? "Sent when a new user creates an account"
                  : "Sent when a user completes checkout (new cart-based system)"}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Recipient Name</label>
              <Input type="text" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Recipient Email</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button onClick={sendTestEmail} disabled={loading} className="w-full">
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <h3 className="mb-4 font-semibold">System Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">RESEND_API_KEY:</span>
              <span className="font-mono">
                {process.env.NEXT_PUBLIC_RESEND_CONFIGURED ? "✓ Configured" : "✗ Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email System:</span>
              <span className="font-mono">Cart-Based Automation</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">From Email:</span>
              <span className="font-mono">noreply@isapm2026.org</span>
            </div>
          </div>
        </Card>

        <Card className="mt-6 p-6">
          <h3 className="mb-4 font-semibold">Active Email Automation</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Order Confirmation</div>
                <div className="text-green-700">Sent automatically when user completes checkout</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Payment Verified</div>
                <div className="text-green-700">Sent when admin approves payment proof</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Payment Rejected</div>
                <div className="text-green-700">Sent when admin rejects payment proof</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Welcome Email</div>
                <div className="text-green-700">Sent when new user creates account</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">✨ New Cart-Based System</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-800">
            <li>Order confirmation emails with full item breakdown</li>
            <li>Payment verification emails with order details</li>
            <li>Professional HTML templates with brand styling</li>
            <li>Automatic triggers from checkout and payment validation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
