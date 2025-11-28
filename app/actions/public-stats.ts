"use server"

import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

const getCachedRegisteredCount = unstable_cache(
  async () => {
    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co"

      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

      // Count all profiles using service role (bypasses RLS)
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      if (error) {
        console.error("[v0] Error fetching profile count:", error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error("[v0] Error in getRegisteredCount:", error)
      return 0
    }
  },
  ["registered-count"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["registered-count"],
  },
)

export async function getRegisteredCount() {
  return getCachedRegisteredCount()
}
