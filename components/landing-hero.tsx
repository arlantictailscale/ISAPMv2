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
      {slides.map((s, index) => (
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
      ))}

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float-medium" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-32 md:pb-40 min-h-screen flex flex-col justify-center">
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
            {currentSlide === 0 && (
              <>
                <Calendar className="w-5 h-5 text-white/80" />
                <MapPin className="w-5 h-5 text-white/80 -ml-2" />
              </>
            )}
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

          {/* ISAPM Badge - only on first slide */}
          {currentSlide === 0 && (
            <div className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-white/15 backdrop-blur-sm rounded-full border border-white/20 animate-slide-up animation-delay-400">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white">8</span>
                <span className="text-sm font-semibold text-white/90">
                  <span className="text-orange-300">TH</span> National Meeting
                </span>
              </div>
              <div className="w-px h-8 bg-white/30" />
              <div className="text-sm font-medium text-white/90">
                Indonesian Society of Anesthesiology for Pain Management
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => {
          prevSlide()
          setIsAutoPlaying(false)
          setTimeout(() => setIsAutoPlaying(true), 10000)
        }}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
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
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
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
              index === currentSlide ? "w-10 bg-white" : "w-3 bg-white/40 hover:bg-white/60",
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          >
            {/* Progress bar for autoplay */}
            {index === currentSlide && isAutoPlaying && (
              <span
                className="absolute inset-0 bg-white/50 rounded-full origin-left animate-progress"
                style={{ animationDuration: "6s" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-8 right-4 md:right-8 z-20 flex items-center gap-2 text-white/70 text-sm font-medium">
        <span className="text-white text-lg font-bold">{String(currentSlide + 1).padStart(2, "0")}</span>
        <span>/</span>
        <span>{String(slides.length).padStart(2, "0")}</span>
      </div>

      {/* Bottom Decorative Wave */}
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
