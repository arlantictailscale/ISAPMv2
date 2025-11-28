import { Card, CardContent } from "@/components/ui/card"

export default function UsersLoading() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-72"></div>
        </div>

        {/* Search skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="h-10 bg-muted rounded w-80"></div>
        </div>

        {/* Table skeleton */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-5 bg-muted rounded w-40"></div>
                        <div className="h-4 bg-muted rounded w-56"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
