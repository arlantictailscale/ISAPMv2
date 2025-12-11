import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-slate-50 to-background">
      <div className="py-8 px-4 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 bg-white/20" />
          <Skeleton className="h-4 w-48 mt-2 bg-white/10" />
        </div>
      </div>
      <div className="py-6 px-4 max-w-7xl mx-auto">
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
