'use client'

import Link from 'next/link'
import { Play } from 'lucide-react'

export default function LandingHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/landing-bg.jpg"
          alt="ISAPM Medical Background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full w-full flex flex-col">
        {/* Top Section - 8th National Meeting */}
        <div className="p-8 md:p-12 pt-24 md:pt-[70px]">
          <div className="flex items-start gap-1">
            <span className="text-6xl md:text-7xl font-bold text-orange-400">8</span>
            <div className="flex flex-col text-white mt-2">
              <span className="text-xl md:text-2xl text-orange-400 font-semibold">Th</span>
              <span className="text-lg md:text-xl text-orange-400 font-semibold">National Meeting</span>
            </div>
          </div>
        </div>

        {/* Center Section - ISAPM */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-8xl md:text-[12rem] lg:text-[16rem] font-black leading-none tracking-tighter text-black">
              ISAPM
            </h1>
            <div className="text-right pr-0 md:pr-8 -mt-4 md:-mt-8">
              <span className="text-4xl md:text-6xl lg:text-7xl font-bold text-black">Vol. 8</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-end gap-8 md:px-12 md:py-8">
          {/* Left - Date and Location */}
          <div className="text-left">
            <p className="text-2xl md:text-3xl lg:text-4xl text-orange-300 font-semibold">APRIL 2026</p>
            <p className="text-2xl md:text-3xl lg:text-4xl text-orange-300 font-semibold">MALANG</p>
          </div>

          {/* Right - Organization Name and CTA */}
          <div className="text-right">
            <div className="mb-6">
              <p className="text-lg md:text-xl lg:text-2xl text-cyan-400 font-bold">Indonesian Society</p>
              <p className="text-lg md:text-xl lg:text-2xl text-cyan-400 font-bold">Anesthesiology for</p>
              <p className="text-lg md:text-xl lg:text-2xl text-cyan-400 font-bold">Pain Management</p>
            </div>
            
            <Link 
              href="#content"
              className="inline-flex items-center gap-3 text-xl md:text-2xl hover:text-cyan-400 transition-colors group text-red-600"
            >
              <span className="tracking-wider font-bold">START NOW</span>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 group-hover:border-cyan-400 flex items-center justify-center transition-colors text-red-600 border-red-600">
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-white group-hover:fill-cyan-400 text-red-600" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
