// Centralized webinar configuration for flexible multi-webinar support
// Add/modify webinar details here without code changes

export interface WebinarSpeaker {
  id: string
  name: string
  title: string
  organization: string
  organizationShort: string
  topic: string
  image: string
  color: string // Tailwind color class for organization badge
}

export interface WebinarBenefit {
  icon: string // Lucide icon name
  title: string
  description: string
}

export interface Webinar {
  id: string
  slug: string
  title: string
  shortTitle: string
  description: string
  date: string // ISO date string
  time: string
  timezone: string
  duration: string
  price: number // Individual webinar price (0 since bundle pricing)
  currency: string
  status: "active" | "coming_soon" | "sold_out" | "completed"
  speakers: WebinarSpeaker[]
  benefits: WebinarBenefit[]
  maxParticipants?: number
  currentParticipants?: number
  thumbnailImage?: string
  heroImage?: string
  tags: string[]
}

// Bundle pricing: Rp 100,000 for all 4 webinars
export const WEBINAR_BUNDLE_PRICE = 100000
export const WEBINAR_BUNDLE_ID = "webinar_bundle_all"
export const WEBINAR_BUNDLE_LABEL = "Webinar Bundle: All 4 Pre-Conference Webinars"

// Webinar 1 - Equity in Pain Management (Active)
const webinar1: Webinar = {
  id: "webinar_equity_pain",
  slug: "equity-pain-management",
  title:
    "Achieving Equity in Pain Management Services in Indonesia: Synergy between Anesthesiologists, Government Regulations, and BPJS Health Financing Schemes",
  shortTitle: "Equity in Pain Management",
  description:
    "Join leading experts from the Ministry of Health, ISAPM, PP Perdatin, and BPJS Kesehatan as they discuss strategies for achieving equitable pain management services across Indonesia.",
  date: "2026-01-30",
  time: "13:00",
  timezone: "WIB",
  duration: "3 hours",
  price: 100000,
  currency: "IDR",
  status: "active",
  tags: ["Pain Management", "Healthcare Policy", "BPJS", "Clinical Guidelines"],
  speakers: [
    {
      id: "speaker_dante",
      name: "Prof. dr. Dante Saksono Harbuwono, Sp.PD, KEMD, Ph.D",
      title: "Speaker",
      organization: "Ministry of Health (Kemenkes)",
      organizationShort: "Kemenkes",
      topic:
        "National Policy Direction for Equity in Pain Management: Integration into the Cancer, Heart, Stroke, and Uro-Nephrology (KJSU) Priority Programs",
      image: "/images/speakers/dr-dante.jpg",
      color: "bg-red-500",
    },
    {
      id: "speaker_takdir",
      name: "Dr. dr. A. Muh. Takdir Musba, Sp.An-TI, Subsp. M.N. (K)",
      title: "Speaker",
      organization: "ISAPM",
      organizationShort: "ISAPM",
      topic: "Mapping the National Pain Management Workforce: Distribution, Competencies, and Challenges",
      image: "/images/speakers/dr-muh-takdir.jpeg",
      color: "bg-primary",
    },
    {
      id: "speaker_asep",
      name: "Irjen. Pol. Dr. dr. Asep Hendradiana, Sp.An-TI, Subsp.TI(K), M.Kes.",
      title: "Speaker",
      organization: "PP Perdatin",
      organizationShort: "PP Perdatin",
      topic: "National Clinical Practice Guidelines (PNPK) for Pain: Standardization for Quality and Equity",
      image: "/images/speakers/dr-asep.png",
      color: "bg-teal-500",
    },
    {
      id: "speaker_ghufron",
      name: "Prof. dr. Ali Ghufron Mukti, M.Sc., Ph.D., AAK",
      title: "Speaker",
      organization: "BPJS Kesehatan",
      organizationShort: "BPJS Kesehatan",
      topic: "Equitable and Clinical Need-Based Financing for Pain Services: Strategies to Support Equal Access",
      image: "/images/speakers/prof-ali-ghufron.jpg",
      color: "bg-green-500",
    },
  ],
  benefits: [
    {
      icon: "Video",
      title: "Live Webinar Access",
      description: "Join the live session with Q&A",
    },
    {
      icon: "MessageCircle",
      title: "Interactive Q&A",
      description: "Ask questions directly to speakers",
    },
    {
      icon: "Award",
      title: "Certificate",
      description: "Receive participation certificate",
    },
    {
      icon: "PlayCircle",
      title: "Recording Access",
      description: "30-day access to recording",
    },
    {
      icon: "FileText",
      title: "Materials",
      description: "Download presentation slides",
    },
  ],
}

