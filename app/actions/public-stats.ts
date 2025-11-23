"use server"

import { createClient } from "@supabase/supabase-js"

export async function getRegisteredCount() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase credentials missing for getRegisteredCount")
      return 0
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Count all profiles
    const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error fetching profile count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getRegisteredCount:", error)
    return 0
  }
}
