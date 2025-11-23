"use server"

import { createClient } from "@supabase/supabase-js"
import { unstable_noStore as noStore } from "next/cache"

export async function getRegisteredCount() {
  noStore()

  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[v0] getRegisteredCount - checking credentials")
    console.log("[v0] supabaseUrl:", supabaseUrl)
    console.log("[v0] supabaseServiceKey:", supabaseServiceKey ? "present" : "missing")

    if (!supabaseServiceKey) {
      console.warn("[v0] Service role key missing for getRegisteredCount")
      return 0
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Fetching profile count...")

    // Count all profiles using service role (bypasses RLS)
    const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    console.log("[v0] Profile count result:", { count, error })

    if (error) {
      console.error("[v0] Error fetching profile count:", error)
      return 0
    }

    console.log("[v0] Successfully fetched profile count:", count)
    return count || 0
  } catch (error) {
    console.error("[v0] Error in getRegisteredCount:", error)
    return 0
  }
}
