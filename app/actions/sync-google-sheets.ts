"use server"

import { createClient } from "@/lib/supabase/server"
import { exportUsersToGoogleSheet, anonymizeUserData, type UserProfileExport } from "@/lib/google-sheets"

export async function syncUsersToGoogleSheets(options: {
  anonymize?: boolean
  spreadsheetId?: string
  sheetName?: string
}) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Fetch all user profiles with auth users
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`)
    }

    // Get auth users to retrieve email addresses
    const { data: authData } = await supabase.auth.admin.listUsers()
    const authUsers = authData?.users || []

    // Map profiles to export format
    let userExports: UserProfileExport[] = profiles.map((profile) => {
      const authUser = authUsers.find((u) => u.id === profile.id)

      return {
        fullName: profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        titleDegree: profile.title_degree || "",
        satuSehatName: profile.satu_sehat_name || "",
        satuSehatEmail: profile.satu_sehat_email || "",
        registrationDate: profile.created_at
          ? new Date(profile.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        nik: profile.nik || "",
        institution: profile.institution || "",
        profession: profile.position || "",
        mobilePhone: profile.phone || "",
        email: authUser?.email || "",
        role: profile.role || "user",
      }
    })

    // Anonymize data if requested
    if (options.anonymize) {
      userExports = await Promise.all(userExports.map(anonymizeUserData))
    }

    // Use provided spreadsheet ID or from environment
    const spreadsheetId = options.spreadsheetId || process.env.GOOGLE_SHEETS_EXPORT_ID

    if (!spreadsheetId) {
      return {
        success: false,
        error: "Google Sheets Spreadsheet ID not configured. Please set GOOGLE_SHEETS_EXPORT_ID environment variable.",
      }
    }

    // Export to Google Sheets
    const result = await exportUsersToGoogleSheet(userExports, spreadsheetId, options.sheetName || "User Profiles")

    return {
      success: true,
      ...result,
      anonymized: options.anonymize || false,
    }
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync data to Google Sheets",
    }
  }
}

export async function schedulePeriodicSync() {
  // This would typically be called by a cron job or scheduled task
  // For Vercel, you would use Vercel Cron Jobs
  return await syncUsersToGoogleSheets({
    anonymize: false,
    sheetName: "User Profiles - Auto Sync",
  })
}
