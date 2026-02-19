"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Quote } from "lucide-react"
import type { Webinar } from "@/lib/data/webinars"

interface WebinarDetailSpeakersProps {
  webinar: Webinar
}

export function WebinarDetailSpeakers({ webinar }: WebinarDetailSpeakersProps) {
  if (webinar.speakers.length === 0) return null

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
            Expert Panel
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Session Topics & Speakers</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn from leading experts in healthcare policy, pain management, and health financing
          </p>
        </div>

        {/* Speakers Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {webinar.speakers.map((speaker, index) => (
            <Card
              key={speaker.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-t-4"
              style={{ borderTopColor: speaker.color.replace("bg-", "var(--") + ")" }}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Speaker Image */}
                  <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                    <Image
                      src={speaker.image || "/placeholder.svg"}
                      alt={speaker.name}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  {/* Speaker Info */}
                  <div className="flex-1 p-5">
                    <Badge className={`mb-3 ${speaker.color} text-white border-0`}>
                      <Building2 className="w-3 h-3 mr-1" />
                      {speaker.organization}
                    </Badge>

                    <h3 className="text-lg font-bold mb-2 leading-tight group-hover:text-primary transition-colors">
                      {speaker.name}
                    </h3>

                    <div className="flex items-start gap-2 mt-3">
                      <Quote className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground line-clamp-3">"{speaker.topic}"</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
