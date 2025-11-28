import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-background border-b border-border" />

      {/* Hero skeleton */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center animate-pulse">
          <div className="h-10 bg-muted rounded w-48 mx-auto mb-4"></div>
          <div className="h-5 bg-muted rounded w-80 mx-auto"></div>
        </div>
      </section>

      {/* Tabs skeleton */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 mb-8 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted rounded w-28"></div>
            ))}
          </div>

          {/* Event cards skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
