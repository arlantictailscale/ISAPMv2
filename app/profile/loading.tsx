import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-muted rounded w-40 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>

          <Card className="animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-48"></div>
                  <div className="h-4 bg-muted rounded w-64"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </div>
                ))}
              </div>
              <div className="h-12 bg-muted rounded w-32 mt-6"></div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
