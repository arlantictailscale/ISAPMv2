import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navigation placeholder */}
      <div className="h-16 bg-background border-b border-border" />

      {/* Hero section skeleton */}
      <section className="py-12 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/5 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded w-80 mb-4"></div>
            <div className="h-5 bg-muted rounded w-48"></div>
          </div>
        </div>
      </section>

      {/* Cards skeleton */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 animate-pulse">
            <div className="h-7 bg-muted rounded w-40 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-full animate-pulse">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-muted"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-48"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
