"use client"

import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronRight, Ticket, Gift, ArrowRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock } from "lucide-react"
import Link from "next/link"
import { getPricingByEventId, getWorkshopPricing, formatPrice, EARLY_BIRD_DEADLINE } from "@/lib/data/event-pricing"
import { EventPricingCard, PricingBadge } from "@/components/event-pricing-card"
import { isBefore, parseISO } from "date-fns"
import Image from "next/image"
import { MapPin } from "lucide-react"

// ISR configuration only works with server components

const tabHeroImages = {
  program: {
    src: "/images/dsc07187.jpg",
    alt: "CPD Courses - Ultrasound guided training session",
    title: "CPD Courses",
    subtitle: "Comprehensive Pain Management Education",
    description: "Enhance your clinical expertise through evidence-based continuing professional development",
    color: "purple",
  },
  workshop: {
    src: "/images/8bf2d59c-4dcf-416b-87bc-8f7db7292309.jpg",
    alt: "Hands-on medical workshop with fluoroscopy equipment",
    title: "Hands-on Workshops",
    subtitle: "Practical Skills & Expert Guidance",
    description: "Master interventional techniques through intensive hands-on sessions with experienced faculty",
    color: "emerald",
  },
  symposium: {
    src: "/images/symposium-hall.jpg",
    alt: "Symposium - Large conference hall with audience watching presentation",
    title: "Scientific Symposium",
    subtitle: "Cutting-edge Research & Knowledge Exchange",
    description: "Engage with leading experts and discover the latest advances in pain management",
    color: "cyan",
  },
  congress: {
    src: "/images/dsc07185.jpg",
    alt: "ISAPM Congress - Professional medical discussion",
    title: "ISAPM Congress",
    subtitle: "National Meeting & Professional Assembly",
    description: "Join fellow professionals in shaping the future of pain management in Indonesia",
    color: "emerald",
  },
  "city-tour": {
    src: "/images/tugu-malang.webp",
    alt: "City Tour - Tugu Malang monument with lotus pond and colonial building",
    title: "City Tour",
    subtitle: "Explore Beautiful Malang",
    description: "Experience the charm and culture of Malang with fellow conference attendees",
    color: "rose",
  },
}

const eventDates: Record<keyof typeof tabHeroImages, string> = {
  program: "April 16-17, 2026",
  workshop: "April 17, 2026",
  symposium: "April 18, 2026",
  congress: "April 17, 2026",
  "city-tour": "April 19, 2026",
}

