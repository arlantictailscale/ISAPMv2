"use client"

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

export default function SymposiumPage() {
  const symposiumSchedule = {
    grandTheme: "Practical Pain Management for Doctors and Nurses: From Assessment, Safe Analgesic Use, and Intervention Pain Management",
    date: "Friday, April 17, 2026",
    agenda: [
      { time: "07.30 – 08.00", activity: "Re-Registration + Onsite Registration", speaker: "Committee" },
      { time: "08.00 – 08.05", activity: "Opening Ceremony", speaker: "Committee" },
      { time: "08.05 – 08.25", activity: "Ethics and Patient Safety in Pain Management", speaker: "TBD" },
      { time: "08.25 – 08.45", activity: "Realizing Integrated Pain Services: Regulatory Challenges and Implementation in Health Facilities", speaker: "TBD" },
      { time: "08.45 – 09.05", activity: "The Role of BPJS Kesehatan in Ensuring Access, Quality, and Efficiency of Pain Services in Indonesia", speaker: "TBD" },
      { time: "09.05– 09.25", activity: "Bridging Policy and Practice: Synergy of the Anesthesia Profession with the Ministry of Health and BPJS in Recognition of Pain Services", speaker: "TBD" },
      { time: "09.25– 09.55", activity: "DISCUSSION", speaker: "-" },
      { time: "09.55– 10.15", activity: "Industrial Symposium", speaker: "TBD" },
      { time: "10.15 – 10.35", activity: "Multimodal Analgesia for Acute Postoperative Pain: Current Evidence and Future Directions", speaker: "TBD" },
      { time: "10.35 - 10.55", activity: "Preventing Transition from Acute to Chronic Post-Surgical Pain: Early Recognition and Intervention", speaker: "TBD" },
      { time: "10.55 – 11.15", activity: "Integration of Acute Pain Service (APS) in Perioperative Care in Hospitals", speaker: "TBD" },
      { time: "11.15 – 11.25", activity: "DISCUSSION", speaker: "-" },
      { time: "11.25 -11.45", activity: "Ultrasound-Guided Pain Interventions: Evidence-Based Updates, Clinical Pearls, and Future Directions", speaker: "TBD" },
      { time: "11.45-12.05", activity: "Steroid Injections in Pain Medicine: Still Relevant or Outdated?", speaker: "TBD" },
      { time: "12.05-12.25", activity: "Sugar Heals: Understanding the Science Behind Dextrose Prolotherapy in Chronic Pain Management", speaker: "TBD" },
      { time: "12.25-12.35", activity: "DISCUSSION", speaker: "-" },
      { time: "12.35 – 13.15", activity: "Break and Lunch Symposium", speaker: "TBD" },
      { time: "13.15-13.35", activity: "Regenerative Pain Medicine: From Biologic Science to Ultrasound-Guided Clinical Application", speaker: "TBD" },
      { time: "13.35– 13.55", activity: "Secretome and Exosome-Based Therapy: Evidence, Mechanism, and Clinical Potential in Pain and Tissue Repair", speaker: "TBD" },
      { time: "13.55– 14.15", activity: "Comparative Effectiveness of Regenerative Pain Interventions: PRP, Stem Cell, and Biologic Derivatives in Chronic Pain Management", speaker: "TBD" },
      { time: "14.15 – 14.25", activity: "DISCUSSION", speaker: "-" },
      { time: "14.25– 14.45", activity: "Industrial Symposium 2", speaker: "TBD" },
      { time: "14.45 – 15.05", activity: "Radiofrequency Interventions for Chronic Pain: Current Evidence, Expanding Indications, and Long-Term Outcomes", speaker: "TBD" },
      { time: "15.05 – 15.25", activity: "From Needles to Neuromodulation: Advances in Minimally Invasive Pain Procedures", speaker: "TBD" },
      { time: "15.25-15.45", activity: "Hybrid Regenerative-Radiofrequency Techniques: Combining Biologic and Thermal Modulation for Enhanced Pain Relief", speaker: "TBD" },
      { time: "15.45-15.55", activity: "DISCUSSION", speaker: "-" },
      { time: "15.55-16.15", activity: "Interventional Pain Procedures in Palliative Care: Balancing Efficacy, Safety, and Quality of Life", speaker: "TBD" },
      { time: "16.15-16.35", activity: "Integrated Palliative Pain Management: Bridging Pharmacologic, Interventional, and Psychosocial Strategies", speaker: "TBD" },
      { time: "16.35-16.45", activity: "DISCUSSION", speaker: "-" },
      { time: "16.45-17.00", activity: "Closing & E-Poster Winner Announcement", speaker: "Committee" },
    ],
  }

  return (
    <>
      <Navigation />
      <main className="pt-24">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">Symposium</h1>
            <p className="text-lg text-muted-foreground mb-2">{symposiumSchedule.grandTheme}</p>
            <p className="text-md text-muted-foreground">Date: {symposiumSchedule.date}</p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <h2 className="font-display text-3xl font-bold text-primary mb-6">Agenda</h2>
            <div className="space-y-4">
              {symposiumSchedule.agenda.map((item, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border ${
                    item.activity.includes("DISCUSSION") || item.activity.includes("Break") || item.activity.includes("Industrial Symposium")
                      ? "bg-accent/10 border-accent/30 md:col-span-full"
                      : "bg-card border-border hover:border-primary/50"
                  } transition-colors`}
                >
                  <div className="md:col-span-2">
                    <p className="text-sm font-bold text-primary">{item.time}</p>
                  </div>
                  <div className="md:col-span-7">
                    <p className="font-semibold text-foreground">{item.activity}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm text-muted-foreground">
                      {item.speaker === "-" ? "-" : `Speaker: ${item.speaker}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
