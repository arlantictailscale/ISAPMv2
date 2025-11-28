import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CartLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-40 mb-2"></div>
            <div className="h-4 bg-muted rounded w-48"></div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-48"></div>
                      <div className="h-4 bg-muted rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6 animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-5 bg-muted rounded w-16"></div>
                  <div className="h-5 bg-muted rounded w-28"></div>
                </div>
              </div>
              <div className="h-12 bg-muted rounded w-full mt-6"></div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
