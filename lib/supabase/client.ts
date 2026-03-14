import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wilienulethgfxdiqghw.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbGllbnVsZXRoZ2Z4ZGlxZ2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzgxOTUsImV4cCI6MjA3ODU1NDE5NX0.AEvTooDW5Zswza55RXnf6e-A5bZu-kOYY6kuV6cZ9Cw",
    {
      auth: {
        // Persist session to handle mobile browser issues
        persistSession: true,
        // Auto refresh token before expiry
        autoRefreshToken: true,
        // Detect session from URL (for OAuth callbacks)
        detectSessionInUrl: true,
        // Use localStorage as fallback when cookies fail (common on mobile)
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        // Flow type for better mobile compatibility
        flowType: "pkce",
      },
      cookies: {
        // Ensure cookies work properly on mobile browsers
        get(name: string) {
          if (typeof document === "undefined") return undefined
          const value = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`))
            ?.split("=")[1]
          return value ? decodeURIComponent(value) : undefined
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; sameSite?: string }) {
          if (typeof document === "undefined") return
          let cookie = `${name}=${encodeURIComponent(value)}`
          if (options.path) cookie += `; path=${options.path}`
          if (options.maxAge) cookie += `; max-age=${options.maxAge}`
          // Use Lax for better mobile compatibility with OAuth redirects
          cookie += `; SameSite=Lax`
          if (window.location.protocol === "https:") cookie += `; Secure`
          document.cookie = cookie
        },
        remove(name: string, options: { path?: string }) {
          if (typeof document === "undefined") return
          document.cookie = `${name}=; path=${options.path || "/"}; max-age=0`
        },
      },
    }
  )
}

export { createClient as createBrowserClient }
