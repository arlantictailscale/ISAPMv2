export default function VenueLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-background border-b border-border" />

      {/* Hero skeleton */}
      <section className="relative h-[50vh] bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent"></div>
        <div className="absolute bottom-10 left-10">
          <div className="h-10 bg-white/20 rounded w-64 mb-4"></div>
          <div className="h-6 bg-white/20 rounded w-96"></div>
        </div>
      </section>

      {/* Content skeleton */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-muted rounded w-48"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-6 h-6 bg-muted rounded"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="animate-pulse">
            <div className="h-[400px] bg-muted rounded-lg"></div>
          </div>
        </div>
      </section>
    </div>
  )
}
