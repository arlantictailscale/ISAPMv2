import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ContactLoading() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="h-16 bg-background border-b border-border" />

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center animate-pulse">
            <div className="h-10 bg-muted rounded w-48 mx-auto mb-4"></div>
            <div className="h-5 bg-muted rounded w-80 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-40"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-48"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-10 bg-muted rounded w-full"></div>
                    </div>
                  ))}
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-24 bg-muted rounded w-full"></div>
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
