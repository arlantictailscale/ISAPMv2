import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function RoomAvailabilitySkeleton() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-cyan-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-96 bg-slate-200 rounded animate-pulse" />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Room Cards Skeleton */}
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <Card key={i} className="border-cyan-200 shadow-md">
                <CardHeader>
                  <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-12 bg-slate-100 rounded animate-pulse" />
                    <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Amenities Skeleton */}
          <Card className="border-cyan-200 shadow-md">
            <CardHeader>
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                    <div className="h-4 w-20 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
