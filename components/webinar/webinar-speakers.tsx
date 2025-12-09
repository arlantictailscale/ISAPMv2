import { Building2, GraduationCap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const speakers = [
  {
    id: 1,
    name: "Prof. dr. Dante Saksono Harbuwono, Sp.PD, KEMD, Ph.D",
    organization: "Ministry of Health (Kemenkes)",
    topic:
      "National Policy Direction for Equity in Pain Management: Integration into the Cancer, Heart, Stroke, and Uro-Nephrology (KJSU) Priority Programs",
    color: "primary",
  },
  {
    id: 2,
    name: "Dr. dr. A. Muh. Takdir Musba, Sp.An-TI, Subsp. M.N. (K)",
    organization: "ISAPM",
    topic: "Mapping the National Pain Management Workforce: Distribution, Competencies, and Challenges",
    color: "secondary",
  },
  {
    id: 3,
    name: "Irjen. Pol. Dr. dr. Asep Hendradiana, Sp.An-TI, Subsp.TI(K), M.Kes.",
    organization: "PP Perdatin",
    topic: "National Clinical Practice Guidelines (PNPK) for Pain: Standardization for Quality and Equity",
    color: "primary",
  },
  {
    id: 4,
    name: "Prof. dr. Ali Ghufron Mukti, M.Sc., Ph.D., AAK",
    organization: "BPJS Kesehatan",
    topic: "Equitable and Clinical Need-Based Financing for Pain Services: Strategies to Support Equal Access",
    color: "secondary",
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

        {/* Speakers Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {speakers.map((speaker) => (
            <Card
              key={speaker.id}
              className="overflow-hidden border-l-4 hover:shadow-lg transition-shadow"
              style={{
                borderLeftColor: speaker.color === "primary" ? "hsl(var(--primary))" : "hsl(var(--secondary))",
              }}
            >
              <CardContent className="p-6">
                {/* Organization Badge */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                    speaker.color === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  {speaker.organization}
                </div>

                {/* Speaker Name */}
                <h3 className="font-semibold text-foreground text-lg mb-3 leading-tight">{speaker.name}</h3>

                {/* Topic */}
                <div className="flex gap-3">
                  <GraduationCap className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground text-sm leading-relaxed">"{speaker.topic}"</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
