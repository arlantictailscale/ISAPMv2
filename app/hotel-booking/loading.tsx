import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function HotelBookingLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      {/* Hero skeleton */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center animate-pulse">
          <div className="h-10 bg-muted rounded w-56 mx-auto mb-4"></div>
          <div className="h-5 bg-muted rounded w-96 mx-auto"></div>
        </div>
      </section>

      {/* Room cards skeleton */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-64 bg-muted"></div>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-40 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-12 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
