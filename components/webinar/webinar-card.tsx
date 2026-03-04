"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  Bell,
  CheckCircle2,
  Youtube,
} from "lucide-react"
import { type Webinar, formatWebinarDate } from "@/lib/data/webinars"

interface WebinarCardProps {
  webinar: Webinar
  index: number
  onViewDetails?: () => void
}

export function WebinarCard({ webinar, index, onViewDetails }: WebinarCardProps) {
  const isActive = webinar.status === "active"
  const isComingSoon = webinar.status === "coming_soon"
  const isSoldOut = webinar.status === "sold_out"
  const isCompleted = webinar.status === "completed"

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 card-lift perspective-1000 ${
        isActive 
          ? "border-primary/20 hover:border-primary/40 elevated-card" 
          : isCompleted
          ? "border-violet-200/50 bg-gradient-to-br from-violet-50 via-pink-50 to-cyan-50 hover:shadow-lg hover:shadow-violet-200/50 hover:border-violet-300"
          : "border-muted bg-muted/30"
      }`}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        {isActive && (
          <Badge className="bg-green-500 text-white border-0 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Open Registration
          </Badge>
        )}
        {isComingSoon && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
            <Bell className="w-4 h-4 mr-1" />
            Coming Soon
          </Badge>
        )}
        {isCompleted && (
          <Badge className="bg-slate-600 text-white border-0 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )}
        {isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
      </div>

      {/* Webinar Number Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all group-hover:scale-110 ${
            isActive
              ? "bg-primary text-primary-foreground glow-accent-cyan"
              : isCompleted
              ? "bg-gradient-to-br from-violet-400 to-pink-400 text-white shadow-md shadow-violet-300/50"
              : "bg-muted-foreground/20 text-muted-foreground"
          }`}
        >
          {index + 1}
        </div>
      </div>

      <CardContent className="p-6 pt-16 transition-transform duration-300 group-hover:scale-[1.02]">
        {/* Title with gradient on active */}
        <h3
          className={`text-xl font-bold mb-3 line-clamp-2 ${isActive ? "text-foreground group-hover:gradient-text" : "text-muted-foreground"}`}
        >
          {isActive ? webinar.shortTitle : webinar.title}
        </h3>

        {/* Description */}
        <p className={`text-sm mb-4 line-clamp-3 ${isActive ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
          {webinar.description}
        </p>

        {/* Date & Time for Active Webinars */}
        {isActive && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatWebinarDate(webinar.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>
                {webinar.time} {webinar.timezone} ({webinar.duration})
              </span>
            </div>
            {webinar.speakers.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span>{webinar.speakers.length} Expert Speakers</span>
              </div>
            )}
          </div>
        )}

        {/* Speaker Avatars for Active Webinars */}
        {isActive && webinar.speakers.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {webinar.speakers.slice(0, 4).map((speaker) => (
                <div key={speaker.id} className="w-8 h-8 rounded-full border-2 border-background overflow-hidden">
                  <Image
                    src={speaker.image || "/placeholder.svg"}
                    alt={speaker.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {webinar.speakers.length > 4 ? `+${webinar.speakers.length - 4} more` : "speakers"}
            </span>
          </div>
        )}

        {/* Tags for Active Webinars */}
        {isActive && webinar.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {webinar.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA - View Details button for active/completed, Coming Soon disabled for others */}
        <div className="flex items-center justify-end pt-4 border-t">
          {isActive ? (
            <Button size="sm" className="group/btn" onClick={onViewDetails}>
              View Details
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          ) : isCompleted ? (
            <a href={`https://youtube.com/watch?v=${webinar.videoId || ""}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="group/btn bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
                <Youtube className="w-4 h-4 mr-2" />
                Watch on Youtube
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </a>
          ) : (
            <Button variant="outline" disabled className="bg-transparent">
              <Bell className="w-4 h-4 mr-1" />
              Coming Soon
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
