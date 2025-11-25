"use client"

import Link from "next/link"
import { Play } from "lucide-react"

export default function LandingHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src="/images/landing-bg.jpg" alt="ISAPM Medical Background" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full w-full flex flex-col justify-center items-start px-8 md:px-16 lg:px-24 py-12">
        {/* Main Headline - Extra bold, tight spacing, dark color */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tight text-white mb-8 max-w-5xl">
          The Biggest Pain Management & Intervention Event in Indonesia
        </h1>

        {/* Event Details - Italicized, elegant font */}
        <div className="space-y-2">
          <p className="text-xl md:text-2xl lg:text-3xl italic font-light text-white/90">
            16-18 April, 2026 / The Singhasari Hotel, Batu, Malang
          </p>
        </div>

        {/* CTA Button - Positioned below details */}
        <div className="mt-12">
          <Link
            href="#content"
            className="inline-flex items-center gap-3 text-lg md:text-xl hover:text-cyan-400 transition-colors group text-white"
          >
            <span className="tracking-wider font-bold">START NOW</span>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white group-hover:border-cyan-400 flex items-center justify-center transition-colors">
              <Play className="w-5 h-5 md:w-6 md:h-6 fill-white group-hover:fill-cyan-400" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
