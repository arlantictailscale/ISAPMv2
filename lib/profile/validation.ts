/**
 * Profile completeness validation utilities
 */

export interface ProfileData {
  full_name?: string | null
  satu_sehat_name?: string | null
  satu_sehat_email?: string | null
  nik?: string | null
  phone?: string | null
  institution?: string | null
  position?: string | null
}

export interface ProfileCompletenessResult {
  isComplete: boolean
  missingFields: string[]
  completionPercentage: number
}

/**
 * Required fields for a complete profile
 */
export const REQUIRED_PROFILE_FIELDS = [
  { key: "full_name", label: "Full Name with Titles/Degrees" },
  { key: "satu_sehat_name", label: "Name on Satu Sehat Account" },
  { key: "satu_sehat_email", label: "Email on Satu Sehat Account" },
  { key: "nik", label: "National ID Number (NIK)" },
  { key: "phone", label: "Mobile Phone Number" },
  { key: "institution", label: "Institution / Organization" },
  { key: "position", label: "Profession" },
] as const

/**
 * Check if profile is complete
 */
export function checkProfileCompleteness(profile: ProfileData | null): ProfileCompletenessResult {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: REQUIRED_PROFILE_FIELDS.map((f) => f.label),
      completionPercentage: 0,
    }
  }

  const missingFields: string[] = []

  for (const field of REQUIRED_PROFILE_FIELDS) {
    const value = profile[field.key as keyof ProfileData]
    if (!value || value.trim() === "") {
      missingFields.push(field.label)
    }
  }

  const completedFields = REQUIRED_PROFILE_FIELDS.length - missingFields.length
  const completionPercentage = Math.round((completedFields / REQUIRED_PROFILE_FIELDS.length) * 100)

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage,
  }
}
