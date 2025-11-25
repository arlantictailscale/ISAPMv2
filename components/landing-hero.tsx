"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LandingHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-orange-300/15 to-orange-500/15 rounded-full blur-3xl animate-float-medium"></div>
        <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-gradient-to-br from-cyan-300/15 to-teal-400/15 rounded-full blur-3xl animate-float-reverse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full blur-3xl animate-float-slow"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400/40 rounded-full animate-particle-1"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-orange-400/30 rounded-full animate-particle-2"></div>
        <div className="absolute top-2/3 left-1/3 w-2 h-2 bg-teal-400/40 rounded-full animate-particle-3"></div>
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-cyan-500/30 rounded-full animate-particle-4"></div>
        <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-amber-400/30 rounded-full animate-particle-5"></div>
        <div className="absolute top-1/5 right-1/2 w-2 h-2 bg-cyan-300/40 rounded-full animate-particle-6"></div>

        {/* Animated subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0 animate-grid-shift"
            style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          ></div>
        </div>

        {/* Animated wave lines */}
        <svg
          className="absolute bottom-0 left-0 w-full h-64 opacity-10"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            className="animate-wave-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,112C672,107,768,149,864,165.3C960,181,1056,171,1152,149.3C1248,128,1344,96,1392,80L1440,64"
          />
          <path
            className="animate-wave-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            d="M0,256L48,234.7C96,213,192,171,288,165.3C384,160,480,192,576,208C672,224,768,224,864,213.3C960,203,1056,181,1152,181.3C1248,181,1344,203,1392,213.3L1440,224"
          />
        </svg>
      </div>
      {/* End animated background */}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-20 md:pb-32">
        {/* Main Headline - Large bold headline matching reference style */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tight text-slate-900 mb-8 max-w-6xl drop-shadow-sm">
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
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="#content"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-cyan-700 bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-cyan-600 rounded-full transition-all hover:scale-105"
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

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 20px) scale(1.08); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, 25px) scale(1.03); }
        }
        @keyframes particle-float-1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(20px, -40px); opacity: 0.8; }
        }
        @keyframes particle-float-2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(-30px, -20px); opacity: 0.7; }
        }
        @keyframes particle-float-3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(15px, 30px); opacity: 0.6; }
        }
        @keyframes particle-float-4 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(-25px, -35px); opacity: 0.7; }
        }
        @keyframes particle-float-5 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(35px, -15px); opacity: 0.6; }
        }
        @keyframes particle-float-6 {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(-20px, 25px); opacity: 0.8; }
        }
        @keyframes grid-shift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(10px, 10px); }
        }
        @keyframes wave-flow-1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50px); }
        }
        @keyframes wave-flow-2 {
          0% { transform: translateX(0); }
          100% { transform: translateX(50px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 7s ease-in-out infinite; }
        .animate-particle-1 { animation: particle-float-1 4s ease-in-out infinite; }
        .animate-particle-2 { animation: particle-float-2 5s ease-in-out infinite 0.5s; }
        .animate-particle-3 { animation: particle-float-3 6s ease-in-out infinite 1s; }
        .animate-particle-4 { animation: particle-float-4 4.5s ease-in-out infinite 0.3s; }
        .animate-particle-5 { animation: particle-float-5 5.5s ease-in-out infinite 0.8s; }
        .animate-particle-6 { animation: particle-float-6 4s ease-in-out infinite 1.2s; }
        .animate-grid-shift { animation: grid-shift 20s ease-in-out infinite; }
        .animate-wave-1 { animation: wave-flow-1 8s linear infinite; }
        .animate-wave-2 { animation: wave-flow-2 10s linear infinite; }
      `}</style>
    </section>
  )
}
