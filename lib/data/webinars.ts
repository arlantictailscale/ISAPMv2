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
  price: number
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
  title: "Ending Silent Agony: Peran Intervensi Anestesiologi dalam Mengurangi Nyeri Kanker Secara Signifikan",
  shortTitle: "Ending Silent Agony",
  description:
    "Webinar ini membahas peran penting intervensi anestesiologi dalam mengurangi nyeri kanker secara signifikan. Dengan tema 'Bridging The Gaps: Equity, Access, and Excellence in Pain Management', para ahli akan menyajikan modalitas intervensi generasi baru dan optimasi terapi farmakologi dengan pendekatan individual.",
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
        "Modalitas Intervensi Generasi Baru: Radiofrequency Canggih, Cryoablation, Neurolytic Innovations, dan Implantable Drug Delivery Systems",
      image: "/images/dr.jpeg",
      color: "bg-blue-600",
    },
    {
      id: "speaker_tasrif",
      name: "Dr. dr. Tasrif Hamdi, Sp.An-TI, Subsp.M.N(K)",
      title: "Speaker",
      organization: "Pain Management Specialist",
      organizationShort: "Pain Specialist",
      topic: "Optimasi Terapi Farmakologi dengan Pendekatan Individual: Pola Back-to-Basic dalam Era Modern",
      image: "/images/dr.jpeg",
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

// Webinar 3 - Coming Soon Placeholder
const webinar3: Webinar = {
  id: "webinar_3",
  slug: "webinar-3",
  title: "Webinar 3 - Coming Soon",
  shortTitle: "Webinar 3",
  description:
    "Details for this webinar will be announced soon. Stay tuned for updates on topics, speakers, and registration.",
  date: "",
  time: "",
  timezone: "WIB",
  duration: "TBD",
  price: 0,
  currency: "IDR",
  status: "coming_soon",
  tags: [],
  speakers: [],
  benefits: [],
}

// Webinar 4 - Coming Soon Placeholder
const webinar4: Webinar = {
  id: "webinar_4",
  slug: "webinar-4",
  title: "Webinar 4 - Coming Soon",
  shortTitle: "Webinar 4",
  description:
    "Details for this webinar will be announced soon. Stay tuned for updates on topics, speakers, and registration.",
  date: "",
  time: "",
  timezone: "WIB",
  duration: "TBD",
  price: 0,
  currency: "IDR",
  status: "coming_soon",
  tags: [],
  speakers: [],
  benefits: [],
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
  const webinar = getWebinarById(id)
  return webinar?.price || 0
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
  const webinar = getWebinarById(id)
  if (!webinar || webinar.status !== "active") return null
  return {
    price: webinar.price,
    currency: webinar.currency,
  }
}
