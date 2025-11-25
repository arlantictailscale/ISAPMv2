"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LandingHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-20 md:pb-32">
        {/* Main Headline - Large bold headline matching reference style */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tight text-slate-900 mb-8 max-w-6xl">
          The Biggest Pain Management & Intervention Event in Indonesia
        </h1>

        {/* Event Details - Italicized elegant details matching reference */}
        <div className="space-y-2 mb-12 text-lg sm:text-xl md:text-2xl lg:text-3xl">
          <p className="italic text-slate-700 font-light">16-18 April, 2026 / The Singhasari Hotel, Batu, Malang</p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-full transition-colors shadow-lg hover:shadow-xl"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="#content"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-cyan-700 bg-white hover:bg-slate-50 border-2 border-cyan-600 rounded-full transition-colors"
          >
            Learn More
          </Link>
        </div>

        {/* Additional Info Badge */}
        <div className="mt-16 inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-orange-500">8</span>
            <span className="text-sm font-semibold text-slate-700">
              <span className="text-orange-500">TH</span> National Meeting
            </span>
          </div>
          <div className="w-px h-8 bg-slate-300"></div>
          <div className="text-sm font-medium text-slate-700">
            Indonesian Society of Anesthesiology for Pain Management
          </div>
        </div>
      </div>

      {/* Bottom Decorative Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-24 text-white">
          <path
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}