export default function EventsPage() {
  const [selectedWorkshop, setSelectedWorkshop] = useState<(typeof workshopDetails)[0] | null>(null)
  const isEarlyBirdPeriod = isBefore(new Date(), parseISO(EARLY_BIRD_DEADLINE))

  const programSchedule = [
    {
      day: "Day 1 - Thursday, April 16, 2026",
      title: "CPD Day 1",
      courseDirector: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP",
      sessions: [
        {
          sesi: "Session 1",
          items: [
            { time: "08:00 - 08:30", title: "Opening (Pre-test)", speaker: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP" },
            { time: "08:30 - 08:55", title: "Anatomy and Physiology of Pain", speaker: "Prof.dr. Andi Husni Tanra, PhD, Sp.An-TI(K), Subsp.M.N.(K)" },
            { time: "08:55 - 09:20", title: "Assessment and Diagnosis of Pain", speaker: "Prof.dr. Andi Husni Tanra, PhD, Sp.An-TI(K), Subsp.M.N.(K)" },
            { time: "09:20 - 09:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 2",
          items: [
            { time: "09:30 - 09:55", title: "Opioid Pharmacology", speaker: "Dr.dr. Takdir Musbah, Sp.An-TI, Subsp.M.N(K), FIP" },
            { time: "09:55 - 10:20", title: "Non-Opioid Analgesics", speaker: "dr. Wayan Widana, Sp.An-TI, FIP, FIPP, CIPS, Subsp. M.N (K)" },
            { time: "10:20 - 10:45", title: "Adjuvant Analgesia", speaker: "dr. Wayan Widana, Sp.An-TI, FIP, FIPP, CIPS, Subsp. M.N (K)" },
            { time: "10:45 - 11:00", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 3",
          items: [
            { time: "11:00 - 11:25", title: "Procedure Specific Pain Management Recommendation (PROSPECT)", speaker: "Dr.dr. Ristiawan Muji Laksono, SpAn-TI., Subsp.M.N.(K)" },
            { time: "11:25 - 11:50", title: "Interventional Technique for Perioperative Pain", speaker: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP" },
            { time: "11:50 - 12:15", title: "Acute Pain Service", speaker: "Dr.dr. Takdir Musbah, Sp.An-TI, Subsp.M.N(K), FIP" },
            { time: "12:15 - 12:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Break",
          items: [{ time: "12:30 - 13:00", title: "Lunch Break (ISHOMA)", speaker: "-" }],
        },
        {
          sesi: "Session 4",
          items: [
            { time: "13:00 - 13:30", title: "Discussion Session: Postoperative Pain", speaker: "Dr.dr. Ristiawan Muji Laksono, SpAn-TI., Subsp.M.N.(K) / dr. Wayan Widana, Sp.An-TI, FIP, FIPP, CIPS, Subsp. M.N (K)" },
            { time: "13:30 - 15:30", title: "Skill Station A: PCA, PCEA", speaker: "Dr.dr. Takdir Musbah, Sp.An-TI, Subsp.M.N(K), FIP / Dr.dr. R. Dwi Pantja Wibowo, Sp.An-TI, Subsp.T.I.(K), Subsp.M.N.(K)" },
            { time: "13:30 - 15:30", title: "Skill Station B: Postoperative ACB, FICB", speaker: "dr. Wayan Widana, Sp.An-TI, FIP, FIPP, CIPS, Subsp. M.N (K) / Dr.dr. Ristiawan Muji Laksono, SpAn-TI., Subsp.M.N.(K)" },
            { time: "13:30 - 15:30", title: "Skill Station C: Postoperative Trunk Block (TAP, ESP)", speaker: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP / dr. Mahmud, M.Sc., SpAn-TI, Subsp.MN(K), FIPM" },
          ],
        },
      ],
    },
    {
      day: "Day 2 - Friday, April 17, 2026",
      title: "CPD Day 2",
      courseDirector: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP",
      sessions: [
        {
          sesi: "Session 1",
          items: [
            { time: "08:00 - 08:25", title: "Chronic Pain After Surgery", speaker: "Prof.dr. Andi Husni Tanra, PhD, Sp.An-TI(K), Subsp.M.N.(K)" },
            { time: "08:25 - 08:50", title: "Neuropathic Pain", speaker: "dr. Syaffrudin Gaus, PhD, Sp.An-TI, Subsp.M.N(K), Subsp.N.An(K)" },
            { time: "08:50 - 09:15", title: "Pain in Special Populations: Pediatric and Geriatric", speaker: "dr. Syaffrudin Gaus, PhD, Sp.An-TI, Subsp.M.N(K), Subsp.N.An(K)" },
            { time: "09:15 - 09:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 2",
          items: [
            { time: "09:30 - 09:55", title: "CRPS (Complex Regional Pain Syndrome)", speaker: "dr. Syaffrudin Gaus, PhD, Sp.An-TI, Subsp.M.N(K), Subsp.N.An(K)" },
            { time: "09:55 - 10:20", title: "Cancer Pain and Its Management", speaker: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP" },
            { time: "10:20 - 10:50", title: "Interventional Technique for Chronic Pain and Regenerative Pain", speaker: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP" },
            { time: "10:50 - 11:00", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Session 3",
          items: [
            { time: "11:00 - 11:25", title: "The Role of Interventional Pain Management", speaker: "Dr.dr. Ristiawan Muji Laksono, SpAn-TI., Subsp.M.N.(K)" },
            { time: "11:25 - 11:50", title: "Ethics and Patient Safety in Pain Management", speaker: "Dr.dr. Ristiawan Muji Laksono, SpAn-TI., Subsp.M.N.(K)" },
            { time: "11:50 - 12:15", title: "The Role and Privilege of Anesthesiologist in Pain Management", speaker: "Dr.dr. Takdir Musbah, Sp.An-TI, Subsp.M.N(K), FIP" },
            { time: "12:15 - 12:30", title: "Discussion", speaker: "-" },
          ],
        },
        {
          sesi: "Break",
          items: [{ time: "12:30 - 13:00", title: "Lunch Break (ISHOMA)", speaker: "-" }],
        },
        {
          sesi: "Session 4",
          items: [
            { time: "13:00 - 13:30", title: "Discussion Session: Cancer Pain", speaker: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP / Dr.dr. Takdir Musbah, Sp.An-TI, Subsp.M.N(K), FIP" },
            { time: "13:30 - 15:30", title: "Skill Station A: Epidural Analgesia and Ultrasound-Guided Epidural", speaker: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP / Dr.dr. R. Dwi Pantja Wibowo, Sp.An-TI, Subsp.T.I.(K), Subsp.M.N.(K)" },
            { time: "13:30 - 15:30", title: "Skill Station B: Intra-articular Knee Injection, CTS", speaker: "Dr.dr. Ristiawan Muji Laksono, SpAn-TI., Subsp.M.N.(K) / Dr.dr. Takdir Musbah, Sp.An-TI, Subsp.M.N(K), FIP" },
            { time: "13:30 - 15:30", title: "Skill Station C: Suprascapular Block, Paravertebral Block, Occipital Block", speaker: "dr. Wayan Widana, Sp.An-TI, FIP, FIPP, CIPS, Subsp. M.N (K) / dr. Mahmud, M.Sc., SpAn-TI, Subsp.MN(K), FIPM" },
            { time: "15:30 - 16:00", title: "Post-Test and Closing", speaker: "-" },
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
        { time: "08.00-08.15", event: "Opening & Pre-Test", speaker: "Committee Chair" },
        {
          time: "08.15-08.45",
          event: "Pathophysiology of Chronic Pain and Tissue Healing Mechanisms",
          speaker: "dr. Ahmad Muttaqin 'Alim, Sp.An-TI., FIP., MSc., DM / dr. Puja Laksana Maqbul, Sp.An, FIPM, FIPP",
        },
        {
          time: "08.45-09.30",
          event: "Principles and Evidence of Prolotherapy and PRP in Pain Management",
          speaker: "dr. Ahmad Muttaqin 'Alim, Sp.An-TI., FIP., MSc., DM / dr. Puja Laksana Maqbul, Sp.An, FIPM, FIPP",
        },
        {
          time: "09.30-10.15",
          event: "Comparison of Regenerative vs Conventional Steroid Injections (Efficacy, Safety, Cost-Effectiveness)",
          speaker: "dr. Ahmad Muttaqin 'Alim, Sp.An-TI., FIP., MSc., DM / dr. Puja Laksana Maqbul, Sp.An, FIPM, FIPP",
        },
        { time: "10.15-10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30-11.15",
          event: "Introduction to Microinvasive Procedures: Dry Needling, Perineural Injection, and Hydrodissection",
          speaker: "dr. Ahmad Muttaqin 'Alim, Sp.An-TI., FIP., MSc., DM / dr. Puja Laksana Maqbul, Sp.An, FIPM, FIPP",
        },
        {
          time: "11.15-12.00",
          event: "Complications and Safety Checklist in Regenerative and Microinvasive Procedures",
          speaker: "dr. Ahmad Muttaqin 'Alim, Sp.An-TI., FIP., MSc., DM / dr. Puja Laksana Maqbul, Sp.An, FIPM, FIPP",
        },
        { time: "12.00-13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00-15.30",
          event:
            "Station 1: PRP Preparation and Injection Technique (USG-guided)\nStation 2: Prolotherapy Injection Technique\nStation 3: Microinvasive Needling / Hydrodissection Techniques",
          speaker: "Instructors",
        },
        { time: "", event: "CLOSING", speaker: "" },
      ],
    },
    {
      no: 2,
      title: "Basic Interventional Pain Management (Musculoskeletal)",
      participant: "Anesthesiology and Intensive Therapy Specialist",
      director: "Dr. John Frans Sitepu, M.Ked (An), Sp.An-TI, Subsp. MN (K), FIPM",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30 - 08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00 - 08.15", event: "Opening & Pre-Test", speaker: "Committee Chair" },
        {
          time: "08.15 - 08.45",
          event: "Principles of Interventional Pain Management in Musculoskeletal Disorders",
          speaker: "Dr. John Frans Sitepu, M.Ked (An), Sp.An-TI, Subsp. MN (K), FIPM",
        },
        {
          time: "08.45 - 09.15",
          event: "Upper Musculoskeletal Pain Syndromes: Interventional Tips & Pitfalls",
          speaker: "dr. Taufiq Agus Siswagama, Sp.An-TI., Subsp. M.N. (K)",
        },
        {
          time: "09.15 - 09.45",
          event: "Common Lower Musculoskeletal Pain Syndromes: Practical Tips & Clinical Pitfalls",
          speaker: "dr. Farhan Ali Rahman, Sp.An-TI, FIPM, Subsp. M.N (K)",
        },
        {
          time: "09.45 - 10.15",
          event: "Steroid, PRP, and Regenerative Injections: What's the Evidence?",
          speaker: "dr. Ratri Dwi Indriani, Sp.An-TI, FIP., FIPP",
        },
        {
          time: "10.15 - 11.00",
          event: "Case Discussion: Approach to Chronic Musculoskeletal Pain",
          speaker: "All Instructors",
        },
        { time: "11.00 - 13.00", event: "Break Session & ISHOMA", speaker: "-" },
        {
          time: "13.00 - 15.30",
          event:
            "Station 1: Mastering Ultrasound-Guided Interventions — Knobology, Image Optimization & Probe Handling\nStation 2: Ultrasound-Guided Upper Musculoskeletal Injections (Supraspinatus, Glenohumeral, Trigger Finger Syndrome, and Carpal Tunnel Syndrome)\nStation 3: Ultrasound-Guided Lower Extremity Injections (OA Knee, ACL/MCL/LCL Tear, Tarsal Tunnel Syndrome, and Plantar Fasciitis)\nStation 4: Needle Visualization, Needle Steering Techniques & Injection Safety",
          speaker: "All Instructors",
        },
        { time: "16.00", event: "Closing", speaker: "Committee" },
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
        { time: "08.00-08.15", event: "Opening & Pre-Test", speaker: "Committee Chair" },
        { time: "08.15-08.30", event: "Introduction & Recognition", speaker: "Instructor" },
        { time: "08.30-08.45", event: "Pain Assessment in Pediatrics", speaker: "Instructor" },
        { time: "08.45-09.00", event: "Non-Pharmacological Treatment", speaker: "Instructor" },
        { time: "09.00-09.15", event: "Pharmacological Treatment", speaker: "Instructor" },
        { time: "09.15-09.30", event: "COFFEE BREAK", speaker: "-" },
        { time: "09.30-09.55", event: "Barriers in Pain Management", speaker: "All Facilitators" },
        { time: "09.55-10.20", event: "Overcoming Barriers Presentation", speaker: "All Facilitators" },
        { time: "10.20-11.20", event: "RAT Cases & Presentation", speaker: "All Facilitators" },
        { time: "11.20-11.30", event: "Post-Test", speaker: "All Facilitators" },
        { time: "11.30-13.00", event: "BREAK SESSION (LUNCH)", speaker: "-" },
        { time: "13.00-13.20", event: "Adult Learning - Teaching Overview", speaker: "All Facilitators" },
        { time: "13.20-13.40", event: "Delivering Lectures - Running a Discussion Group", speaker: "All Facilitators" },
        { time: "13.40-13.45", event: "Group Division", speaker: "All Facilitators" },
        { time: "13.45-14.15", event: "Lecture Practice", speaker: "All Facilitators" },
        { time: "14.15-14.45", event: "Running a Discussion Group", speaker: "All Facilitators" },
        { time: "14.45-14.50", event: "COFFEE BREAK", speaker: "-" },
        { time: "14.50-15.20", event: "EPM Planning - Workshop Presentation", speaker: "All Facilitators" },
        { time: "15.20-15.30", event: "Feedback - Group Photo & Closing", speaker: "All Facilitators" },
        { time: "", event: "CLOSING", speaker: "" },
      ],
    },
    {
      no: 4,
      title: "Adjunct Therapy for Pain Management",
      participant: "Anesthesiologist, Family Medicine and Primary Care Specialist, General Practitioner, Resident, Nurse, Nurse Anesthetist",
      director: "dr. Taufiq Agus Siswagama, Sp.An-TI., Subsp. M.N. (K)",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30 - 08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00 - 08.15", event: "Opening & Pre-Test", speaker: "Committee Chair" },
        {
          time: "08.15 - 08.45",
          event: "Three-in-One Method Technique (Manual Therapy, Massage, Paida Lajin) + TENS & Shock Wave Therapy",
          speaker: "Willy Halim, MD, PhD, FIPP",
        },
        {
          time: "08.45 - 09.30",
          event: "SEFT (Spiritual Emotional Freedom Technique)",
          speaker: "Dr. Ns. Rahmaya Nova Handayani, S.Kep., M.Sc., Sp.Kep.MD",
        },
        {
          time: "09.30 - 10.15",
          event: "Psychological and Behavioral Approach: Coping Strategies",
          speaker: "dr. Arief Alamsyah, MARS, Sp.KKLP, CHt",
        },
        { time: "10.15 - 10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30 - 11.15",
          event: "Adjuvant Drugs in Pain Management (Antidepressants, Anticonvulsants, NMDA Antagonists)",
          speaker: "dr. Taufiq Agus Siswagama, Sp.An-TI., Subsp. M.N. (K)",
        },
        {
          time: "11.15 - 11.45",
          event: "Mindfulness-Based Approach in Multimodal Pain Management",
          speaker: "Prof. Dr. Meidiana Dwidiyanti, S.Kp., M.Sc.",
        },
        {
          time: "11.45 - 12.00",
          event: "Case Discussion: Integrating Adjunct Therapies in Acute and Chronic Pain Patients",
          speaker: "All Instructors",
        },
        { time: "12.00 - 13.00", event: "BREAK SESSION", speaker: "-" },
        {
          time: "13.00 - 15.30",
          event:
            "Station 1: Three-in-One Method Technique (Massage, TENS, Shock Wave Therapy)\nStation 2: SEFT (Spiritual Emotional Freedom Technique)\nStation 3: Psychological and Behavioral Approach: Mindfulness and Coping Strategies",
          speaker: "All Instructors",
        },
        { time: "", event: "CLOSING", speaker: "" },
      ],
    },
    {
      no: 5,
      title: "Developing a Pain Clinic",
      subtitle: "Hospital Pain Clinic Development and Sustainability: Best Practices and Implementation",
      participant:
        "Anesthesiology and Intensive Therapy Specialist, General Practitioner, Nurse, Hospital Management (Price based on team of 4 participants: Medical Director, Finance Director, Business/Marketing Office, Anesthesiologist)",
      director: "dr. Henny Widyastuti, Sp.An-TI., Subsp. M.N. (K)., FIP",
      date: "Friday, April 17, 2026",
      overview:
        "This intensive workshop equips hospital leadership and clinical teams with evidence-based strategies to develop, optimize, and sustain a pain clinic. Through practical coaching methods and real-world case studies, participants will learn best practices in service standardization, financial management, collaborative marketing, and sustainable operations.",
      objectives: [
        "Develop standardized pain management services aligned with international best practices",
        "Implement financial management strategies that enhance clinic profitability and sustainability",
        "Design effective collaboration and marketing strategies for hospital pain services",
        "Establish sustainable pain clinic operations and quality improvement systems",
      ],
      facilitators: [
        {
          name: "dr. Said Shofwan, Sp.An-TI, FIP, FIPP",
          role: "Director RSI Sultan Agung (2022-2023)",
          credentials:
            "Founder Semarang Pain Center RSI Sultan Agung & Founder Awal Bros Pain Center Sudirman Pekanbaru",
        },
        {
          name: "Rahmi Winandari, SKM., M.Kes",
          role: "Deputy Director Administration RSUD Ciawi (2019-present)",
          credentials: "Head of Pain Management Installation RSUD Dr. KH. Idham Chalid Ciawi",
        },
        {
          name: "dr. Ristanti, MARS",
          role: "Director of Medical Services",
          credentials: "Head Pain Management Center",
        },
        {
          name: "dr. Mohammad Tsani Musyafa, M.Kes., Sp.OT., AIFO-K",
          role: "Director RSUD Ciawi (2019-2022)",
          credentials:
            "Founder Pain Management Installation RSUD Dr. KH. Idham Chalid Ciawi - Winner of Government Innovation Awards 2021",
        },
        {
          name: "dr. Henny Widyastuti, M.Kes., Sp.An-TI, FIP, Subsp.MN(K)., AIFO-K",
          role: "Head Pain Management Installation RSUD Ciawi (2021-2023)",
          credentials:
            "Head Pain Management Installation RSUD Dr. KH. Idham Chalid Ciawi - Winner of Government Innovation Awards 2022 & Founder Pain Management Center Mayapada Hospital Bogor",
        },
      ],
      materials: [
        "Brainstorming: Framework and Regulations, Burden of Pain in Indonesia, Designing a Pain Clinic in Indonesia",
        "Group Division and Facilitator Introduction",
        "Session I: Service Team, Finance and Administration Team, Marketing, Insurance and JKN Team, Physician Team",
        "Session II: Service Team, Finance and Administration Team, Marketing, Insurance and JKN Team, Physician Team",
      ],
      agenda: [
        { time: "07.30 - 08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00 - 08.15", event: "Opening & Pre-Test", speaker: "Committee Chair" },
        {
          time: "08.15 - 08.45",
          event:
            "Brainstorming: Framework and Regulations, Burden of Pain in Indonesia, Designing a Pain Clinic in Indonesia's Setting",
          speaker: "dr. Said Shofwan, Sp.An-TI, FIP, FIPP",
        },
        {
          time: "08.45 - 09.00",
          event: "Group Division and Facilitator Introduction",
          speaker: "dr. Henny Widyastuti, Sp.An-TI., Subsp. M.N. (K)., FIP",
        },
        {
          time: "09.00 - 11.00",
          event:
            "Session I:\n1. Service Team\n2. Finance and Administration Team\n3. Marketing, Insurance and JKN Team\n4. Physician Team",
          speaker:
            "Instructors:\n1. dr. Henny Widyastuti, M.Kes., Sp.An-TI, FIP, Subsp.MN(K)., AIFO-K\n2. Rahmi Winandari, SKM., M.Kes\n3. dr. Ristanti, MARS\n4. dr. Mohammad Tsani Musyafa, M.Kes., Sp.OT., AIFO-K",
        },
        { time: "11.00 - 11.15", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "11.15 - 12.30",
          event:
            "Session II:\n1. Service Team\n2. Finance and Administration Team\n3. Marketing, Insurance and JKN Team\n4. Physician Team",
          speaker:
            "Instructors:\n1. dr. Henny Widyastuti, M.Kes., Sp.An-TI, FIP, Subsp.MN(K)., AIFO-K\n2. Rahmi Winandari, SKM., M.Kes\n3. dr. Ristanti, MARS\n4. dr. Mohammad Tsani Musyafa, M.Kes., Sp.OT., AIFO-K",
        },
        { time: "12.30 - 13.00", event: "Brainstorming: Team Reflection", speaker: "All Facilitators" },
        { time: "", event: "CLOSING", speaker: "" },
      ],
    },
    {
      no: 6,
      title: "Cancer Pain Management",
      participant: "Anesthesiology and Intensive Therapy Specialist, General Practitioner, Nurse",
      director: "Dr. dr. Tasrif Hamdi, Sp.An-TI, Subsp.M.N (K)",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30 - 08.00", event: "Registration", speaker: "Committee" },
        { time: "08.00 - 08.15", event: "Opening & Pre-Test", speaker: "Chairman of the Committee" },
        {
          time: "08.15 - 08.45",
          event: "Pathophysiology and Classification of Cancer Pain",
          speaker: "Dr. dr. Tasrif Hamdi, Sp.An-TI, Subsp.M.N (K)",
        },
        {
          time: "08.45 - 09.30",
          event: "Pharmacologic Management of Cancer Pain (Opioid & Non-Opioid Strategies)",
          speaker: "dr. Madonna Damayanthie Datu, SpAn-TI., FCPM., FIP., Subsp.M.N.(K)",
        },
        {
          time: "09.30 - 10.15",
          event: "Application of the WHO Analgesic Ladder in Cancer Pain",
          speaker: "dr. Nur Surya Wirawan., Sp.An-TI., Subsp.MN(K)., MARS., AIFO(K)",
        },
        { time: "10.15 - 10.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "10.30 - 11.15",
          event: "Interventional Pain Techniques in Cancer Pain",
          speaker: "Dr. dr. Tasrif Hamdi, Sp.An-TI, Subsp.M.N (K)",
        },
        {
          time: "11.15 - 12.00",
          event: "Symptom Management in Cancer Pain (Dyspnea, Nausea & Vomiting, Delirium, Constipation)",
          speaker: "dr. Madonna Damayanthie Datu, SpAn-TI., FCPM., FIP., Subsp.M.N.(K)",
        },
        { time: "12.00 - 13.00", event: "BREAK SESSION (LUNCH)", speaker: "-" },
        {
          time: "13.00 - 15.30",
          event:
            "Hands-On Workshop (Parallel Stations):\nStation 1: Ultrasound-Guided Nerve Block for Cancer Pain (Celiac Plexus / TAP / Paravertebral)\nStation 2: Intrathecal & Epidural Catheter Techniques for Chronic Cancer Pain\nStation 3: Opioid Rotation and Conversion Workshop (Equianalgesic Dosing, Titration)\nStation 4: Communication & Palliative Counseling Skills",
          speaker: "Instructors",
        },
        { time: "15.30 - 16.00", event: "Closing Session", speaker: "Organizing Committee" },
      ],
    },
    {
      no: 7,
      title: "Advanced Intervention of Pain Management",
      participant: "Anesthesiology and Intensive Therapy Specialist, Fellowship & SP2",
      director: "dr. Mirza Koesherdiandi, Sp.An, FIPM, FIPP",
      date: "Friday, April 17, 2026",
      agenda: [
        { time: "07.30 - 08.00", event: "REGISTRATION", speaker: "Committee" },
        { time: "08.00 - 08.15", event: "Opening & Pre-Test", speaker: "Committee Chair" },
        {
          time: "08.15 - 08.45",
          event: "Basic MRI Reading for Spinal Canal Problems",
          speaker: "Dr. Irma Darinafitri, Sp.Rad(K)",
        },
        {
          time: "08.45 - 09.15",
          event: "Diagnosis of Canal Stenosis",
          speaker: "dr. Agus Setiyana, Sp. An-TI., Subsp.An. Kv (K)., FIPM, FIPP",
        },
        { time: "09.15 - 09.30", event: "COFFEE BREAK", speaker: "-" },
        {
          time: "09.30 - 10.00",
          event: "Laminoplasty Procedures",
          speaker: "dr. Mirza Koeshardiandi, Sp.An., FIPM, FIPP",
        },
        {
          time: "10.00 - 11.00",
          event: "Hands-On Laminoplasty Procedures (Part 1)",
          speaker:
            "dr. Mirza Koeshardiandi, Sp.An., FIPM, FIPP / dr. Agus Setiyana, Sp. An-TI., Subsp.An. Kv (K)., FIPM, FIPP",
        },
        { time: "11.00 - 13.00", event: "BREAK SESSION (LUNCH)", speaker: "-" },
        {
          time: "13.00 - 15.30",
          event: "Hands-On Laminoplasty Procedures (Part 2)",
          speaker:
            "dr. Mirza Koeshardiandi, Sp.An., FIPM, FIPP / dr. Agus Setiyana, Sp. An-TI., Subsp.An. Kv (K)., FIPM, FIPP",
        },
        { time: "", event: "CLOSING", speaker: "" },
      ],
    },
  ]

  const symposiumSchedule = {
    grandTheme:
      "Practical Pain Management for Doctors and Nurses: From Assessment, Safe Analgesic Use, and Intervention Pain Management",
    date: "Saturday, April 18, 2026",
    sections: [
      {
        title: "Opening Session",
        items: [
          { time: "07:30 - 08:00", activity: "Re-Registration + Onsite Registration", speaker: "Committee" },
          { time: "08:00 - 08:05", activity: "Opening Ceremony", speaker: "Committee" },
          {
            time: "08:05 - 08:25",
            activity: "Ethics and Patient Safety in Pain Management",
            speaker: "Prof. Dr. dr. Nancy Margarita Rehatta, Sp.An-TI, Subsp.N.An.(K), Subsp.M.N.(K)",
          },
          {
            time: "08:25 - 08:45",
            activity:
              "Realizing Integrated Pain Services: Regulatory Challenges and Implementation in Healthcare Facilities",
            speaker: "Ministry of Health - Prof. dr. Dante Saksono Harbuwono, Sp.PD, KEMD, Ph.D",
          },
          {
            time: "08:45 - 09:05",
            activity:
              "The Role of BPJS Health in Ensuring Access, Quality, and Efficiency of Pain Services in Indonesia",
            speaker: "BPJS Central - Maj. Gen. TNI (Ret.) Dr. Prihati Pujowaskito, Sp.JP(K), FIHFAA, MMRS",
          },
          {
            time: "09:05 - 09:25",
            activity:
              "Bridging Policy and Practice: Synergy Between the Anesthesia Profession, Ministry of Health, and BPJS in Pain Service Recognition",
            speaker: "ISAPM Chairman - Dr. dr. A. M. Takdir Musba, Sp.An-TI, Subsp. M.N. (K)",
          },
          {
            time: "09:25 - 09:55",
            activity: "DISCUSSION",
            speaker: "Moderator: dr. Doso Sutiyono, SpAn-TI, Subsp. An.R (K)., Subsp.M.N.(K)., MARS",
          },
        ],
      },
      {
        title: "Drug Symposium",
        items: [
          {
            time: "09:55 - 10:15",
            activity: "Industrial Symposium",
            speaker: "Dr. dr. A. M. Takdir Musba, Sp.An-TI, Subsp. M.N. (K)",
          },
          {
            time: "10:15 - 10:35",
            activity: "Multimodal Analgesia for Acute Postoperative Pain: Current Evidence and Future Directions",
            speaker: "Prof. dr. Andi Husni Tanra, PhD, SpAn-TI., Subsp.T.I.(K)., Subsp.M.N.(K)",
          },
          {
            time: "10:35 - 10:55",
            activity:
              "Preventing Transition from Acute to Chronic Post-Surgical Pain: Early Recognition and Intervention",
            speaker: "Prof. Dr. Suwarman, dr., Sp.An-., Subsp.T.I.(K)., Subsp.M.N.(K)., M.Kes",
          },
          {
            time: "10:55 - 11:15",
            activity: "Integration of Acute Pain Service (APS) in Perioperative Hospital Care",
            speaker: "Prof. Dr. dr. Tjokorda Gde Agung Senapathi, SpAn-TI., Subsp.An.R(K)",
          },
          {
            time: "11:15 - 11:25",
            activity: "DISCUSSION",
            speaker: "Moderator: dr. Heri Dwi Purnomo, Sp.An-TI., M.Kes., Subsp. M.N (K)., FIP., Subsp. An.R (K)",
          },
        ],
      },
      {
        title: "Multimodal Symposium",
        items: [
          {
            time: "11:25 - 11:40",
            activity: "Industrial Symposium",
            speaker: "dr. Taufiq Agus Siswagama, Sp.An-TI., Subsp. M.N. (K)",
          },
          {
            time: "11:40 - 12:00",
            activity:
              "Ultrasound-Guided Pain Interventions: Evidence-Based Updates, Clinical Pearls, and Future Directions",
            speaker: "Dr. John Frans Sitepu, M.Ked (An), Sp.An-TI, Subsp. MN (K), FIPM",
          },
          {
            time: "12:00 - 12:20",
            activity: "Steroid Injections in Pain Medicine: Still Relevant or Outdated?",
            speaker: "dr. Mahmud, M.Sc., SpAn-TI. Subsp. MN(K), FIPM",
          },
          {
            time: "12:20 - 12:40",
            activity:
              "Sugar Heals: Understanding the Science Behind Dextrose Prolotherapy in Chronic Pain Management",
            speaker: "dr. Y.R. Yosi Asmara SpAn-TI, Subsp.An.R (K), FIP, FIPP, CIPS",
          },
          {
            time: "12:40 - 12:50",
            activity: "DISCUSSION",
            speaker: "Moderator: Dr. dr. Aswoco Andyk Asmoro, Sp.An-TI., FIP",
          },
        ],
      },
      {
        title: "Break",
        items: [{ time: "12:50 - 13:15", activity: "Lunch Break (ISHOMA)", speaker: "-" }],
      },
      {
        title: "Regenerative Pain Symposium",
        items: [
          {
            time: "13:15 - 13:30",
            activity: "Industrial Symposium",
            speaker: "dr. Puja Laksana Maqbul, Sp.An-TI, FIPM, FIPP",
          },
          {
            time: "13:30 - 13:50",
            activity:
              "Regenerative Pain Medicine: From Biologic Science to Ultrasound-Guided Clinical Application",
            speaker: "dr. Said Sofwan, SpAn-TI., FIPP., FIP",
          },
          {
            time: "13:50 - 14:10",
            activity:
              "Secretome and Exosome-Based Therapy: Evidence, Mechanism, and Clinical Potential in Pain and Tissue Repair",
            speaker: "dr. Nur Surya Wirawan., Sp.An-TI., Subsp.MN(K)., MARS., AIFO(K)",
          },
          {
            time: "14:10 - 14:30",
            activity:
              "Comparative Effectiveness of Regenerative Pain Interventions: PRP, Stem Cell, and Biologic Derivatives in Chronic Pain Management",
            speaker: "dr. Ahmad Muttaqin 'Alim, Sp.An-TI., FIP., MSc., DM",
          },
          {
            time: "14:30 - 14:40",
            activity: "DISCUSSION",
            speaker: "Moderator: dr. Wayan Widana, Sp.An-TI, FIP, FIPP, CIPS, Subsp. M.N (K)",
          },
        ],
      },
      {
        title: "High Technology Pain Management Symposium",
        items: [
          { time: "14:40 - 15:00", activity: "Industrial Symposium", speaker: "-" },
          {
            time: "15:00 - 15:20",
            activity:
              "Radiofrequency Interventions for Chronic Pain: Current Evidence, Expanding Indications, and Long-Term Outcomes",
            speaker: "Dr. dr. Ristiawan Muji Laksono, Sp. An-TI., Subsp. M. N. (K)., FIPP",
          },
          {
            time: "15:20 - 15:40",
            activity: "From Needles to Neuromodulation: Advances in Minimally Invasive Pain Procedures",
            speaker: "dr. Mirza Koeshardiandi, SpAn-TI., FIP., FIPP",
          },
          {
            time: "15:40 - 16:00",
            activity:
              "Hybrid Regenerative-Radiofrequency Techniques: Combining Biologic and Thermal Modulation for Enhanced Pain Relief",
            speaker: "dr. Dedi Susila, Sp.An, Subsp. M.N (K)., FIP, FIPP",
          },
          {
            time: "16:00 - 16:10",
            activity: "DISCUSSION",
            speaker: "Moderator: dr. Buyung Hartiyo Laksono, Sp. An-TI., Subsp.N.An.(K)., FIP",
          },
        ],
      },
      {
        title: "Drug and Equipment in Cancer Pain Management",
        items: [
          { time: "16:10 - 16:25", activity: "Industrial Symposium", speaker: "-" },
          {
            time: "16:25 - 16:45",
            activity:
              "Interventional Pain Procedures in Palliative Care: Balancing Efficacy, Safety, and Quality of Life",
            speaker: "Dr. dr. R. Dwi Pantja Wibowo, Sp.An-TI, Subsp. T.I. (K), Subsp. M.N. (K)",
          },
          {
            time: "16:45 - 17:05",
            activity:
              "Integrated Palliative Pain Management: Bridging Pharmacologic, Interventional, and Psychosocial Strategies",
            speaker: "Dr. dr. Tasrif Hamdi M. Ked (An)., Sp.An-TI, Subsp. MN(K)",
          },
          {
            time: "17:05 - 17:15",
            activity: "DISCUSSION",
            speaker: "Moderator: Dr. dr. Hari Bagianto, Sp. An-TI, Subsp. An.O (K), Subsp. MN(K)",
          },
          { time: "17:15 - 17:30", activity: "Closing & E-Poster Winner Announcement", speaker: "Committee" },
        ],
      },
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

  const [activeTab, setActiveTab] = useState<keyof typeof tabHeroImages>("program")
  const currentHero = tabHeroImages[activeTab]
  // CHANGE: Get the correct date from eventDates for the current active tab
  const currentDate = eventDates[activeTab]

  const getGradientColors = (color: string) => {
    const colors: Record<string, { from: string; to: string; overlay: string }> = {
      purple: { from: "from-purple-900/90", to: "to-purple-600/70", overlay: "bg-purple-500/20" },
      orange: { from: "from-orange-900/90", to: "to-orange-600/70", overlay: "bg-orange-500/20" },
      cyan: { from: "from-cyan-900/90", to: "to-cyan-600/70", overlay: "bg-cyan-500/20" },
      emerald: { from: "from-emerald-900/90", to: "to-emerald-600/70", overlay: "bg-emerald-500/20" },
      rose: { from: "from-rose-900/90", to: "to-rose-600/70", overlay: "bg-rose-500/20" },
    }
    return colors[color] || colors.purple
  }

  const gradientColors = getGradientColors(currentHero.color)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <main className="flex-1 pt-20">
        <section className="relative h-[50vh] min-h-[400px] max-h-[500px] overflow-hidden">
          {/* Background Image with transition */}
          <div className="absolute inset-0 transition-opacity duration-700">
            <Image
              src={currentHero.src || "/placeholder.svg"}
              alt={currentHero.alt}
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${gradientColors.from} ${gradientColors.to} transition-colors duration-700`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          {/* Decorative Elements */}
          <div
            className={`absolute top-20 right-10 w-64 h-64 ${gradientColors.overlay} rounded-full blur-3xl opacity-60 transition-colors duration-700`}
          />
          <div
            className={`absolute bottom-10 left-10 w-48 h-48 ${gradientColors.overlay} rounded-full blur-3xl opacity-40 transition-colors duration-700`}
          />

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {/* CHANGE: Dynamically display the date */}
                {eventDates[activeTab]} • Malang, Indonesia
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-display leading-tight">
                {currentHero.title}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">{currentHero.subtitle}</p>
              <p className="text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">{currentHero.description}</p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-white/90 shadow-lg"
                  onClick={() => {
                    document.getElementById("register-section")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  Register Now
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm bg-transparent"
                >
                  <Link href="#schedule">
                    View Schedule
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div id="schedule" className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <Tabs
              defaultValue="program"
              className="w-full"
              onValueChange={(value) => setActiveTab(value as keyof typeof tabHeroImages)}
            >
              <div className="flex justify-center mb-12">
                <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto md:h-14 bg-card border border-border shadow-sm p-1 rounded-xl">
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
                  <TabsTrigger
                    value="city-tour"
                    className="text-sm md:text-base font-semibold data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-rose-50 transition-all duration-200 rounded-lg px-3 md:px-6 py-2"
                  >
                    City Tour
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

                {(() => {
                  const cpdPricing = getPricingByEventId("cpd")
                  return cpdPricing ? (
                    <EventPricingCard pricing={cpdPricing} colorScheme="purple" showFullTable={true} />
                  ) : null
                })()}

                {selectedWorkshop === null && (
                  <div className="space-y-12">
                    {programSchedule.map((day, dayIndex) => (
                      <div key={dayIndex} className="space-y-6">
                        <div className="border-l-4 border-purple-600 pl-4">
                          <h2 className="text-2xl font-bold">{day.day}</h2>
                          <p className="text-muted-foreground">{day.title}</p>
                          {day.courseDirector && (
                            <p className="text-sm text-purple-600 mt-1 font-medium">
                              Course Director: {day.courseDirector}
                            </p>
                          )}
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
                    {selectedWorkshop.subtitle && (
                      <p className="text-lg text-muted-foreground mb-4">{selectedWorkshop.subtitle}</p>
                    )}
                    <p className="text-md text-muted-foreground mb-4">Course Director: {selectedWorkshop.director}</p>
                    <p className="text-md text-muted-foreground mb-4">Date: {selectedWorkshop.date}</p>

                    {selectedWorkshop.overview && (
                      <div className="mb-8">
                        <h3 className="font-display text-2xl font-bold text-orange-600 mb-4">Overview</h3>
                        <p className="text-base text-foreground/90 leading-relaxed">{selectedWorkshop.overview}</p>
                      </div>
                    )}

                    {selectedWorkshop.objectives && selectedWorkshop.objectives.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-display text-2xl font-bold text-orange-600 mb-4">Objectives</h3>
                        <ul className="list-disc list-inside space-y-2 text-foreground/90">
                          {selectedWorkshop.objectives.map((objective, idx) => (
                            <li key={idx}>{objective}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedWorkshop.facilitators && selectedWorkshop.facilitators.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-display text-2xl font-bold text-orange-600 mb-4">Facilitators</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedWorkshop.facilitators.map((facilitator, idx) => (
                            <div key={idx} className="border border-border rounded-lg p-4 bg-card/50">
                              <p className="font-semibold text-foreground">{facilitator.name}</p>
                              <p className="text-sm text-muted-foreground">{facilitator.role}</p>
                              <p className="text-sm text-orange-600 font-medium mt-2">{facilitator.credentials}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedWorkshop.materials && selectedWorkshop.materials.length > 0 && (
                      <div className="mb-8">
                        <h3 className="font-display text-2xl font-bold text-orange-600 mb-4">Workshop Materials</h3>
                        <ul className="list-disc list-inside space-y-2 text-foreground/90">
                          {selectedWorkshop.materials.map((material, idx) => (
                            <li key={idx}>{material}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(() => {
                      const workshopPricing = getWorkshopPricing(selectedWorkshop.no)
                      return workshopPricing ? (
                        <div className="mb-8">
                          <EventPricingCard pricing={workshopPricing} colorScheme="orange" showFullTable={true} />
                        </div>
                      ) : null
                    })()}

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
                            <th className="px-6 py-4 text-left text-sm font-semibold text-orange-600">Price</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-orange-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workshopDetails.map((workshop, idx) => {
                            const workshopPricing = getWorkshopPricing(workshop.no)
                            return (
                              <tr key={idx} className={idx % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                                <td className="px-6 py-4 text-sm font-medium text-foreground">{workshop.no}</td>
                                <td className="px-6 py-4 text-sm font-medium text-foreground">{workshop.title}</td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">{workshop.participant}</td>
                                <td className="px-6 py-4 text-sm">
                                  {workshopPricing && (
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-orange-600">
                                        {workshopPricing.participantTypes.length > 1 ? "From " : ""}
                                        {formatPrice(
                                          Math.min(
                                            ...workshopPricing.participantTypes.map((pt) =>
                                              isEarlyBirdPeriod ? pt.earlyBirdPrice : pt.normalPrice,
                                            ),
                                          ),
                                        )}
                                      </span>
                                      {isEarlyBirdPeriod && (
                                        <span className="text-xs text-green-600 font-medium">Early Bird</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedWorkshop(workshop)}>
                                      View Details
                                    </Button>
                                    <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                                      <Link href={`/pricing?event=ws${workshop.no}`}>
                                        <Ticket className="h-3 w-3 mr-1" />
                                        Register
                                      </Link>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {workshopDetails.map((workshop, idx) => {
                        const workshopPricing = getWorkshopPricing(workshop.no)
                        return (
                          <div key={idx} className="border border-border rounded-lg p-6 bg-muted/30">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-600 text-white font-bold text-sm">
                                {workshop.no}
                              </div>
                              <h3 className="font-semibold text-foreground text-lg">{workshop.title}</h3>
                              {workshopPricing && (
                                <PricingBadge
                                  eventId={`ws${workshop.no}`}
                                  pricing={workshopPricing}
                                  colorScheme="orange"
                                />
                              )}
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
                              {workshopPricing && (
                                <div>
                                  <p className="text-xs font-semibold text-orange-600 mb-1">Registration Fee</p>
                                  <p className="text-sm font-semibold text-foreground">
                                    {workshopPricing.participantTypes.length > 1 ? "From " : ""}
                                    {formatPrice(
                                      Math.min(
                                        ...workshopPricing.participantTypes.map((pt) =>
                                          isEarlyBirdPeriod ? pt.earlyBirdPrice : pt.normalPrice,
                                        ),
                                      ),
                                    )}
                                    {isEarlyBirdPeriod && (
                                      <span className="ml-2 text-xs text-green-600">(Early Bird)</span>
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedWorkshop(workshop)}
                                className="flex-1"
                              >
                                View Details
                              </Button>
                              <Button asChild size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                                <Link href={`/pricing?event=ws${workshop.no}`}>
                                  <Ticket className="h-3 w-3 mr-1" />
                                  Register
                                </Link>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="symposium" className="space-y-8 animate-in fade-in-50 duration-500">
                {/* CHANGE: Added prominent bonus webinars banner */}
                <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-100 p-2">
                      <Gift className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-800">+4 Bonus Webinars Included</p>
                      <p className="text-sm text-emerald-700">
                        Get complimentary access to all pre-conference webinars when you register for the symposium.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/webinar"
                    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 whitespace-nowrap"
                  >
                    View Webinars <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

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
                        nurses. This comprehensive program also includes complimentary access to four exclusive
                        pre-conference webinars, extending your learning experience beyond the main event.
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
                    management. Registration includes four bonus webinars covering foundational pain management topics.
                  </p>
                </div>

                {(() => {
                  const symposiumPricing = getPricingByEventId("symposium")
                  return symposiumPricing ? (
                    <EventPricingCard pricing={symposiumPricing} colorScheme="cyan" showFullTable={true} />
                  ) : null
                })()}

                <div>
                  <p className="text-lg text-muted-foreground mb-2">{symposiumSchedule.grandTheme}</p>
                  {/* CHANGE: Updated date from Friday April 17 to Saturday April 18 */}
                  <p className="text-md text-muted-foreground">Date: {symposiumSchedule.date}</p>
                </div>

                <div>
                  <h3 className="font-display text-3xl font-bold text-cyan-600 mb-6">Agenda</h3>
                  <div className="space-y-8">
                    {symposiumSchedule.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="space-y-4">
                        <h4 className="font-display text-xl font-bold text-cyan-700 border-b border-cyan-200 pb-2">
                          {section.title}
                        </h4>
                        <div className="space-y-3">
                          {section.items.map((item, index) => (
                            <div
                              key={index}
                              className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border ${getAgendaItemClasses(item.activity)} transition-colors`}
                            >
                              <div className="md:col-span-2">
                                <p className="text-sm font-bold text-cyan-600">{item.time}</p>
                              </div>
                              <div className="md:col-span-6">
                                <p className="font-semibold text-foreground">{item.activity}</p>
                              </div>
                              <div className="md:col-span-4">
                                <p className="text-sm text-muted-foreground">
                                  {item.speaker === "-" ? "-" : item.speaker}
                                </p>
                              </div>
                            </div>
                          ))}
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

              <TabsContent value="city-tour" className="space-y-8 animate-in fade-in-50 duration-500">
                <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent rounded-2xl border border-rose-500/20 p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="rounded-full bg-rose-500/20 p-3">
                      <MapPin className="h-6 w-6 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-foreground mb-3 font-display">City Tour Experience</h2>
                      <p className="text-base text-foreground/80 leading-relaxed">
                        Explore the beautiful city of Batu, Malang and its surroundings during ISAPM 2026. Our curated
                        city tour will take you through scenic destinations, cultural landmarks, and local attractions
                        that showcase the best of East Java.
                      </p>
                    </div>
                  </div>

                  {/* City Tour Map Image */}
                  <div className="relative w-full mb-8 rounded-xl overflow-hidden border border-rose-500/20 shadow-lg">
                    <Image
                      src="/images/city-tour-map.svg"
                      alt="ISAPM 2026 City Tour Map - Explore Batu, Malang and surrounding attractions"
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain bg-white"
                      priority
                    />
                  </div>

                  {/* Coming Soon Notice */}
                  <div className="flex flex-col items-center justify-center py-12 px-6 bg-gradient-to-r from-rose-500/5 to-orange-500/5 rounded-xl border border-rose-500/20">
                    <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mb-6">
                      <MapPin className="h-10 w-10 text-rose-600" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">Coming Soon</h3>
                    <p className="text-base text-muted-foreground text-center max-w-xl leading-relaxed">
                      We're preparing an exciting city tour program for ISAPM 2026 attendees. Detailed itineraries,
                      booking information, and tour packages will be announced soon. Stay tuned for updates!
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3 justify-center">
                      <span className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                        Scenic Destinations
                      </span>
                      <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        Cultural Experiences
                      </span>
                      <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        Local Cuisine
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <section
        id="register-section"
        className="py-16 bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 relative overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-block mb-2">
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
                🎯 Ready to Join?
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-display leading-tight">
              Secure Your Spot at ISAPM 2026
            </h2>

            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Don't miss Indonesia's biggest pain management event. Register now and enjoy early bird pricing!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/pricing">
                <Button
                  size="lg"
                  className="bg-white text-cyan-700 hover:bg-gray-50 text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  Register Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/venue">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-cyan-700 text-lg px-8 py-6 h-auto transition-all duration-300 font-semibold"
                >
                  View Venue Details
                </Button>
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap justify-center gap-6 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>CPD Available</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>7 Workshops Available</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Symposium Available</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>City Tour Available</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Limited Seats</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
