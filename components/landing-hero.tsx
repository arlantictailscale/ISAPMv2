"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronLeft, ChevronRight, Calendar, MapPin, Users, Award, Mic, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

// Slide data for the hero carousel
const slides = [
  {
    id: 1,
    badge: "8th National Meeting",
    title: "The Biggest Pain Management & Intervention Event in Indonesia",
    subtitle: "16-18 April, 2026 / The Singhasari Hotel, Batu, Malang",
    description:
      "Join Indonesia's premier pain management conference bringing together healthcare professionals to advance patient care.",
    cta: { text: "Register Now", href: "/events" },
    secondaryCta: { text: "Learn More", href: "#content" },
    icon: Calendar,
    gradient: "from-cyan-600/90 via-cyan-700/85 to-teal-800/90",
    accentColor: "cyan",
    image: "/medical-conference-auditorium-with-blue-lighting.jpg",
  },
  {
    id: 2,
    badge: "World-Class Speakers",
    title: "Learn from Leading Experts in Pain Management",
    subtitle: "International & National Keynote Speakers",
    description:
      "Gain insights from renowned specialists sharing the latest advances in anesthesiology and pain intervention techniques.",
    cta: { text: "View Speakers", href: "/events" },
    secondaryCta: { text: "See Schedule", href: "/events" },
    icon: Mic,
    gradient: "from-orange-500/90 via-orange-600/85 to-amber-700/90",
    accentColor: "orange",
    image: "/medical-professional-speaking-at-conference-podium.jpg",
  },
  {
    id: 3,
    badge: "Hands-On Workshops",
    title: "Interactive Workshops & Live Demonstrations",
    subtitle: "Practical Skills for Modern Practice",
    description:
      "Participate in hands-on sessions covering ultrasound-guided procedures, neuromodulation, and interventional techniques.",
    cta: { text: "Explore Workshops", href: "/events" },
    secondaryCta: { text: "View Pricing", href: "/pricing" },
    icon: Users,
    gradient: "from-teal-600/90 via-teal-700/85 to-cyan-800/90",
    accentColor: "teal",
    image: "/medical-workshop-with-doctors-practicing-procedure.jpg",
  },
  {
    id: 4,
    badge: "Submit Your Research",
    title: "Call for Abstracts & e-Poster Presentations",
    subtitle: "Share Your Research with the Community",
    description: "Present your findings to peers and contribute to advancing pain management knowledge in Indonesia.",
    cta: { text: "Submit Abstract", href: "/call-for-papers" },
    secondaryCta: { text: "Guidelines", href: "/call-for-papers" },
    icon: BookOpen,
    gradient: "from-violet-600/90 via-purple-700/85 to-indigo-800/90",
    accentColor: "violet",
    image: "/medical-research-poster-presentation-session.jpg",
  },
  {
    id: 5,
    badge: "Early Bird Discount",
    title: "Register Early & Save Up to 20%",
    subtitle: "Limited Time Offer - Don't Miss Out!",
    description:
      "Secure your spot at special early bird rates. Includes access to all sessions, workshops, and networking events.",
    cta: { text: "Get Early Bird Rate", href: "/pricing" },
    secondaryCta: { text: "View Packages", href: "/pricing" },
    icon: Award,
    gradient: "from-emerald-600/90 via-emerald-700/85 to-green-800/90",
    accentColor: "emerald",
    image: "/luxury-hotel-conference-venue-with-modern-architec.jpg",
  },
]

