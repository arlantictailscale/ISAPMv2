import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function PaymentOrderLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-56 mb-2"></div>
            <div className="h-4 bg-muted rounded w-80"></div>
          </div>

          {/* Order Summary */}
          <Card className="mb-6 animate-pulse">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 bg-muted rounded w-40"></div>
                <div className="h-6 bg-muted rounded w-24"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex justify-between py-2 border-b">
                    <div className="space-y-1">
                      <div className="h-5 bg-muted rounded w-48"></div>
                      <div className="h-4 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-5 bg-muted rounded w-24"></div>
                  </div>
                ))}
                <div className="flex justify-between pt-2">
                  <div className="h-6 bg-muted rounded w-20"></div>
                  <div className="h-6 bg-muted rounded w-32"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="h-5 bg-muted rounded w-40 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
                <div className="h-40 bg-muted rounded border-2 border-dashed"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </div>
                </div>
                <div className="h-12 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
