"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export default function LandingHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white via-slate-50 to-purple-50/30">
      {/* Background decorative curves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right curve */}
        <svg
          className="absolute -top-20 -right-20 w-[600px] h-[600px] text-purple-100/60"
          viewBox="0 0 600 600"
          fill="none"
        >
          <circle cx="300" cy="300" r="280" stroke="currentColor" strokeWidth="40" />
        </svg>

        {/* Bottom left curve */}
        <svg
          className="absolute -bottom-40 -left-40 w-[800px] h-[800px] text-blue-100/50"
          viewBox="0 0 800 800"
          fill="none"
        >
          <circle cx="400" cy="400" r="350" stroke="currentColor" strokeWidth="50" />
        </svg>

        {/* Middle decorative curve */}
        <svg
          className="absolute top-1/2 right-1/4 w-[400px] h-[400px] text-cyan-100/40 -translate-y-1/2"
          viewBox="0 0 400 400"
          fill="none"
        >
          <path d="M50,200 Q200,50 350,200 Q200,350 50,200" stroke="currentColor" strokeWidth="30" fill="none" />
        </svg>

        {/* Small accent circles */}
        <div className="absolute top-32 left-1/4 w-4 h-4 rounded-full bg-purple-300/40" />
        <div className="absolute bottom-40 right-1/3 w-6 h-6 rounded-full bg-cyan-300/30" />
        <div className="absolute top-1/2 left-16 w-3 h-3 rounded-full bg-blue-300/50" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-16 pt-28 md:pt-36 pb-20 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-12rem)]">
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center order-2 lg:order-1">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-black leading-[1.1] tracking-tight mb-8">
              <span className="bg-gradient-to-r from-slate-800 via-purple-700 to-blue-600 bg-clip-text text-transparent">
                The Biggest Pain Management & Intervention Event in Indonesia
              </span>
            </h1>

            {/* Conference description */}
            <p className="text-slate-500 text-base max-w-md mb-8">
              The{" "}
              <span className="inline-flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-orange-600">8</span>
                <span className="text-xs font-semibold text-orange-500 uppercase">th</span>
              </span>{" "}
              National Meeting of the Indonesian Society of Anesthesiology for Pain Management (ISAPM) brings together
              healthcare professionals to advance patient care through knowledge sharing and collaboration.
            </p>

            {/* CTA Button */}
            <div>
              <Link
                href="/events"
                className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-lg font-semibold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
              >
                Register Now
                <span className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-full group-hover:bg-purple-500 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </span>
              </Link>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="flex items-center justify-center order-1 lg:order-2 relative">
            {/* Floating image container */}
            <div className="relative w-full max-w-lg lg:max-w-xl">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-blue-400/20 to-cyan-400/20 rounded-3xl blur-3xl scale-110" />

              {/* Main image */}
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                <Image
                  src="/hero-pain-intervention.jpg"
                  alt="Medical professionals performing interventional pain management procedure with fluoroscopy guidance"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Floating accent elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl opacity-80 blur-sm" />
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-xl opacity-70 blur-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave transition */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 text-white">
          <path
            d="M0,40L120,45C240,50,480,60,720,55C960,50,1200,30,1320,20L1440,10L1440,80L1320,80C1200,80,960,80,720,80C480,80,240,80,120,80L0,80Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}
