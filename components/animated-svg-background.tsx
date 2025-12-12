"use client"

export function AnimatedSVGBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad-multi" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
          <stop offset="33%" stopColor="#a855f7" stopOpacity="0.2" />
          <stop offset="66%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="grad-orange-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Organic blob shapes with floating animation */}
      <path
        className="animate-float-slow"
        d="M200,300 Q350,200 500,300 Q650,400 500,500 Q350,600 200,500 Q50,400 200,300Z"
        fill="url(#grad-multi)"
      />

      <path
        className="animate-float-delayed"
        d="M600,150 Q700,100 800,150 Q900,200 850,300 Q800,400 700,350 Q600,300 600,150Z"
        fill="url(#grad-orange-cyan)"
      />

      <circle className="animate-float-slow" cx="150" cy="700" r="80" fill="url(#grad-multi)" />
      <circle className="animate-float-delayed" cx="850" cy="800" r="60" fill="url(#grad-orange-cyan)" />
    </svg>
  )
}
