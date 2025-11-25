"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
      <div className="absolute inset-0 overflow-hidden">
        {/* Parallax gradient orbs - respond to mouse movement */}
        <div
          className="absolute top-10 left-10 w-[600px] h-[600px] bg-gradient-to-br from-cyan-500/30 to-teal-600/20 rounded-full blur-3xl animate-morph"
          style={{
            transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/25 to-amber-500/15 rounded-full blur-3xl animate-morph-reverse"
          style={{
            transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute bottom-20 left-1/4 w-[450px] h-[450px] bg-gradient-to-br from-cyan-400/20 to-blue-500/15 rounded-full blur-3xl animate-pulse-slow"
          style={{
            transform: `translate(${mousePosition.x * 25}px, ${mousePosition.y * 25}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute -bottom-20 right-1/4 w-[550px] h-[550px] bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-full blur-3xl animate-morph"
          style={{
            transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * -15}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />

        {/* Flowing light streams */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-stream-1" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-orange-400/15 to-transparent animate-stream-2" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent animate-stream-3" />
        </div>

        {/* Animated floating particles with trails */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-cyan-400/60 rounded-full animate-particle-trail-${(i % 4) + 1}`}
              style={{
                left: `${10 + i * 8}%`,
                top: `${20 + (i % 5) * 15}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <div className="absolute w-8 h-px bg-gradient-to-r from-cyan-400/40 to-transparent -left-8 top-0" />
            </div>
          ))}
        </div>

        {/* Rotating ring elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 border border-cyan-500/10 rounded-full animate-spin-slow" />
        <div
          className="absolute top-1/4 right-1/4 w-48 h-48 border border-orange-500/10 rounded-full animate-spin-reverse"
          style={{ marginTop: "32px", marginRight: "32px" }}
        />
        <div className="absolute bottom-1/3 left-1/6 w-80 h-80 border border-cyan-400/5 rounded-full animate-spin-slower" />

        {/* Hexagonal grid pattern with animation */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
              <polygon
                points="25,0 50,14.4 50,38.4 25,52.8 0,38.4 0,14.4"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" className="animate-pattern-drift" />
        </svg>

        {/* Animated wave layers */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-48 opacity-20"
          viewBox="0 0 2880 320"
          preserveAspectRatio="none"
        >
          <path
            className="animate-wave-flow-1"
            fill="none"
            stroke="url(#wave-gradient-1)"
            strokeWidth="2"
            d="M0,160 C480,100,960,220,1440,160 C1920,100,2400,220,2880,160"
          />
          <path
            className="animate-wave-flow-2"
            fill="none"
            stroke="url(#wave-gradient-2)"
            strokeWidth="2"
            d="M0,200 C480,140,960,260,1440,200 C1920,140,2400,260,2880,200"
          />
          <path
            className="animate-wave-flow-3"
            fill="none"
            stroke="url(#wave-gradient-1)"
            strokeWidth="1.5"
            d="M0,240 C480,180,960,300,1440,240 C1920,180,2400,300,2880,240"
          />
          <defs>
            <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Floating medical cross symbols */}
        <div className="absolute top-1/3 left-1/6 text-cyan-500/10 text-6xl font-light animate-float-rotate">+</div>
        <div className="absolute top-2/3 right-1/5 text-orange-500/10 text-5xl font-light animate-float-rotate-reverse">
          +
        </div>
        <div
          className="absolute bottom-1/4 left-2/3 text-cyan-400/10 text-4xl font-light animate-float-rotate"
          style={{ animationDelay: "2s" }}
        >
          +
        </div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/60" />
      </div>
      {/* End animated background */}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-20 md:pb-32">
        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tight text-white mb-8 max-w-6xl drop-shadow-lg">
          The Biggest Pain Management & Intervention Event in Indonesia
        </h1>

        {/* Event Details */}
        <div className="space-y-2 mb-12 text-lg sm:text-xl md:text-2xl lg:text-3xl">
          <p className="italic text-cyan-100/90 font-light drop-shadow-md">
            16-18 April, 2026 / The Singhasari Hotel, Batu, Malang
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <Link
            href="/events"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-full transition-all shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105"
          >
            Register Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="#content"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full transition-all hover:scale-105"
          >
            Learn More
          </Link>
        </div>

        {/* Additional Info Badge */}
        <div className="mt-16 inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full shadow-lg border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-orange-400">8</span>
            <span className="text-sm font-semibold text-white">
              <span className="text-orange-400">TH</span> National Meeting
            </span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-sm font-medium text-cyan-100">
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
        @keyframes morph {
          0%, 100% { 
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: scale(1) rotate(0deg);
          }
          25% { 
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: scale(1.05) rotate(5deg);
          }
          50% { 
            border-radius: 50% 60% 30% 60% / 30% 40% 70% 50%;
            transform: scale(1.1) rotate(-5deg);
          }
          75% { 
            border-radius: 60% 40% 60% 30% / 70% 50% 40% 60%;
            transform: scale(1.05) rotate(3deg);
          }
        }
        @keyframes morph-reverse {
          0%, 100% { 
            border-radius: 40% 60% 70% 30% / 40% 70% 30% 60%;
            transform: scale(1) rotate(0deg);
          }
          25% { 
            border-radius: 70% 30% 40% 60% / 60% 30% 60% 50%;
            transform: scale(1.08) rotate(-5deg);
          }
          50% { 
            border-radius: 30% 50% 60% 40% / 70% 60% 40% 30%;
            transform: scale(1.05) rotate(5deg);
          }
          75% { 
            border-radius: 50% 70% 30% 60% / 40% 50% 70% 60%;
            transform: scale(1.1) rotate(-3deg);
          }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.15); }
        }
        @keyframes stream-1 {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes stream-2 {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes stream-3 {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes particle-trail-1 {
          0% { transform: translate(0, 0); opacity: 0.6; }
          100% { transform: translate(100px, -150px); opacity: 0; }
        }
        @keyframes particle-trail-2 {
          0% { transform: translate(0, 0); opacity: 0.5; }
          100% { transform: translate(-80px, -120px); opacity: 0; }
        }
        @keyframes particle-trail-3 {
          0% { transform: translate(0, 0); opacity: 0.6; }
          100% { transform: translate(60px, -180px); opacity: 0; }
        }
        @keyframes particle-trail-4 {
          0% { transform: translate(0, 0); opacity: 0.5; }
          100% { transform: translate(-100px, -100px); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pattern-drift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(25px, 25px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes wave-flow-1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-flow-2 {
          0% { transform: translateX(-25%); }
          100% { transform: translateX(-75%); }
        }
        @keyframes wave-flow-3 {
          0% { transform: translateX(-10%); }
          100% { transform: translateX(-60%); }
        }
        @keyframes float-rotate {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.1; }
          25% { transform: translate(10px, -20px) rotate(90deg); opacity: 0.15; }
          50% { transform: translate(0, -30px) rotate(180deg); opacity: 0.1; }
          75% { transform: translate(-10px, -15px) rotate(270deg); opacity: 0.15; }
        }
        @keyframes float-rotate-reverse {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.1; }
          25% { transform: translate(-15px, -10px) rotate(-90deg); opacity: 0.12; }
          50% { transform: translate(-5px, -25px) rotate(-180deg); opacity: 0.1; }
          75% { transform: translate(10px, -15px) rotate(-270deg); opacity: 0.12; }
        }
        .animate-morph { animation: morph 12s ease-in-out infinite; }
        .animate-morph-reverse { animation: morph-reverse 10s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-stream-1 { animation: stream-1 8s linear infinite; }
        .animate-stream-2 { animation: stream-2 10s linear infinite 2s; }
        .animate-stream-3 { animation: stream-3 9s linear infinite 4s; }
        .animate-particle-trail-1 { animation: particle-trail-1 4s ease-out infinite; }
        .animate-particle-trail-2 { animation: particle-trail-2 5s ease-out infinite; }
        .animate-particle-trail-3 { animation: particle-trail-3 4.5s ease-out infinite; }
        .animate-particle-trail-4 { animation: particle-trail-4 5.5s ease-out infinite; }
        .animate-spin-slow { animation: spin-slow 30s linear infinite; }
        .animate-spin-slower { animation: spin-slow 45s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 25s linear infinite; }
        .animate-pattern-drift { animation: pattern-drift 30s ease-in-out infinite; }
        .animate-wave-flow-1 { animation: wave-flow-1 12s linear infinite; }
        .animate-wave-flow-2 { animation: wave-flow-2 15s linear infinite; }
        .animate-wave-flow-3 { animation: wave-flow-3 18s linear infinite; }
        .animate-float-rotate { animation: float-rotate 10s ease-in-out infinite; }
        .animate-float-rotate-reverse { animation: float-rotate-reverse 12s ease-in-out infinite; }
      `}</style>
    </section>
  )
}
