import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation placeholder */}
      <div className="h-16 bg-background border-b border-border" />

      {/* Hero skeleton */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto text-center animate-pulse">
          <div className="h-10 bg-muted rounded w-64 mx-auto mb-4"></div>
          <div className="h-5 bg-muted rounded w-96 mx-auto"></div>
        </div>
      </section>

      {/* Pricing cards skeleton */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 bg-muted rounded w-full"></div>
                    ))}
                  </div>
                  <div className="h-10 bg-muted rounded w-full mt-6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
