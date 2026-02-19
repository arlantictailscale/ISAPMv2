import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SubmitPosterLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center animate-pulse">
            <div className="h-10 bg-muted rounded w-64 mx-auto mb-4"></div>
            <div className="h-5 bg-muted rounded w-96 mx-auto"></div>
          </div>

          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48 mb-2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </div>
                ))}
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-32 bg-muted rounded w-full"></div>
                </div>
                <div className="h-12 bg-muted rounded w-40"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
