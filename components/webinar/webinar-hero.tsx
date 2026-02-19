import { Calendar, Clock, Video, Users } from "lucide-react"

export function WebinarHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Video className="w-4 h-4" />
            <span>Online Webinar</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
            Achieving Equity in{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pain Management Services
            </span>{" "}
            in Indonesia
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Synergy between Anesthesiologists, Government Regulations, and BPJS Health Financing Schemes
          </p>

          {/* Event Details */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">Friday, January 30, 2026</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium">13:00 WIB - End</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">4 Expert Speakers</span>
            </div>
          </div>

          {/* Price Badge */}
          <div className="inline-flex items-center gap-3 bg-card border border-border rounded-2xl px-6 py-4 shadow-lg">
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Bundle Price - All 4 Webinars</p>
              <p className="text-2xl font-bold text-primary">Rp 100.000</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <a
              href="#registration"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Register Now
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
