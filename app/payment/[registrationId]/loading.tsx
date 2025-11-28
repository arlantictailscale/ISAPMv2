import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function PaymentLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-72"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Details */}
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-36"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between pb-3 border-b">
                      <div className="h-4 bg-muted rounded w-40"></div>
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-32"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Form */}
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-32 bg-muted rounded border-2 border-dashed"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </div>
                  <div className="h-12 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