// Webinar 2 - Ending Silent Agony (Active)
const webinar2: Webinar = {
  id: "webinar_2",
  slug: "ending-silent-agony",
  title: "Ending Silent Agony: The Role of Anesthesiology Interventions in Significantly Reducing Cancer Pain",
  shortTitle: "Ending Silent Agony",
  description:
    "This webinar explores the crucial role of anesthesiology interventions in significantly reducing cancer pain. With the theme 'Bridging The Gaps: Equity, Access, and Excellence in Pain Management', experts will present next-generation intervention modalities and optimization of pharmacological therapy through an individualized approach.",
  date: "2026-02-05",
  time: "13:00",
  timezone: "WIB",
  duration: "1 hour 15 minutes",
  price: 100000,
  currency: "IDR",
  status: "active",
  tags: ["Cancer Pain", "Intervention", "Pharmacology", "Pain Management", "Anesthesiology"],
  speakers: [
    {
      id: "speaker_yuddi",
      name: "Dr. dr. Yuddi Gumara, Sp.An-TI, Subs.MN(K)",
      title: "Speaker",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic:
        "Next-Generation Intervention Modalities: Advanced Radiofrequency, Cryoablation, Neurolytic Innovations, and Implantable Drug Delivery Systems",
      image: "/images/speakers/dr-yuddi.jpeg",
      color: "bg-blue-600",
    },
    {
      id: "speaker_tasrif",
      name: "Dr. dr. Tasrif Hamdi, Sp.An-TI, Subsp.M.N(K)",
      title: "Speaker",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic:
        "Optimization of Pharmacological Therapy with an Individualized Approach: Back-to-Basics Patterns in the Modern Era",
      image: "/images/speakers/dr-tasrif.jpeg",
      color: "bg-teal-600",
    },
  ],
  benefits: [
    {
      icon: "Video",
      title: "Live Webinar Access",
      description: "Join the live Zoom session with real-time interaction",
    },
    {
      icon: "MessageCircle",
      title: "Interactive Q&A",
      description: "10-minute dedicated Q&A session with moderator",
    },
    {
      icon: "Award",
      title: "Certificate",
      description: "Receive participation certificate",
    },
    {
      icon: "PlayCircle",
      title: "Recording Access",
      description: "30-day access to webinar recording",
    },
    {
      icon: "FileText",
      title: "Materials",
      description: "Download presentation slides and materials",
    },
    {
      icon: "Gift",
      title: "Free for Symposium",
      description: "Complimentary access for symposium registrants",
    },
  ],
}

// Webinar 3 - Minimally Invasive Pain Management Updated Made Easy (Active)
const webinar3: Webinar = {
  id: "webinar_3",
  slug: "minimally-invasive-pain-management",
  title:
    'Minimally Invasive Pain Management Updated Made Easy #less_is_more',
  shortTitle: "Minimally Invasive Pain Management",
  description:
    "This webinar focuses on the latest updates in minimally invasive pain management techniques. Featuring expert facilitators discussing Disc Fix Procedures and Precision Techniques for comprehensive spinal pain treatment, this session embraces the #less_is_more philosophy for modern pain intervention.",
  date: "2026-02-13",
  time: "13:30",
  timezone: "WIB",
  duration: "1 hour 30 minutes",
  price: 100000,
  currency: "IDR",
  status: "active",
  tags: ["Minimally Invasive", "Spinal Pain", "Disc Fix", "Pain Management", "Precision Technique"],
  thumbnailImage: "/images/webinar-3-poster.jpeg",
  speakers: [
    {
      id: "speaker_farlyzhar",
      name: "dr. Muhammad Farlyzhar Yusuf, Sp.An-TI, FIP",
      title: "Moderator",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic: "Moderator",
      image: "/images/speakers/dr-farlyzhar.jpeg",
      color: "bg-blue-600",
    },
    {
      id: "speaker_agus",
      name: "dr. Agus Setiyana, Sp. An-TI., Subsp.An. Kv (K)., FIPM, FIPP",
      title: "Facilitator",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic: "Disc Fix Procedure",
      image: "/images/speakers/dr-agus.jpeg",
      color: "bg-teal-600",
    },
    {
      id: "speaker_mirza",
      name: "dr. Mirza Koeshardiandi, Sp.An-TI, F IPM, FIPP",
      title: "Facilitator",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic:
        "Precision Technique Start with Precision Diagnosis & Comprehensive Spinal Pain Treatment",
      image: "/images/speakers/dr-mirza.jpeg",
      color: "bg-emerald-600",
    },
  ],
  benefits: [
    {
      icon: "Video",
      title: "Live Webinar Access",
      description: "Join the live Zoom session with real-time interaction",
    },
    {
      icon: "MessageCircle",
      title: "Interactive Q&A",
      description: "Dedicated Q&A session with facilitators",
    },
    {
      icon: "Award",
      title: "SKP Certificate",
      description: "Validated SKP certificate from Kemenkes",
    },
    {
      icon: "PlayCircle",
      title: "Recording Access",
      description: "30-day access to webinar recording",
    },
    {
      icon: "FileText",
      title: "Materials",
      description: "Download presentation slides and materials",
    },
    {
      icon: "Gift",
      title: "Free for Symposium",
      description: "Complimentary access for symposium registrants",
    },
  ],
}

