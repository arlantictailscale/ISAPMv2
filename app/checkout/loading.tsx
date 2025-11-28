import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-2"></div>
            <div className="h-4 bg-muted rounded w-56"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order summary skeleton */}
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-36"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex justify-between pb-4 border-b">
                      <div className="space-y-2">
                        <div className="h-5 bg-muted rounded w-40"></div>
                        <div className="h-4 bg-muted rounded w-24"></div>
                      </div>
                      <div className="h-5 bg-muted rounded w-20"></div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-28"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment form skeleton */}
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-40"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded w-full"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                  <div className="h-12 bg-muted rounded w-full mt-6"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
