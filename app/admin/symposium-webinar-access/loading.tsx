import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

export default function SymposiumWebinarAccessLoading() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 min-h-screen bg-gradient-to-b from-emerald-50/50 to-background">
        {/* Header Skeleton */}
        <section className="py-8 px-4 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-xl bg-white/20" />
              <div>
                <Skeleton className="h-8 w-64 bg-white/20 mb-2" />
                <Skeleton className="h-4 w-48 bg-white/20" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Skeleton */}
        <section className="py-6 px-4 -mt-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div>
                        <Skeleton className="h-8 w-12 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Content Skeleton */}
        <section className="py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