// Webinar 4 - Unlocking Natural Healing: Regenerative Therapies for Chronic Pain (Active)
const webinar4: Webinar = {
  id: "webinar_4",
  slug: "unlocking-natural-healing",
  title: "Unlocking Natural Healing: Regenerative Therapies for Chronic Pain",
  shortTitle: "Unlocking Natural Healing",
  description:
    "This webinar explores regenerative therapies for chronic pain management. Leading experts will discuss the role of regenerative medicine in pain practice and present evidence-based clinical applications, offering insights into cutting-edge natural healing approaches.",
  date: "2026-02-20",
  time: "13:30",
  timezone: "WIB",
  duration: "1 hour 30 minutes",
  price: 100000,
  currency: "IDR",
  status: "active",
  tags: ["Regenerative Medicine", "Chronic Pain", "Natural Healing", "Pain Management", "Clinical Evidence"],
  thumbnailImage: "/images/webinar-4-poster.jpg",
  speakers: [
    {
      id: "speaker_buyung",
      name: "dr. Buyung Hartiyo Laksono, Sp.An-TI., Subsp.N.An.(K)., FIP",
      title: "Moderator",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic: "Moderator",
      image: "/images/speakers/dr-buyung-hartiyo.jpg",
      color: "bg-indigo-600",
    },
    {
      id: "speaker_halim",
      name: "dr. Halim Sudono, Sp.An-TI, FIP, FIPP, CIPS",
      title: "Speaker",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic: "The Role of Regenerative Medicine in Pain Practice",
      image: "/images/speakers/dr-halim-sudono.jpg",
      color: "bg-blue-600",
    },
    {
      id: "speaker_puja",
      name: "dr. Puja Laksana Maqbul, Sp.An, FIPM, FIPP",
      title: "Speaker",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic: "Regenerative Medicine: Evidence & Clinical Uses",
      image: "/images/speakers/dr-puja-laksana.jpg",
      color: "bg-teal-600",
    },
  ],
  benefits: [
    {
      icon: "Video",
      title: "Live Webinar Access",
      description: "Join the live Zoom session with real-time interaction",
    },
    {
      icon: "MessageCircle",
      title: "Interactive Q&A",
      description: "Dedicated Q&A session with speakers",
    },
    {
      icon: "Award",
      title: "SKP Certificate",
      description: "Validated SKP certificate from Kemenkes",
    },
    {
      icon: "PlayCircle",
      title: "Recording Access",
      description: "30-day access to webinar recording",
    },
    {
      icon: "FileText",
      title: "Materials",
      description: "Download presentation slides and materials",
    },
    {
      icon: "Gift",
      title: "Free for Symposium",
      description: "Complimentary access for symposium registrants",
    },
  ],
}

// All webinars collection
export const WEBINARS: Webinar[] = [webinar1, webinar2, webinar3, webinar4]

// Helper functions for webinar management
export function getWebinarById(id: string): Webinar | undefined {
  return WEBINARS.find((w) => w.id === id)
}

export function getWebinarBySlug(slug: string): Webinar | undefined {
  return WEBINARS.find((w) => w.slug === slug)
}

export function getActiveWebinars(): Webinar[] {
  return WEBINARS.filter((w) => w.status === "active")
}

export function getComingSoonWebinars(): Webinar[] {
  return WEBINARS.filter((w) => w.status === "coming_soon")
}

export function getAllAvailableWebinars(): Webinar[] {
  return WEBINARS.filter((w) => w.status === "active" || w.status === "coming_soon")
}

export function getWebinarPrice(id: string): number {
  // Bundle pricing - all webinars are Rp 100,000 total for all 4
  if (id === WEBINAR_BUNDLE_ID) {
    return WEBINAR_BUNDLE_PRICE
  }
  // Individual webinar price is now 0 since we only sell bundles
  return WEBINAR_BUNDLE_PRICE
}

export function isWebinarPurchasable(id: string): boolean {
  const webinar = getWebinarById(id)
  return webinar?.status === "active" && webinar.price > 0
}

export function formatWebinarDate(date: string): string {
  if (!date) return "TBD"
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatWebinarTime(time: string, timezone: string): string {
  if (!time) return "TBD"
  return `${time} ${timezone}`
}

export function getWebinarPricing(id: string): { price: number; currency: string } | null {
  // Bundle pricing - Rp 100,000 for all 4 webinars
  if (id === WEBINAR_BUNDLE_ID) {
    return {
      price: WEBINAR_BUNDLE_PRICE,
      currency: "IDR",
    }
  }
  // For individual webinars, return bundle price since we only sell as bundle
  const webinar = getWebinarById(id)
  if (!webinar || webinar.status !== "active") return null
  return {
    price: WEBINAR_BUNDLE_PRICE,
    currency: "IDR",
  }
}
