"use client"

import { Calendar, MapPin, Users, Award, BookOpen, Stethoscope, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

const eventHighlights = [
  {
    icon: BookOpen,
    title: "CPD Courses",
    description: "Comprehensive training sessions on pain management fundamentals",
    date: "April 16-17, 2026",
  },
  {
    icon: Stethoscope,
    title: "Symposium",
    description: "Scientific presentations and clinical case discussions",
    date: "April 18, 2026",
  },
  {
    icon: Users,
    title: "Workshops",
    description: "Hands-on practical sessions with expert guidance",
    date: "April 17, 2026",
  },
  {
    icon: MapPin,
    title: "City Tours",
    description: "Explore the beautiful Batu Malang region",
    date: "April 19, 2026",
  },
]

const includedBenefits = [
  "Access to all scientific sessions",
  "Conference materials & certificate",
  "Lunch and coffee breaks",
  "4 bonus webinars included",
  "Networking opportunities",
  "E-poster presentation access",
]

export default function BrochureSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-teal-500 to-purple-600" />
      <div className="absolute inset-0 bg-[url('/abstract-medical-pattern-subtle.jpg')] opacity-5" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Calendar className="w-4 h-4" />
            <span>April 16-19, 2026</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 text-balance">
            8th National Meeting
          </h2>
          <p className="text-xl md:text-2xl text-white/90 font-medium mb-2">
            Indonesian Society of Anesthesiology for Pain Management
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Join leading experts and practitioners for 4 days of learning, networking, and advancing pain management
            practices in Indonesia.
          </p>
        </div>

        {/* Event Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {eventHighlights.map((event, index) => (
            <div
              key={event.title}
              className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <event.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
              <p className="text-white/70 text-sm mb-3">{event.description}</p>
              <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
                <Clock className="w-4 h-4" />
                {event.date}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Venue Info */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 lg:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Venue</h3>
                <p className="text-white/80">The Singhasari Resort & Convention</p>
              </div>
            </div>

            <div className="aspect-video rounded-2xl overflow-hidden mb-6 relative">
              <Image
                src="/images/singhasari-hotel.png"
                alt="The Singhasari Resort & Convention"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-medium">Batu, Malang, East Java</p>
                <p className="text-white/80 text-sm">A stunning 5-star resort with panoramic mountain views</p>
              </div>
            </div>

            <Link href="/venue">
              <Button
                variant="outline"
                className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View Venue Details
              </Button>
            </Link>
          </div>

          {/* Right: Benefits */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">What's Included</h3>
            </div>

            <div className="space-y-4 mb-8">
              {includedBenefits.map((benefit, index) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-4 hover:bg-white/10 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-white/90">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/pricing" className="flex-1">
                <Button
                  size="lg"
                  className="w-full bg-white text-teal-600 hover:bg-white/90 font-semibold text-lg h-14 shadow-lg shadow-black/20"
                >
                  View Pricing
                </Button>
              </Link>
              <Link href="/events" className="flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold text-lg h-14"
                >
                  Event Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "4", label: "Days of Events" },
            { value: "50+", label: "Expert Speakers" },
            { value: "4", label: "Bonus Webinars" },
            { value: "500+", label: "Expected Attendees" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl py-6 px-4"
            >
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white/70 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
