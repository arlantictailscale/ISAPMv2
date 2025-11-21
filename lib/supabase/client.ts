import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbGllbnVsZXRoZ2Z4ZGlxZ2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzgxOTUsImV4cCI6MjA3ODU1NDE5NX0.AEvTooDW5Zswza55RXnf6e-A5bZu-kOYY6kuV6cZ9Cw",
  )
}
