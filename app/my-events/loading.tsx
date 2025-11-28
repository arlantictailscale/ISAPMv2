import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MyEventsLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-40 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-10 bg-muted rounded w-full mt-4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
