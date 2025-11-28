import { Card, CardContent } from "@/components/ui/card"

export default function AdminCartsLoading() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-4 bg-muted rounded w-80"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-28 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table skeleton */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded w-56"></div>
                      <div className="h-4 bg-muted rounded w-40"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-20"></div>
                      <div className="h-8 bg-muted rounded w-24"></div>
                    </div>
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
