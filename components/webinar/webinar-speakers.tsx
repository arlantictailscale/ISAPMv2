import { Building2, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Session Topics & Speakers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Learn from leading experts in healthcare policy, pain management, and health financing
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {speakers.map((speaker) => (
            <Card key={speaker.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Speaker Image Container */}
                  <div className="relative w-full sm:w-40 h-48 sm:h-auto shrink-0 overflow-hidden">
                    {/* Gradient Overlay */}
                    <div
                      className={`absolute inset-0 z-10 opacity-20 ${
                        speaker.color === "primary"
                          ? "bg-gradient-to-br from-primary/40 to-transparent"
                          : "bg-gradient-to-br from-secondary/40 to-transparent"
                      }`}
                    />
                    {/* Speaker Photo */}
                    <Image
                      src={speaker.image || "/placeholder.svg"}
                      alt={speaker.name}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 160px"
                    />
                    {/* Bottom Gradient for text readability on mobile */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />
                  </div>

                  {/* Speaker Info */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                    {/* Organization Badge */}
                    <div>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 ${
                          speaker.color === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {speaker.organization}
                      </div>

                      {/* Speaker Name */}
                      <h3 className="font-semibold text-foreground text-base md:text-lg mb-3 leading-tight">
                        {speaker.name}
                      </h3>
                    </div>

                    {/* Topic */}
                    <div className="flex gap-3 mt-auto">
                      <GraduationCap className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">"{speaker.topic}"</p>
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
