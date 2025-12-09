import { Building2, GraduationCap, Sparkles } from "lucide-react"
import Image from "next/image"

const speakers = [
  {
    id: 1,
    name: "Prof. dr. Dante Saksono Harbuwono, Sp.PD, KEMD, Ph.D",
    organization: "Ministry of Health (Kemenkes)",
    topic:
      "National Policy Direction for Equity in Pain Management: Integration into the Cancer, Heart, Stroke, and Uro-Nephrology (KJSU) Priority Programs",
    color: "primary",
    image: "/images/speakers/dr-dante.jpg",
  },
  {
    id: 2,
    name: "Dr. dr. A. Muh. Takdir Musba, Sp.An-TI, Subsp. M.N. (K)",
    organization: "ISAPM",
    topic: "Mapping the National Pain Management Workforce: Distribution, Competencies, and Challenges",
    color: "secondary",
    image: "/images/speakers/dr-muh-takdir.jpeg",
  },
  {
    id: 3,
    name: "Irjen. Pol. Dr. dr. Asep Hendradiana, Sp.An-TI, Subsp.TI(K), M.Kes.",
    organization: "PP Perdatin",
    topic: "National Clinical Practice Guidelines (PNPK) for Pain: Standardization for Quality and Equity",
    color: "primary",
    image: "/images/speakers/dr-asep.png",
  },
  {
    id: 4,
    name: "Prof. dr. Ali Ghufron Mukti, M.Sc., Ph.D., AAK",
    organization: "BPJS Kesehatan",
    topic: "Equitable and Clinical Need-Based Financing for Pain Services: Strategies to Support Equal Access",
    color: "secondary",
    image: "/images/speakers/prof-ali-ghufron.jpg",
  },
]

export function WebinarSpeakers() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Expert Panel
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Session Topics & Speakers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Learn from leading experts in healthcare policy, pain management, and health financing
          </p>
        </div>

        {/* Speakers Grid */}
        <div className="grid gap-8 lg:gap-10 md:grid-cols-2">
          {speakers.map((speaker, index) => (
            <div
              key={speaker.id}
              className="group relative bg-background rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-border/50"
            >
              {/* Accent line at top */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  speaker.color === "primary"
                    ? "bg-gradient-to-r from-primary via-primary/80 to-primary/40"
                    : "bg-gradient-to-r from-secondary via-secondary/80 to-secondary/40"
                }`}
              />

              <div className="flex flex-col sm:flex-row">
                {/* Speaker Image Container - Enhanced */}
                <div className="relative w-full sm:w-52 h-64 sm:h-72 shrink-0">
                  {/* Decorative frame */}
                  <div
                    className={`absolute inset-2 sm:inset-3 rounded-xl overflow-hidden ${
                      speaker.color === "primary"
                        ? "ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                        : "ring-2 ring-secondary/20 ring-offset-2 ring-offset-background"
                    }`}
                  >
                    {/* Main Image */}
                    <Image
                      src={speaker.image || "/placeholder.svg"}
                      alt={speaker.name}
                      fill
                      className="object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 640px) 100vw, 208px"
                    />

                    {/* Gradient Overlay for depth */}
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${
                        speaker.color === "primary"
                          ? "bg-gradient-to-t from-primary/60 via-transparent to-transparent"
                          : "bg-gradient-to-t from-secondary/60 via-transparent to-transparent"
                      }`}
                    />
                  </div>

                  {/* Decorative corner accent */}
                  <div
                    className={`absolute bottom-0 right-0 w-16 h-16 ${
                      speaker.color === "primary" ? "bg-primary/10" : "bg-secondary/10"
                    } rounded-tl-3xl hidden sm:block`}
                  />
                </div>

                {/* Speaker Info */}
                <div className="flex-1 p-6 sm:p-7 flex flex-col">
                  {/* Organization Badge */}
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-4 w-fit ${
                      speaker.color === "primary"
                        ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20"
                        : "bg-gradient-to-r from-secondary/15 to-secondary/5 text-secondary border border-secondary/20"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {speaker.organization}
                  </div>

                  {/* Speaker Name */}
                  <h3 className="font-bold text-foreground text-lg md:text-xl mb-4 leading-snug group-hover:text-primary transition-colors duration-300">
                    {speaker.name}
                  </h3>

                  {/* Topic with enhanced styling */}
                  <div
                    className={`flex gap-3 mt-auto p-4 rounded-xl ${
                      speaker.color === "primary" ? "bg-primary/5" : "bg-secondary/5"
                    }`}
                  >
                    <GraduationCap
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        speaker.color === "primary" ? "text-primary" : "text-secondary"
                      }`}
                    />
                    <p className="text-muted-foreground text-sm leading-relaxed">"{speaker.topic}"</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
