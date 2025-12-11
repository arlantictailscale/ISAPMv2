import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
  lines?: number
  showImage?: boolean
  imageHeight?: string
}

export function SkeletonCard({ className, lines = 3, showImage = true, imageHeight = "h-48" }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4 animate-pulse", className)}>
      {showImage && <div className={cn("bg-muted rounded-md w-full", imageHeight)} />}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn("h-4 bg-muted rounded", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonList({
  count = 3,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