export default function LandingHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const minSwipeDistance = 50

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrentSlide(index)
      setTimeout(() => setIsTransitioning(false), 500)
    },
    [isTransitioning],
  )

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length)
  }, [currentSlide, goToSlide])

  // Autoplay logic
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(nextSlide, 6000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    setIsAutoPlaying(false)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) nextSlide()
    if (isRightSwipe) prevSlide()

    // Resume autoplay after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevSlide()
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
      }
      if (e.key === "ArrowRight") {
        nextSlide()
        setIsAutoPlaying(false)
        setTimeout(() => setIsAutoPlaying(true), 10000)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [nextSlide, prevSlide])

  const slide = slides[currentSlide]
  const SlideIcon = slide.icon

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-label="Hero carousel"
      role="region"
    >
      {/* Background Images with Crossfade */}
      {currentSlide === 0 ? (
        <>
          {/* Original gradient background for first slide */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

          {/* Animated gradient orbs - restored from original design */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Primary animated orb */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-r from-teal-500/30 to-cyan-500/30 rounded-full blur-3xl animate-float-slow" />
            {/* Secondary animated orb */}
            <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 rounded-full blur-3xl animate-float-medium" />
            {/* Tertiary orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-600/10 to-teal-600/10 rounded-full blur-3xl" />
            {/* Top accent orb */}
            <div className="absolute -top-20 right-1/4 w-64 h-64 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 rounded-full blur-2xl animate-float-slow" />
            {/* Bottom accent orb */}
            <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-gradient-to-r from-cyan-400/15 to-teal-400/15 rounded-full blur-2xl animate-float-medium" />
          </div>

          {/* Floating particles - restored from original */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[20%] left-[15%] w-2 h-2 bg-teal-400/40 rounded-full animate-float-slow" />
            <div className="absolute top-[40%] right-[20%] w-3 h-3 bg-cyan-400/30 rounded-full animate-float-medium" />
            <div className="absolute bottom-[30%] left-[25%] w-2 h-2 bg-emerald-400/35 rounded-full animate-float-slow" />
            <div className="absolute top-[60%] right-[35%] w-2.5 h-2.5 bg-teal-300/25 rounded-full animate-float-medium" />
            <div className="absolute bottom-[45%] right-[10%] w-2 h-2 bg-cyan-300/30 rounded-full animate-float-slow" />
            <div className="absolute top-[75%] left-[40%] w-3 h-3 bg-emerald-300/20 rounded-full animate-float-medium" />
          </div>

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </>
      ) : (
        /* Image backgrounds for other slides */
        slides.map((s, index) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === currentSlide ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={s.image || "/placeholder.svg"}
              alt=""
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
            />
            {/* Gradient overlay */}
            <div className={cn("absolute inset-0 bg-gradient-to-r", s.gradient)} />
            {/* Additional dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ))
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-32 md:pb-40 min-h-screen flex flex-col justify-center">
        {currentSlide === 0 ? (
          <div className="max-w-5xl mx-auto text-center">
            {/* ISAPM Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 backdrop-blur-sm mb-8 animate-slide-up">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-teal-300 uppercase tracking-wider">
                8th National Meeting 2026
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight text-white mb-6 animate-slide-up animation-delay-100">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                ISAPM
              </span>
              <br />
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                National Meeting
              </span>
            </h1>

            {/* Subtitle with icons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8 animate-slide-up animation-delay-200">
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-5 h-5 text-teal-400" />
                <span className="text-lg font-medium">16-18 April 2026</span>
              </div>
              <div className="hidden sm:block w-1.5 h-1.5 bg-teal-400/60 rounded-full" />
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="w-5 h-5 text-teal-400" />
                <span className="text-lg font-medium">The Singhasari Hotel, Batu, Malang</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-300">
              Join Indonesia&apos;s premier pain management conference bringing together healthcare professionals to
              advance patient care through knowledge sharing and innovation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up animation-delay-400">
              <Link
                href="/events"
                className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-full transition-all shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-105"
              >
                Register Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#content"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm hover:bg-white/15 border border-white/20 rounded-full transition-all hover:scale-105"
              >
                View Events
              </Link>
            </div>

            {/* Organization Badge */}
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-slide-up animation-delay-500">
              <div className="text-left">
                <p className="text-xs text-white/50 uppercase tracking-wider">Organized by</p>
                <p className="text-sm font-medium text-white/80">
                  Indonesian Society of Anesthesiology for Pain Management
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Other slides content - unchanged */
          <div className="max-w-4xl">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 transition-all duration-500",
                "bg-white/15 backdrop-blur-sm border border-white/20",
              )}
            >
              <SlideIcon className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white uppercase tracking-wide">{slide.badge}</span>
            </div>

            {/* Title with animation */}
            <h1
              key={`title-${currentSlide}`}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-white mb-6 animate-slide-up"
            >
              {slide.title}
            </h1>

            {/* Subtitle */}
            <div
              key={`subtitle-${currentSlide}`}
              className="flex items-center gap-3 mb-6 animate-slide-up animation-delay-100"
            >
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light italic">{slide.subtitle}</p>
            </div>

            {/* Description */}
            <p
              key={`desc-${currentSlide}`}
              className="text-base sm:text-lg md:text-xl text-white/80 mb-10 max-w-2xl animate-slide-up animation-delay-200"
            >
              {slide.description}
            </p>

            {/* CTA Buttons */}
            <div
              key={`cta-${currentSlide}`}
              className="flex flex-col sm:flex-row gap-4 animate-slide-up animation-delay-300"
            >
              <Link
                href={slide.cta.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-slate-900 bg-white hover:bg-white/90 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                {slide.cta.text}
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href={slide.secondaryCta.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/30 rounded-full transition-all hover:scale-105"
              >
                {slide.secondaryCta.text}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => {
          prevSlide()
          setIsAutoPlaying(false)
          setTimeout(() => setIsAutoPlaying(true), 10000)
        }}
        className={cn(
          "absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50",
          currentSlide === 0
            ? "bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 text-white hover:bg-teal-500/30"
            : "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20",
        )}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => {
          nextSlide()
          setIsAutoPlaying(false)
          setTimeout(() => setIsAutoPlaying(true), 10000)
        }}
        className={cn(
          "absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50",
          currentSlide === 0
            ? "bg-teal-500/20 backdrop-blur-sm border border-teal-500/30 text-white hover:bg-teal-500/30"
            : "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20",
        )}
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              goToSlide(index)
              setIsAutoPlaying(false)
              setTimeout(() => setIsAutoPlaying(true), 10000)
            }}
            className={cn(
              "relative h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50",
              index === currentSlide
                ? currentSlide === 0
                  ? "w-10 bg-teal-400" // Teal color for first slide
                  : "w-10 bg-white"
                : "w-3 bg-white/40 hover:bg-white/60",
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          >
            {/* Progress bar for autoplay */}
            {index === currentSlide && isAutoPlaying && (
              <span
                className={cn(
                  "absolute inset-0 rounded-full origin-left animate-progress",
                  currentSlide === 0 ? "bg-teal-300/50" : "bg-white/50",
                )}
                style={{ animationDuration: "6s" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Slide Counter */}
      <div
        className={cn(
          "absolute bottom-8 right-4 md:right-8 z-20 flex items-center gap-2 text-sm font-medium",
          currentSlide === 0 ? "text-teal-300/70" : "text-white/70",
        )}
      >
        <span className={cn("text-lg font-bold", currentSlide === 0 ? "text-teal-300" : "text-white")}>
          {String(currentSlide + 1).padStart(2, "0")}
        </span>
        <span>/</span>
        <span>{String(slides.length).padStart(2, "0")}</span>
      </div>

      {/* Bottom Decorative Wave - adjusted for first slide */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
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
