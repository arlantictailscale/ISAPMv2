'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react'

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const sendTestEmail = async () => {
    if (!email || !name) {
      setResult({ success: false, message: 'Please enter both email and name' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
        setEmail('')
        setName('')
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Email System Test</h1>
          <p className="text-muted-foreground">
            Test the email system by sending a welcome email
          </p>
        </div>

        {result && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg border p-4 ${
              result.success
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
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
              <p className="text-sm text-muted-foreground">
                Send a welcome email to test the system
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Recipient Name</label>
              <Input
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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

            <Button
              onClick={sendTestEmail}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                'Sending...'
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
                {process.env.NEXT_PUBLIC_RESEND_CONFIGURED ? '✓ Configured' : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email System:</span>
              <span className="font-mono">Direct Send (Resend)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">From Email:</span>
              <span className="font-mono">noreply@isapm2026.org</span>
            </div>
          </div>
        </Card>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h4 className="mb-2 font-semibold text-amber-900">Note:</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            <li>Make sure RESEND_API_KEY is configured in environment variables</li>
            <li>The sender domain (isapm2026.org) must be verified in Resend</li>
            <li>Emails are sent directly without queuing for simplicity</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
