import { Loader2, Mail } from "lucide-react"

export default function Loading() {
  return (
    <main className="pt-24 min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-primary text-white">
          <Mail className="w-8 h-8" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading email broadcast panel...</p>
      </div>
    </main>
  )
}
