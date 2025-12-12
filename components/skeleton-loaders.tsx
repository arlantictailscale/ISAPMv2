export function FlipBookSkeleton() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="w-full max-w-5xl mx-auto mb-12 h-[600px] bg-gray-100 rounded-lg animate-pulse" />
        <div className="flex flex-col items-center justify-center gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center w-full max-w-2xl">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-lg min-w-[100px] h-24 animate-pulse" />
            ))}
          </div>
          <div className="w-full max-w-md h-24 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </section>
  )
}

export function StatsSkeleton() {
  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 to-primary/10 border-y border-primary/10">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse" />
        </div>
      </div>
    </section>
  )
}

export function WelcomeSkeleton() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-lg w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-lg w-4/5 animate-pulse" />
        </div>
      </div>
    </section>
  )
}

export function HighlightsSkeleton() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="h-10 bg-gray-200 rounded-lg w-96 mx-auto mb-12 animate-pulse" />
        <div className="grid md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg space-y-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-6 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded-lg w-5/6 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AboutSkeleton() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-lg w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-lg w-4/5 animate-pulse" />
          </div>
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </section>
  )
}

export function ImportantInfoSkeleton() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="h-10 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg space-y-3">
              <div className="h-6 bg-gray-200 rounded-lg w-2/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded-lg w-5/6 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CTASkeleton() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="h-10 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse" />
        <div className="h-6 bg-gray-200 rounded-lg w-full mx-auto animate-pulse" />
        <div className="h-12 bg-gray-200 rounded-lg w-48 mx-auto animate-pulse" />
      </div>
    </section>
  )
}

export function FooterSkeleton() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 bg-primary-foreground/20 rounded-lg w-32 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 bg-primary-foreground/20 rounded-lg w-full animate-pulse" />
                <div className="h-4 bg-primary-foreground/20 rounded-lg w-5/6 animate-pulse" />
                <div className="h-4 bg-primary-foreground/20 rounded-lg w-4/5 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
