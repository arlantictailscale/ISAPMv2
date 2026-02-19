import Navigation from "@/components/navigation"
import { AdminNav } from "@/components/admin-nav"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminEventsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex flex-1">
        <AdminNav />
        <main className="flex-1 lg:pl-64">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <Skeleton className="h-8 w-16 mx-auto" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Controls Card */}
            <Card>
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </CardContent>
            </Card>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-2 bg-muted" />
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
