import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MyOrdersLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-40 mb-2"></div>
            <div className="h-4 bg-muted rounded w-56"></div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded w-32"></div>
                      <div className="h-4 bg-muted rounded w-48"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-24"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="flex justify-between">
                        <div className="h-4 bg-muted rounded w-40"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                    ))}
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
