"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Video, Users, Award, PlayCircle, FileText, MessageCircle } from "lucide-react"
import type { Webinar } from "@/lib/data/webinars"
import { formatWebinarDate } from "@/lib/data/webinars"

interface WebinarDetailHeroProps {
  webinar: Webinar
}

export function WebinarDetailHero({ webinar }: WebinarDetailHeroProps) {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" />
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-3 py-1">
              <Video className="w-3 h-3 mr-1" />
              Online Webinar
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-600">
              Registration Open
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {webinar.title}
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 text-pretty">{webinar.description}</p>

          {/* Event Details */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatWebinarDate(webinar.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium">
                  {webinar.time} {webinar.timezone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Speakers</p>
                <p className="font-medium">{webinar.speakers.length} Experts</p>
              </div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {webinar.benefits.map((benefit) => {
              const IconComponent =
                {
                  Video: Video,
                  MessageCircle: MessageCircle,
                  Award: Award,
                  PlayCircle: PlayCircle,
                  FileText: FileText,
                }[benefit.icon] || Video

              return (
                <div key={benefit.title} className="flex flex-col items-center text-center p-3 rounded-lg bg-white/50">
                  <IconComponent className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs font-medium">{benefit.title}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
