"use client"

import Link from "next/link"
import CountdownTimer from "./countdown-timer"
import Image from "next/image"

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-x-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/surgical-background.jpg"
          alt="Medical professionals in surgery"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-white"></div>
      </div>

      {/* Decorative Elements */}

      <div className="absolute bottom-0 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center space-y-8">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight text-balance px-4 drop-shadow-lg font-sans font-extrabold text-primary">
            Indonesian Society Anesthesiology for Pain Management (ISAPM) 8th National Meeting 2026
          </h1>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-secondary text-balance drop-shadow-lg">
            Bridging The Gaps
          </h2>

          <p className="text-lg sm:text-xl text-white/90 font-light max-w-3xl mx-auto text-balance drop-shadow-md">
            Equity, Access, and Excellence in Pain Management
          </p>

          <div className="pt-4 space-y-2 text-white/90">
            <p className="text-lg font-semibold drop-shadow-md text-lime-300">April 16-18, 2026</p>
            <p className="text-base drop-shadow-md text-sky-100">
              The Singhasari Resort & Convention Batu, Malang, Jawa Timur, Indonesia
            </p>
          </div>

          <div className="pt-8">
            <CountdownTimer />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-lg font-bold hover:shadow-lg transition-all text-lg text-center bg-red-700 text-background"
            >
              Register Now
            </Link>
            <Link
              href="/submit-poster"
              className="border-2 text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition-all text-center text-lg bg-foreground border-transparent"
            >
              Submit e-Poster
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
