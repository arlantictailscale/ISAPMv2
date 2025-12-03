"use client"

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function WorkshopPage() {
  const [selectedWorkshop, setSelectedWorkshop] = useState<(typeof workshopDetails)[0] | null>(null)

  const workshopDetails = [
    {
      no: 1,
      title: "Regenerative Pain Therapy",
      participant: "Anesthesiology and Intensive Therapy Specialist",
      director: "dr. Ahmad Muttaqin 'Alim, Sp.An-TI., FIP., MSc., DM",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30-08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00-08.15", event: "Opening & Pretest", speaker: "Committee Chair" },
        { time: "08.15-08.45", event: "Pathophysiology of Chronic Pain and Tissue Healing Mechanisms", speaker: "TBD" },
        {
          time: "08.45– 09.30",
          event: "Principles and Evidence of Prolotherapy and PRP in Pain Management",
          speaker: "TBD",
        },
        {
          time: "09.30-10.15",
          event:
            "Comparison of Regenerative vs Conventional Steroid Injections (efikasi, keamanan, cost-effectiveness)",
          speaker: "TBD",
        },
        { time: "10.15-10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30 – 11.15",
          event: "Introduction to Microinvasive Procedures: Dry Needling, Perineural Injection, and Hydrodissection",
          speaker: "TBD",
        },
        {
          time: "11.15-12.00",
          event: "Complications and Safety Checklist in Regenerative and Microinvasive Procedures",
          speaker: "TBD",
        },
        { time: "12.00-13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00-15.30",
          event:
            "Station 1: PRP Preparation and Injection Technique (USG-guided)\nStation 2: Prolotherapy Injection Technique\nStation 3: Microinvasive Needling / Hydrodissection Techniques",
          speaker: "Instructor",
        },
        { time: "15.30-16.00", event: "CLOSING", speaker: "Committee" },
      ],
    },
    {
      no: 2,
      title: "Basic Interventional Pain Management (Musculoskeletal)",
      participant: "Anesthesiology and Intensive Therapy Specialist",
      director: "dr. John Frans Sitepu, M.Ked (An), Sp.An-TI, Subsp. MN (K), FIPM",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30-08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00-08.15", event: "Opening & Pretest", speaker: "Committee Chair" },
        {
          time: "08.15-08.45",
          event: "Principles of Interventional Pain Management in Musculoskeletal Disorders",
          speaker: "TBD",
        },
        {
          time: "08.45– 09.30",
          event: "Common Musculoskeletal Pain Syndromes (Shoulder, Neck, Low Back, Knee)",
          speaker: "TBD",
        },
        {
          time: "09.30-10.15",
          event: "Ultrasound-Guided Musculoskeletal Procedures: Tips and Pitfalls",
          speaker: "TBD",
        },
        { time: "10.15-10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30 – 11.15",
          event: "Steroid, PRP, and Regenerative Injections: What’s the Evidence?",
          speaker: "TBD",
        },
        { time: "11.15-12.00", event: "Case Discussion: Approach to Chronic Musculoskeletal Pain", speaker: "TBD" },
        { time: "12.00-13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00-15.30",
          event:
            "Station 1: Ultrasound-Guided Shoulder Injection (Suprascapular & Glenohumeral)\nStation 2: Low Back Pain Procedures: Facet Joint, Trigger Point, & Sacroiliac Joint Injection\nStation 3: Knee & Hip Joint Injection Techniques (Sonoanatomy & Practice on Phantom)\nStation 4: Dry Needling, Myofascial Release, and Safe Injection Practices",
          speaker: "Instructor",
        },
        { time: "15.30-16.00", event: "CLOSING", speaker: "Committee" },
      ],
    },
    {
      no: 3,
      title: "Pediatric Essential Pain Management (EPM Lite) + TOT",
      participant: "Anesthesiology and Intensive Therapy Specialist, General Practitioner, Nurse",
      director: "dr. Herdiani Sulistyo Putri, Sp.An-TI., FIP",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30-08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00-08.15", event: "Opening & Pretest", speaker: "Committee Chair" },
        {
          time: "08.15-08.45",
          event: "Pain Assessment in Neonates and Children (FLACC, NIPS, Wong-Baker, etc.)",
          speaker: "TBD",
        },
        {
          time: "08.45– 09.30",
          event: "Regional Techniques for Pediatric Pain (Caudal, TAP, Peripheral Block)",
          speaker: "TBD",
        },
        { time: "09.30-10.15", event: "Pharmacological Pain Management in Pediatric Patients", speaker: "TBD" },
        { time: "10.15-10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30 – 11.15",
          event: "Non-Pharmacologic & Behavioral Pain Management (Distraction, Parental Involvement, Comfort Measures)",
          speaker: "TBD",
        },
        {
          time: "11.15-12.00",
          event: "Case Discussion: Postoperative Pain Management in Pediatric Surgery",
          speaker: "TBD",
        },
        { time: "12.00-13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00-15.30",
          event:
            "Station 1: Pediatric Pain Assessment Tools (FLACC, NIPS, Wong-Baker) – Praktik Observasi dan Simulasi Kasus\nStation 2: Caudal & TAP Block on Pediatric Phantom (Ultrasound-Guided)\nStation 3: Pediatric Analgesic Dosing & PCA Setup (Calculation, Safety, Titration)\nStation 4: Non-Pharmacologic Pain Management Simulation (Distraction, Parental Support, Communication)",
          speaker: "Instructor",
        },
        { time: "15.30-16.00", event: "CLOSING", speaker: "Committee" },
      ],
    },
    {
      no: 4,
      title: "Adjunct Therapy for Pain Management",
      participant: "General Practitioner, Nurse, Anesthesia Nurse",
      director: "dr. Taufiq Agus Siswagama, Sp.An-TI., Subsp. M.N. (K)",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30-08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00-08.15", event: "Opening & Pretest", speaker: "Committee Chair" },
        {
          time: "08.15-08.45",
          event: "Three in one methode technique (massage, TENS, Shock wave therapy)",
          speaker: "Willy Halim MD, PhD, FIPP",
        },
        { time: "08.45– 09.30", event: "SEFT (Spiritual Emotional Freedom Technique)", speaker: "Rahmaya Nova" },
        {
          time: "09.30-10.15",
          event: "Psychological and Behavioral Approach: Mindfulness and Coping Strategies",
          speaker: "dr. Arif Alamsyah dan tim",
        },
        { time: "10.15-10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30 – 11.15",
          event: "Psychological and Behavioral Approach: Mindfulness and Coping Strategies",
          speaker: "TBD",
        },
        {
          time: "11.15-12.00",
          event: "Case Discussion: Integrating Adjunct Therapies in Acute and Chronic Pain Patients",
          speaker: "TBD",
        },
        { time: "12.00-13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00-15.30",
          event:
            "Station 1: Three in one methode technique (massage, TENS, Shock wave therapy)\nStation 2: SEFT (Spiritual Emotional Freedom Technique)\nStation 3: Psychological and Behavioral Approach: Mindfulness and Coping Strategies",
          speaker: "Instructor",
        },
        { time: "15.30-16.00", event: "CLOSING", speaker: "Committee" },
      ],
    },
    {
      no: 5,
      title: "Developing a Pain Clinic",
      participant:
        "Anesthesiology and Intensive Therapy Specialist, General Practitioner, Nurse, Hospital Management (Price based on team of 4 participants)",
      director: "dr. Henny Widyastuti, Sp.An-TI., Subsp. M.N. (K)., FIP",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30-08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00-08.15", event: "Opening & Pretest", speaker: "Committee Chair" },
        {
          time: "08.15-08.45",
          event: "The Concept and Philosophy of Pain Medicine: From Acute to Chronic Pain Service",
          speaker: "TBD",
        },
        { time: "08.45– 09.30", event: "Designing a Pain Clinic: Scope, Structure, and Staffing", speaker: "TBD" },
        {
          time: "09.30-10.15",
          event: "Establishing Multidisciplinary Collaboration: Anesthesia, Neurology, Rehab, and Palliative Teams",
          speaker: "TBD",
        },
        { time: "10.15-10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30 – 11.15",
          event: "Workflow and Patient Pathway in Pain Clinic: Assessment to Follow-Up",
          speaker: "TBD",
        },
        {
          time: "11.15-12.00",
          event: "Essential Equipment, Documentation, and Coding for Pain Procedures",
          speaker: "TBD",
        },
        { time: "12.00-13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00-15.30",
          event:
            "Station 1: Pain Clinic Setup Simulation: Patient Flow, Documentation, and Scheduling System\nStation 2: Clinical Pathway Simulation: Pain Assessment, Counseling, and Treatment Planning\nStation 3: Basic Interventional Tools Introduction (USG, TENS, Epidural Kit, Phantom)\nStation 4: Multidisciplinary Team Roleplay: Case Conference Between Anesthesiologist, Rehab, and Psychologist",
          speaker: "Instructor",
        },
        { time: "15.30-16.00", event: "CLOSING", speaker: "Committee" },
      ],
    },
    {
      no: 6,
      title: "Cancer Pain",
      participant: "Anesthesiology and Intensive Therapy Specialist, General Practitioner, Nurse",
      director: "Dr. dr. Tasrif Hamdi Sp.An-TI, Subsp.M.N (K)",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30-08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00-08.15", event: "Opening & Pretest", speaker: "Committee Chair" },
        { time: "08.15-08.45", event: "Pathophysiology and Classification of Cancer Pain", speaker: "TBD" },
        { time: "08.45– 09.30", event: "WHO Analgesic Ladder in 2025: Still Relevant?", speaker: "TBD" },
        {
          time: "09.30-10.15",
          event: "Pharmacologic Management of Cancer Pain (Opioid & Non-Opioid Strategies)",
          speaker: "TBD",
        },
        { time: "10.15-10.30", event: "COFFEE BREAK", speaker: "-" },
        { time: "10.30 – 11.15", event: "Interventional Pain Techniques in Cancer Pain", speaker: "TBD" },
        { time: "11.15-12.00", event: "Psychological & Palliative Aspects in Cancer Pain", speaker: "TBD" },
        { time: "12.00-13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00-15.30",
          event:
            "Station 1: Ultrasound-Guided Nerve Block for Cancer Pain (Celiac Plexus / TAP / Paravertebral)\nStation 2: Intrathecal & Epidural Catheter Techniques for Chronic Pain\nStation 3: Opioid Rotation and Conversion Workshop (opioid equivalence, dosing, titration)\nStation 4: Communication & Palliative Counseling Skills",
          speaker: "Instructor",
        },
        { time: "15.30-16.00", event: "CLOSING", speaker: "Committee" },
      ],
    },
    {
      no: 7,
      title: "Advanced Intervention of Pain Management",
      participant: "Anesthesiology and Intensive Therapy Specialist, Fellowship & SP2",
      director: "dr. Mirza Koesherdiandi, SpAn, FIPM, FIPP",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30-08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00-08.15", event: "Opening & Pretest", speaker: "Committee Chair" },
        {
          time: "08.15-08.45",
          event: "Neuromodulation Principles: Spinal Cord, Dorsal Root Ganglion, and Peripheral Nerve Stimulation",
          speaker: "TBD",
        },
        {
          time: "08.45– 09.30",
          event: "Intrathecal Drug Delivery Systems: Indications, Pump Selection, and Troubleshooting",
          speaker: "TBD",
        },
        { time: "09.30-10.15", event: "Fluoroscopy & Ultrasound Synergy for Advanced Pain Procedures", speaker: "TBD" },
        { time: "10.15-10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30 – 11.15",
          event: "Updates in Radiofrequency Technology: Pulsed, Bipolar, and Cooled RF Applications",
          speaker: "TBD",
        },
        {
          time: "11.15-12.00",
          event:
            "Case-Based Symposium: Comprehensive Algorithm for Refractory Pain Syndromes (FBSS, CRPS, Postherpetic Neuralgia, Cancer Pain)",
          speaker: "TBD",
        },
        { time: "12.00-13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00-15.30",
          event:
            "DRG Stimulation System (Trial & Permanent Implantation Simulation)\nUltrasound-Guided\nFluoroscopy-Guided Cervical & Lumbar RF Ablation (Medial Branch & DRG)\nSpinal Cord Stimulation (SCS): Lead Placement, Programming, and Troubleshooting (Demo System: Abbott / Medtronic)",
          speaker: "Instructor",
        },
        { time: "15.30-16.00", event: "CLOSING", speaker: "Committee" },
      ],
    },
  ]

  const getAgendaItemClasses = (event: string) => {
    if (event.includes("REGISTRATION") || event.includes("COFFEE BREAK") || event.includes("BREAK SESSION")) {
      return "bg-accent/10 border-accent/30 md:col-span-full"
    }
    return "bg-card border-border hover:border-primary/50"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow pt-20 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {selectedWorkshop ? (
              // Detailed Workshop View
              <div>
                <Button variant="outline" onClick={() => setSelectedWorkshop(null)} className="mb-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to all workshops
                </Button>
                <h1 className="text-4xl font-bold text-primary mb-2">{selectedWorkshop.title}</h1>
                <p className="text-lg text-muted-foreground mb-4">Course Director: {selectedWorkshop.director}</p>
                <p className="text-md text-muted-foreground mb-8">Date: {selectedWorkshop.date}</p>

                <h2 className="font-display text-3xl font-bold text-primary mb-6">Agenda</h2>
                <div className="space-y-4">
                  {selectedWorkshop.agenda.map((item, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border ${getAgendaItemClasses(item.event)} transition-colors`}
                    >
                      <div className="md:col-span-2">
                        <p className="text-sm font-bold text-primary">{item.time}</p>
                      </div>
                      <div className="md:col-span-7">
                        <p className="font-semibold text-foreground whitespace-pre-wrap">{item.event}</p>
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
            ) : (
              // List of Workshops View
              <>
                <div>
                  <h1 className="text-4xl font-bold text-primary mb-4">Workshops</h1>
                  <p className="text-lg text-muted-foreground">
                    Explore our comprehensive workshop offerings designed for healthcare professionals at all levels.
                    Each workshop is led by experienced course directors.
                  </p>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary/10 border-b border-border">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-primary w-12">No</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Workshop</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Participant</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Course Director</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workshopDetails.map((workshop, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{workshop.no}</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{workshop.title}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{workshop.participant}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{workshop.director}</td>
                          <td className="px-6 py-4 text-sm">
                            <Button variant="outline" size="sm" onClick={() => setSelectedWorkshop(workshop)}>
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {workshopDetails.map((workshop, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-6 bg-muted/30">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white font-bold text-sm">
                          {workshop.no}
                        </div>
                        <h3 className="font-semibold text-foreground text-lg">{workshop.title}</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-primary mb-1">Participant</p>
                          <p className="text-sm text-muted-foreground">{workshop.participant}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-primary mb-1">Course Director</p>
                          <p className="text-sm text-muted-foreground">{workshop.director}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedWorkshop(workshop)}
                        className="mt-4 w-full"
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
