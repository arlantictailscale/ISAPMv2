import { google } from "googleapis"

export async function getGoogleSheetsClient() {
  const auth = await google.auth.getClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      universe_domain: "googleapis.com",
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  return google.sheets({ version: "v4", auth })
}

export interface UserProfileExport {
  fullName: string
  titleDegree: string
  satuSehatName: string
  satuSehatEmail: string
  registrationDate: string
  nik: string
  institution: string
  profession: string
  mobilePhone: string
  email: string
  role: string
}

export async function exportUsersToGoogleSheet(
  users: UserProfileExport[],
  spreadsheetId: string,
  sheetName = "User Profiles",
) {
  const sheets = await getGoogleSheetsClient()

  // Clear existing data first (keep headers)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A2:K`,
  })

  // Prepare header row
  const headers = [
    "Full Name",
    "Title/Degree",
    "Satu Sehat Name",
    "Satu Sehat Email",
    "Registration Date",
    "NIK",
    "Institution",
    "Profession",
    "Mobile Phone",
    "Account Email",
    "Role",
  ]

  // Prepare data rows
  const rows = users.map((user) => [
    user.fullName || "-",
    user.titleDegree || "-",
    user.satuSehatName || "-",
    user.satuSehatEmail || "-",
    user.registrationDate || "-",
    user.nik || "-",
    user.institution || "-",
    user.profession || "-",
    user.mobilePhone || "-",
    user.email || "-",
    user.role || "user",
  ])

  // Update headers and data
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:K1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [headers],
    },
  })

  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A2:K`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows,
      },
    })
  }

  return {
    success: true,
    recordsExported: users.length,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  }
}

export async function anonymizeUserData(user: UserProfileExport): UserProfileExport {
  // Anonymize sensitive data
  return {
    ...user,
    fullName: user.fullName ? maskName(user.fullName) : "-",
    satuSehatEmail: user.satuSehatEmail ? maskEmail(user.satuSehatEmail) : "-",
    email: user.email ? maskEmail(user.email) : "-",
    nik: user.nik ? maskNIK(user.nik) : "-",
    mobilePhone: user.mobilePhone ? maskPhone(user.mobilePhone) : "-",
  }
}

function maskName(name: string): string {
  const parts = name.split(" ")
  return parts.map((part) => part.charAt(0) + "*".repeat(part.length - 1)).join(" ")
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  const maskedLocal = local.charAt(0) + "*".repeat(Math.min(local.length - 1, 5)) + local.slice(-1)
  return `${maskedLocal}@${domain}`
}

function maskNIK(nik: string): string {
  if (nik.length <= 4) return "****"
  return nik.slice(0, 4) + "*".repeat(nik.length - 4)
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****"
  return phone.slice(0, 3) + "*".repeat(phone.length - 6) + phone.slice(-3)
}
