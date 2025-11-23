"use client"

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock } from "lucide-react"

export default function EventsPage() {
  const [selectedWorkshop, setSelectedWorkshop] = useState<(typeof workshopDetails)[0] | null>(null)

  const programSchedule = [
    {
      day: "Day 1 - Thursday, April 16, 2026",
      title: "CPD Day 1",
      sessions: [
        {
          sesi: "Session 1",
          items: [
            { time: "08:00 - 08:30", title: "Opening (Pre-test)", speaker: "TBD" },
            { time: "08:30 - 08:55", title: "Anatomy and Physiology of Pain", speaker: "TBD" },
            { time: "08:55 - 09:20", title: "Assessment and Diagnosis of Pain", speaker: "TBD" },
            { time: "09:20 - 09:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 2",
          items: [
            { time: "09:30 - 09:55", title: "Pharmacology Opioid", speaker: "TBD" },
            { time: "09:55 - 10:20", title: "Non Opioid", speaker: "TBD" },
            { time: "10:20 - 10:45", title: "Adjuvant Analgesia", speaker: "TBD" },
            { time: "10:45 - 11:00", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 3",
          items: [
            {
              time: "11:00 - 11:25",
              title: "Procedure Specific Pain Management Recommendation (PROSPECT)",
              speaker: "TBD",
            },
            { time: "11:25 - 11:50", title: "Interventional Technique for Perioperative Pain", speaker: "TBD" },
            { time: "11:50 - 12:15", title: "Acute Pain Service", speaker: "TBD" },
            { time: "12:15 - 12:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Break",
          items: [{ time: "12:30 - 13:00", title: "Lunch Break", speaker: "-" }],
        },
        {
          sesi: "Session 4",
          items: [
            { time: "13:00 - 13:30", title: "Discussion Session: Postoperative Pain", speaker: "-" },
            { time: "13:30 - 15:30", title: "Skill Station A: PCA, PCEA", speaker: "TBD" },
            { time: "13:30 - 15:30", title: "Skill Station B: Postop. ACB, FICB", speaker: "TBD" },
            { time: "13:30 - 15:30", title: "Skill Station C: Postop. Block Trunk (TAP, ESP)", speaker: "TBD" },
          ],
        },
      ],
    },
    {
      day: "Day 2 - Friday, April 17, 2026",
      title: "CPD Day 2",
      sessions: [
        {
          sesi: "Session 1",
          items: [
            { time: "08:00 - 08:25", title: "Chronic Pain After Surgery", speaker: "TBD" },
            { time: "08:25 - 08:50", title: "Neuropathic Pain", speaker: "TBD" },
            { time: "08:50 - 09:15", title: "Pain in Special Population: Pediatric and Geriatric", speaker: "TBD" },
            { time: "09:15 - 09:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 2",
          items: [
            { time: "09:30 - 09:55", title: "CRPS", speaker: "TBD" },
            { time: "09:55 - 10:20", title: "Cancer Pain and The Management", speaker: "TBD" },
            { time: "10:20 - 10:45", title: "Interventional Technique for Chronic Pain", speaker: "TBD" },
            { time: "10:45 - 11:00", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 3",
          items: [
            { time: "11:00 - 11:25", title: "The Role of Interventional Pain Management", speaker: "TBD" },
            { time: "11:25 - 11:50", title: "Ethic and Patient Safety in Pain Management", speaker: "TBD" },
            {
              time: "11:50 - 12:15",
              title: "The Role and Privilege of Anesthesiologist in Pain Management",
              speaker: "TBD",
            },
            { time: "12:15 - 12:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Break",
          items: [{ time: "12:30 - 13:00", title: "Lunch Break", speaker: "-" }],
        },
        {
          sesi: "Session 4",
          items: [
            { time: "13:00 - 13:30", title: "Discussion Session: Cancer Pain", speaker: "-" },
            {
              time: "13:30 - 15:30",
              title: "Skill Station A: Epidural Analgesia, Epidural USG guidance",
              speaker: "TBD",
            },
            { time: "13:30 - 15:30", title: "Skill Station B: Intra-articular knee, CTS", speaker: "TBD" },
            {
              time: "13:30 - 15:30",
              title: "Skill Station C: Suprascapular, Paravertebra block, Occipital",
              speaker: "TBD",
            },
            { time: "15:30 - 16:00", title: "Post-Test / Closing", speaker: "-" },
          ],
        },
      ],
    },
  ]

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
        {
          time: "08.15-08.45",
          event: "Pathophysiology of Chronic Pain and Tissue Healing Mechanisms",
          speaker: "TBD",
        },
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
          event: "Steroid, PRP, and Regenerative Injections: What's the Evidence?",
          speaker: "TBD",
        },
        {
          time: "11.15-12.00",
          event: "Case Discussion: Approach to Chronic Musculoskeletal Pain",
          speaker: "TBD",
        },
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
      participant: "Anesthesiology and Intensive Therapy Specialist, General Practitioner, Nurse, Hospital Management",
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
        {
          time: "09.30-10.15",
          event: "Fluoroscopy & Ultrasound Synergy for Advanced Pain Procedures",
          speaker: "TBD",
        },
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

  const symposiumSchedule = {
    grandTheme:
      "Practical Pain Management for Doctors and Nurses: From Assessment, Safe Analgesic Use, and Intervention Pain Management",
    date: "Friday, April 17, 2026",
    agenda: [
      { time: "07.30 – 08.00", activity: "Re-Registration + Onsite Registration", speaker: "Committee" },
      { time: "08.00 – 08.05", activity: "Opening Ceremony", speaker: "Committee" },
      { time: "08.05 – 08.25", activity: "Ethics and Patient Safety in Pain Management", speaker: "TBD" },
      {
        time: "08.25 – 08.45",
        activity: "Realizing Integrated Pain Services: Regulatory Challenges and Implementation in Health Facilities",
        speaker: "TBD",
      },
      {
        time: "08.45 – 09.05",
        activity:
          "The Role of BPJS Kesehatan in Ensuring Access, Quality, and Efficiency of Pain Services in Indonesia",
        speaker: "TBD",
      },
      {
        time: "09.05– 09.25",
        activity:
          "Bridging Policy and Practice: Synergy of the Anesthesia Profession with the Ministry of Health and BPJS in Recognition of Pain Services",
        speaker: "TBD",
      },
      { time: "09.25– 09.55", activity: "DISCUSSION", speaker: "-" },
      { time: "09.55– 10.15", activity: "Industrial Symposium", speaker: "TBD" },
      {
        time: "10.15 – 10.35",
        activity: "Multimodal Analgesia for Acute Postoperative Pain: Current Evidence and Future Directions",
        speaker: "TBD",
      },
      {
        time: "10.35 - 10.55",
        activity: "Preventing Transition from Acute to Chronic Post-Surgical Pain: Early Recognition and Intervention",
        speaker: "TBD",
      },
      {
        time: "10.55 – 11.15",
        activity: "Integration of Acute Pain Service (APS) in Perioperative Care in Hospitals",
        speaker: "TBD",
      },
      { time: "11.15 – 11.25", activity: "DISCUSSION", speaker: "-" },
      {
        time: "11.25 -11.45",
        activity:
          "Ultrasound-Guided Pain Interventions: Evidence-Based Updates, Clinical Pearls, and Future Directions",
        speaker: "TBD",
      },
      {
        time: "11.45-12.05",
        activity: "Steroid Injections in Pain Medicine: Still Relevant or Outdated?",
        speaker: "TBD",
      },
      {
        time: "12.05-12.25",
        activity: "Sugar Heals: Understanding the Science Behind Dextrose Prolotherapy in Chronic Pain Management",
        speaker: "TBD",
      },
      { time: "12.25-12.35", activity: "DISCUSSION", speaker: "-" },
      { time: "12.35 – 13.15", activity: "Break and Lunch Symposium", speaker: "TBD" },
      {
        time: "13.15-13.35",
        activity: "Regenerative Pain Medicine: From Biologic Science to Ultrasound-Guided Clinical Application",
        speaker: "TBD",
      },
      {
        time: "13.35– 13.55",
        activity:
          "Secretome and Exosome-Based Therapy: Evidence, Mechanism, and Clinical Potential in Pain and Tissue Repair",
        speaker: "TBD",
      },
      {
        time: "13.55– 14.15",
        activity:
          "Comparative Effectiveness of Regenerative Pain Interventions: PRP, Stem Cell, and Biologic Derivatives in Chronic Pain Management",
        speaker: "TBD",
      },
      { time: "14.15 – 14.25", activity: "DISCUSSION", speaker: "-" },
      { time: "14.25– 14.45", activity: "Industrial Symposium 2", speaker: "TBD" },
      {
        time: "14.45 – 15.05",
        activity:
          "Radiofrequency Interventions for Chronic Pain: Current Evidence, Expanding Indications, and Long-Term Outcomes",
        speaker: "TBD",
      },
      {
        time: "15.05 – 15.25",
        activity: "From Needles to Neuromodulation: Advances in Minimally Invasive Pain Procedures",
        speaker: "TBD",
      },
      {
        time: "15.25-15.45",
        activity:
          "Hybrid Regenerative-Radiofrequency Techniques: Combining Biologic and Thermal Modulation for Enhanced Pain Relief",
        speaker: "TBD",
      },
      { time: "15.45-15.55", activity: "DISCUSSION", speaker: "-" },
      {
        time: "15.55-16.15",
        activity: "Interventional Pain Procedures in Palliative Care: Balancing Efficacy, Safety, and Quality of Life",
        speaker: "TBD",
      },
      {
        time: "16.15-16.35",
        activity:
          "Integrated Palliative Pain Management: Bridging Pharmacologic, Interventional, and Psychosocial Strategies",
        speaker: "TBD",
      },
      { time: "16.35-16.45", activity: "DISCUSSION", speaker: "-" },
      { time: "16.45-17.00", activity: "Closing & E-Poster Winner Announcement", speaker: "Committee" },
    ],
  }

  const congressSchedule = {
    title: "ISAPM Congress",
    date: "Friday, April 17, 2026",
    time: "15:00 - 21:00 WIB",
    leader: "TBD",
    participants: "All ISAPM Members",
    description:
      "The ISAPM Congress is the highest organizational forum attended by all members of the Indonesian Society of Anesthesiologist for Pain Management (ISAPM). This activity includes a series of meetings to discuss organizational policy directions, performance evaluations, and strategic program planning for the future.",
    mainAgenda: [
      {
        title: "Member Meeting",
        description:
          "Discussion of strategic issues, organizational policy refinement, and determining important decisions that will become ISAPM's work foundation.",
      },
      {
        title: "Accountability Report",
        description:
          "Submission of activity reports, program achievements, and performance evaluation during the past term as a form of organizational transparency and accountability.",
      },
      {
        title: "Election of New Leadership",
        description:
          "Democratic process to elect ISAPM leadership for the next period as a manifestation of leadership regeneration and organizational sustainability.",
      },
    ],
    conclusion:
      "The congress is expected to be a consolidation momentum for all ISAPM members in strengthening position, role, and scientific and professional contributions in the field of pain management in Indonesia.",
  }

  const getAgendaItemClasses = (event: string) => {
    if (
      event.includes("REGISTRATION") ||
      event.includes("COFFEE BREAK") ||
      event.includes("BREAK SESSION") ||
      event.includes("DISCUSSION") ||
      event.includes("Break") ||
      event.includes("Industrial Symposium")
    ) {
      return "bg-accent/10 border-accent/30"
    }
    return "bg-card border-border hover:border-primary/50"
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground font-display">
              Events & Programs
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Explore our comprehensive program of CPD courses, hands-on workshops, and symposium sessions
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="program" className="w-full">
              <div className="flex justify-center mb-12">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto md:h-14 bg-card border border-border shadow-sm p-1 rounded-xl">
                  <TabsTrigger
                    value="program"
                    className="text-sm md:text-base font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-purple-50 transition-all duration-200 rounded-lg px-3 md:px-6 py-2"
                  >
                    CPD Courses
                  </TabsTrigger>
                  <TabsTrigger
                    value="workshop"
                    className="text-sm md:text-base font-semibold data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-orange-50 transition-all duration-200 rounded-lg px-3 md:px-6 py-2"
                  >
                    Workshops
                  </TabsTrigger>
                  <TabsTrigger
                    value="symposium"
                    className="text-sm md:text-base font-semibold data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-cyan-50 transition-all duration-200 rounded-lg px-3 md:px-6 py-2"
                  >
                    Symposium
                  </TabsTrigger>
                  <TabsTrigger
                    value="congress"
                    className="text-sm md:text-base font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-emerald-50 transition-all duration-200 rounded-lg px-3 md:px-6 py-2"
                  >
                    ISAPM Congress
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="program" className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent rounded-2xl border border-purple-500/20 p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="rounded-full bg-purple-500/20 p-3">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-foreground mb-3 font-display">
                        Pain Management CPD Courses
                      </h2>
                      <p className="text-base text-foreground/80 leading-relaxed">
                        Welcome to our comprehensive Continuing Professional Development (CPD) program focused on Pain
                        Management. These courses are specifically designed to enhance your clinical expertise in
                        assessing, diagnosing, and treating various pain conditions through evidence-based approaches.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-600 flex items-center gap-2">
                        <span className="inline-block w-1 h-6 bg-purple-600 rounded-full"></span>
                        What You'll Learn:
                      </h3>
                      <ul className="space-y-2 text-foreground/90">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>Advanced pain assessment and diagnosis techniques</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>Pharmacological and non-pharmacological interventions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>Interventional pain management procedures</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>Management of acute, chronic, and cancer-related pain</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-purple-600 flex items-center gap-2">
                        <span className="inline-block w-1 h-6 bg-purple-600 rounded-full"></span>
                        Who Should Attend:
                      </h3>
                      <ul className="space-y-2 text-foreground/90">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>Anesthesiologists and pain specialists</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>General practitioners and healthcare providers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>Nurses and allied health professionals</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>Medical students and residents</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-sm italic text-muted-foreground border-t border-purple-500/20 pt-4">
                    Each session combines theoretical knowledge with hands-on skill stations, providing practical
                    experience in modern pain management techniques.
                  </p>
                </div>

                {selectedWorkshop === null && (
                  <div className="space-y-12">
                    {programSchedule.map((day, dayIndex) => (
                      <div key={dayIndex} className="space-y-6">
                        <div className="border-l-4 border-purple-600 pl-4">
                          <h2 className="text-2xl font-bold">{day.day}</h2>
                          <p className="text-muted-foreground">{day.title}</p>
                        </div>

                        <div className="space-y-4">
                          {day.sessions.map((session, sessionIndex) => (
                            <div key={sessionIndex}>
                              <h3 className="font-display text-lg font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-500/30">
                                {session.sesi}
                              </h3>
                              <div className="space-y-2">
                                {session.items.map((item, itemIndex) => (
                                  <div
                                    key={itemIndex}
                                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border ${
                                      session.sesi === "Break"
                                        ? "bg-accent/10 border-accent/30"
                                        : "bg-card border-border hover:border-purple-500/50"
                                    } transition-colors`}
                                  >
                                    <div className="md:col-span-2">
                                      <p className="text-sm font-bold text-purple-600">{item.time}</p>
                                    </div>
                                    <div className="md:col-span-7">
                                      <p className="font-semibold text-foreground">{item.title}</p>
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
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="workshop" className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent rounded-2xl border border-orange-500/20 p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="rounded-full bg-orange-500/20 p-3">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-foreground mb-3 font-display">
                        Pain Management Workshops
                      </h2>
                      <p className="text-base text-foreground/80 leading-relaxed">
                        Explore our comprehensive workshop offerings designed for healthcare professionals at all
                        levels. Each workshop provides hands-on training and practical skills in specialized areas of
                        pain management, led by experienced course directors and expert practitioners.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                        <span className="inline-block w-1 h-6 bg-orange-600 rounded-full"></span>
                        Workshop Features:
                      </h3>
                      <ul className="space-y-2 text-foreground/90">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>Interactive hands-on training sessions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>Small group learning for personalized attention</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>Real-world clinical case discussions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>Practical skill development and demonstration</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                        <span className="inline-block w-1 h-6 bg-orange-600 rounded-full"></span>
                        Who Should Attend:
                      </h3>
                      <ul className="space-y-2 text-foreground/90">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>Pain management specialists</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>Anesthesiologists and physicians</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>Healthcare practitioners seeking advanced training</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span>Medical professionals expanding their expertise</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-sm italic text-muted-foreground border-t border-orange-500/20 pt-4">
                    Each workshop is carefully designed to provide practical, immediately applicable knowledge and
                    skills to enhance your clinical practice in pain management.
                  </p>
                </div>

                {selectedWorkshop ? (
                  <div>
                    <Button variant="outline" onClick={() => setSelectedWorkshop(null)} className="mb-6">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to all workshops
                    </Button>
                    <h2 className="text-4xl font-bold text-orange-600 mb-2">{selectedWorkshop.title}</h2>
                    <p className="text-lg text-muted-foreground mb-4">Course Director: {selectedWorkshop.director}</p>
                    <p className="text-md text-muted-foreground mb-8">Date: {selectedWorkshop.date}</p>

                    <h3 className="font-display text-3xl font-bold text-orange-600 mb-6">Agenda</h3>
                    <div className="space-y-4">
                      {selectedWorkshop.agenda.map((item, index) => (
                        <div
                          key={index}
                          className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border ${getAgendaItemClasses(item.event)} transition-colors`}
                        >
                          <div className="md:col-span-2">
                            <p className="text-sm font-bold text-orange-600">{item.time}</p>
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
                  <>
                    <div className="mb-8"></div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-orange-500/10 border-b border-border">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-orange-600 w-12">No</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-orange-600">Workshop</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-orange-600">Participant</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-orange-600">
                              Course Director
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-orange-600">Actions</th>
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
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-600 text-white font-bold text-sm">
                              {workshop.no}
                            </div>
                            <h3 className="font-semibold text-foreground text-lg">{workshop.title}</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-orange-600 mb-1">Participant</p>
                              <p className="text-sm text-muted-foreground">{workshop.participant}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-orange-600 mb-1">Course Director</p>
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
              </TabsContent>

              <TabsContent value="symposium" className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent rounded-2xl border border-cyan-500/20 p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="rounded-full bg-cyan-500/20 p-3">
                      <Clock className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-foreground mb-3 font-display">
                        Symposium on Practical Pain Management
                      </h2>
                      <p className="text-base text-foreground/80 leading-relaxed">
                        Join us for an in-depth symposium on practical pain management strategies for doctors and
                        nurses.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-cyan-600 flex items-center gap-2">
                        <span className="inline-block w-1 h-6 bg-cyan-600 rounded-full"></span>
                        What You'll Learn:
                      </h3>
                      <ul className="space-y-2 text-foreground/90">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span>Ethics and Patient Safety in Pain Management</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span>Realizing Integrated Pain Services</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span>The Role of BPJS Kesehatan in Pain Services</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span>Ultrasound-Guided Pain Interventions</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-cyan-600 flex items-center gap-2">
                        <span className="inline-block w-1 h-6 bg-cyan-600 rounded-full"></span>
                        Who Should Attend:
                      </h3>
                      <ul className="space-y-2 text-foreground/90">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span>Anesthesiologists and pain specialists</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span>General practitioners and healthcare providers</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span>Nurses and allied health professionals</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600 mt-1">•</span>
                          <span>Hospital management</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-sm italic text-muted-foreground border-t border-cyan-500/20 pt-4">
                    This symposium offers a platform for discussing current challenges and best practices in pain
                    management.
                  </p>
                </div>

                <div>
                  <p className="text-lg text-muted-foreground mb-2">{symposiumSchedule.grandTheme}</p>
                  <p className="text-md text-muted-foreground">Date: {symposiumSchedule.date}</p>
                </div>

                <div>
                  <h3 className="font-display text-3xl font-bold text-cyan-600 mb-6">Agenda</h3>
                  <div className="space-y-4">
                    {symposiumSchedule.agenda.map((item, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border ${getAgendaItemClasses(item.activity)} transition-colors`}
                      >
                        <div className="md:col-span-2">
                          <p className="text-sm font-bold text-cyan-600">{item.time}</p>
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
              </TabsContent>

              <TabsContent value="congress" className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-500/20 p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="rounded-full bg-emerald-500/20 p-3">
                      <Clock className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-foreground mb-3 font-display">{congressSchedule.title}</h2>
                      <p className="text-base text-foreground/80 leading-relaxed mb-4">
                        {congressSchedule.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6 p-6 bg-card/50 rounded-lg border border-emerald-500/20">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-emerald-600">Event Date</p>
                      <p className="text-base text-foreground">{congressSchedule.date}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-emerald-600">Time</p>
                      <p className="text-base text-foreground">{congressSchedule.time}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-emerald-600">Congress Leader</p>
                      <p className="text-base text-foreground">{congressSchedule.leader}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-emerald-600">Participants</p>
                      <p className="text-base text-foreground">{congressSchedule.participants}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-foreground border-l-4 border-emerald-500 pl-4">Main Agenda</h3>

                  {congressSchedule.mainAgenda.map((item, index) => (
                    <div
                      key={index}
                      className="bg-card border border-border rounded-lg p-6 hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 font-bold text-lg flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-foreground mb-2">{item.title}</h4>
                          <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-emerald-500/10 to-primary/10 rounded-lg p-6 border border-emerald-500/20">
                  <p className="text-base text-foreground/90 leading-relaxed italic">{congressSchedule.conclusion}</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
