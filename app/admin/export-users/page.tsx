"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Loader2, Download, Shield, FileSpreadsheet, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { syncUsersToGoogleSheets } from "@/app/actions/sync-google-sheets"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ExportUsersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [anonymize, setAnonymize] = useState(false)
  const [customSpreadsheetId, setCustomSpreadsheetId] = useState("")
  const [sheetName, setSheetName] = useState("User Profiles")
  const [lastSyncResult, setLastSyncResult] = useState<any>(null)

  useState(() => {
    checkAdmin()
  })

  const checkAdmin = async () => {
    try {
      setIsChecking(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!profile || profile.role !== "admin") {
        toast.error("Unauthorized access")
        router.push("/")
        return
      }

      setIsAuthorized(true)
    } catch (err) {
      console.error("Error checking admin status:", err)
      toast.error("Failed to verify authorization")
      router.push("/")
    } finally {
      setIsChecking(false)
    }
  }

  const handleExport = async () => {
    try {
      setIsLoading(true)
      setLastSyncResult(null)

      const result = await syncUsersToGoogleSheets({
        anonymize,
        spreadsheetId: customSpreadsheetId || undefined,
        sheetName,
      })

      if (result.success) {
        toast.success(`Successfully exported ${result.recordsExported} user profiles`)
        setLastSyncResult(result)
      } else {
        toast.error(result.error || "Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export users")
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <>
        <Navigation />
        <main className="pt-24 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying authorization...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20">
        <section className="py-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">Export User Profiles</h1>
            <p className="text-lg text-muted-foreground">
              Sync user profile data to Google Sheets with privacy controls
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Privacy & Data Protection</AlertTitle>
              <AlertDescription>
                This tool exports comprehensive user profile data to Google Sheets. Enable anonymization to mask
                sensitive information like names, emails, NIK, and phone numbers. Only use full data export with proper
                authorization and data protection measures in place.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Export Configuration</CardTitle>
                <CardDescription>Configure how user profiles should be exported to Google Sheets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="spreadsheet-id">
                    Google Spreadsheet ID (Optional)
                    <span className="text-xs text-muted-foreground ml-2">
                      Leave empty to use default from environment
                    </span>
                  </Label>
                  <Input
                    id="spreadsheet-id"
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={customSpreadsheetId}
                    onChange={(e) => setCustomSpreadsheetId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The ID from the Google Sheets URL. Make sure to share the sheet with your service account email.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sheet-name">Sheet Name</Label>
                  <Input
                    id="sheet-name"
                    placeholder="User Profiles"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="anonymize" className="cursor-pointer">
                      Anonymize Sensitive Data
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Mask names, emails, NIK, and phone numbers for privacy protection
                    </p>
                  </div>
                  <Switch id="anonymize" checked={anonymize} onCheckedChange={setAnonymize} />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Exported Fields:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Full Name + Titles/Degrees</li>
                    <li>• Satu Sehat Account Name</li>
                    <li>• Satu Sehat Account Email</li>
                    <li>• Registration Date</li>
                    <li>• National ID Number (NIK)</li>
                    <li>• Institution / Organization</li>
                    <li>• Profession</li>
                    <li>• Mobile Phone Number</li>
                    <li>• Account Email</li>
                    <li>• User Role</li>
                  </ul>
                </div>

                <Button onClick={handleExport} disabled={isLoading} className="w-full" size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting to Google Sheets...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export to Google Sheets
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {lastSyncResult && lastSyncResult.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Export Successful</AlertTitle>
                <AlertDescription className="text-green-800">
                  <div className="space-y-2 mt-2">
                    <p>Exported {lastSyncResult.recordsExported} user profiles successfully.</p>
                    {lastSyncResult.anonymized && (
                      <p className="text-sm">Data was anonymized for privacy protection.</p>
                    )}
                    {lastSyncResult.spreadsheetUrl && (
                      <a
                        href={lastSyncResult.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-900 underline"
                      >
                        Open Google Sheet
                        <Download className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Automated Synchronization</CardTitle>
                <CardDescription>Set up periodic automatic exports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Cron Job Setup Required</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2 mt-2">
                      <p>To enable automatic daily syncing, add the following to your vercel.json:</p>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto mt-2">
                        {`{
  "crons": [{
    "path": "/api/cron/sync-sheets",
    "schedule": "0 0 * * *"
  }]
}`}
                      </pre>
                      <p className="text-sm mt-2">
                        Don't forget to add <code className="bg-muted px-1 py-0.5 rounded">CRON_SECRET</code> to your
                        environment variables for security.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Google Cloud Setup Instructions</CardTitle>
                <CardDescription>Required environment variables for Google Sheets integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Environment Variables Required</AlertTitle>
                  <AlertDescription>
                    <ul className="text-sm space-y-1 mt-2 list-disc list-inside">
                      <li>
                        <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_CLOUD_PROJECT_ID</code>
                      </li>
                      <li>
                        <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_PRIVATE_KEY_ID</code>
                      </li>
                      <li>
                        <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_PRIVATE_KEY</code>
                      </li>
                      <li>
                        <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_CLIENT_EMAIL</code>
                      </li>
                      <li>
                        <code className="bg-muted px-1 py-0.5 rounded">GOOGLE_SHEETS_EXPORT_ID</code> (Your spreadsheet
                        ID)
                      </li>
                      <li>
                        <code className="bg-muted px-1 py-0.5 rounded">CRON_SECRET</code> (Optional, for scheduled
                        syncs)
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                  <h4 className="font-semibold">Setup Steps:</h4>
                  <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Create a project in Google Cloud Console</li>
                    <li>Enable Google Sheets API</li>
                    <li>Create a Service Account with Editor role</li>
                    <li>Generate JSON key for the service account</li>
                    <li>Add environment variables from the JSON key</li>
                    <li>Share your Google Sheet with the service account email</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
