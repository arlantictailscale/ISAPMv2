// Centralized pricing data for all events and workshops
// This is the single source of truth for pricing across the site

export interface ParticipantPricing {
  id: string
  label: string
  earlyBirdPrice: number
  normalPrice: number
  onSitePrice: number
  currency: string
}

export interface EventPricing {
  id: string
  label: string
  shortLabel?: string
  date: string
  participantTypes: ParticipantPricing[]
}

export const eventPricingData: EventPricing[] = [
  {
    id: "webinar_equity_pain",
    label: "Webinar: Achieving Equity in Pain Management Services in Indonesia",
    shortLabel: "Webinar Equity Pain Management",
    date: "Friday, January 30, 2026, 13:00 WIB",
    participantTypes: [
      {
        id: "general",
        label: "General Participant",
        earlyBirdPrice: 100000,
        normalPrice: 100000,
        onSitePrice: 100000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "webinar_2",
    label: "Webinar 2 - Coming Soon",
    shortLabel: "Webinar 2",
    date: "TBD",
    participantTypes: [],
  },
  {
    id: "webinar_3",
    label: "Webinar 3 - Coming Soon",
    shortLabel: "Webinar 3",
    date: "TBD",
    participantTypes: [],
  },
  {
    id: "webinar_4",
    label: "Webinar 4 - Coming Soon",
    shortLabel: "Webinar 4",
    date: "TBD",
    participantTypes: [],
  },
  {
    id: "cpd",
    label: "CPD (Continuing Professional Development) Courses (2 days)",
    shortLabel: "CPD Courses",
    date: "Thursday - Friday, April 16 - 17, 2026",
    participantTypes: [
      {
        id: "span",
        label: "Anesthesiologist",
        earlyBirdPrice: 4000000,
        normalPrice: 4500000,
        onSitePrice: 5000000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "ws1",
    label: "WS 1 (Regenerative Pain Therapy)",
    shortLabel: "Regenerative Pain Therapy",
    date: "Friday, April 17, 2026",
    participantTypes: [
      {
        id: "span",
        label: "Anesthesiologist",
        earlyBirdPrice: 3000000,
        normalPrice: 3500000,
        onSitePrice: 4000000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "ws2",
    label: "WS 2 (Basic Interventional Pain Management (Musculoskeletal))",
    shortLabel: "Basic Interventional Pain Management",
    date: "Friday, April 17, 2026",
    participantTypes: [
      {
        id: "span",
        label: "Anesthesiologist",
        earlyBirdPrice: 2500000,
        normalPrice: 3000000,
        onSitePrice: 3500000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "ws3",
    label: "WS 3 (Pediatric Essential Pain Management (EPM Lite) + TOT)",
    shortLabel: "Pediatric Essential Pain Management",
    date: "Friday, April 17, 2026",
    participantTypes: [
      {
        id: "span",
        label: "Anesthesiologist",
        earlyBirdPrice: 2000000,
        normalPrice: 2500000,
        onSitePrice: 3000000,
        currency: "IDR",
      },
      {
        id: "resident",
        label: "Resident",
        earlyBirdPrice: 1500000,
        normalPrice: 1750000,
        onSitePrice: 2000000,
        currency: "IDR",
      },
      {
        id: "dokter_umum",
        label: "General Practitioner",
        earlyBirdPrice: 1500000,
        normalPrice: 1750000,
        onSitePrice: 2000000,
        currency: "IDR",
      },
      {
        id: "perawat",
        label: "Nurse",
        earlyBirdPrice: 500000,
        normalPrice: 750000,
        onSitePrice: 1000000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "ws4",
    label: "WS 4 (Adjunct Therapy for Pain Management)",
    shortLabel: "Adjunct Therapy",
    date: "Friday, April 17, 2026",
    participantTypes: [
      {
        id: "resident",
        label: "Resident",
        earlyBirdPrice: 1500000,
        normalPrice: 1750000,
        onSitePrice: 2000000,
        currency: "IDR",
      },
      {
        id: "dokter_umum",
        label: "General Practitioner",
        earlyBirdPrice: 1500000,
        normalPrice: 1750000,
        onSitePrice: 2000000,
        currency: "IDR",
      },
      {
        id: "perawat",
        label: "Nurse",
        earlyBirdPrice: 500000,
        normalPrice: 750000,
        onSitePrice: 1000000,
        currency: "IDR",
      },
      {
        id: "penata_anestesi",
        label: "Nurse Anesthetist",
        earlyBirdPrice: 500000,
        normalPrice: 750000,
        onSitePrice: 1000000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "ws5",
    label: "WS 5 (Developing a Pain Clinic)",
    shortLabel: "Developing a Pain Clinic",
    date: "Friday, April 17, 2026",
    participantTypes: [
      {
        id: "span_team",
        label: "Anesthesiologist and team (team of 4 participants)",
        earlyBirdPrice: 6000000,
        normalPrice: 6500000,
        onSitePrice: 7000000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "ws6",
    label: "WS 6 (Cancer Pain)",
    shortLabel: "Cancer Pain",
    date: "Friday, April 17, 2026",
    participantTypes: [
      {
        id: "span",
        label: "Anesthesiologist",
        earlyBirdPrice: 2500000,
        normalPrice: 3000000,
        onSitePrice: 3500000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "ws7",
    label: "WS 7 (Advanced Intervention of Pain Management)",
    shortLabel: "Advanced Intervention",
    date: "Friday, April 17, 2026",
    participantTypes: [
      {
        id: "span",
        label: "Anesthesiologist",
        earlyBirdPrice: 9000000,
        normalPrice: 10000000,
        onSitePrice: 11000000,
        currency: "IDR",
      },
    ],
  },
  {
    id: "symposium",
    label: "Symposium",
    shortLabel: "Symposium",
    date: "Saturday, April 18, 2026",
    participantTypes: [
      {
        id: "span",
        label: "Anesthesiologist",
        earlyBirdPrice: 2500000,
        normalPrice: 3000000,
        onSitePrice: 3500000,
        currency: "IDR",
      },
      {
        id: "resident",
        label: "Resident",
        earlyBirdPrice: 1500000,
        normalPrice: 1750000,
        onSitePrice: 2000000,
        currency: "IDR",
      },
      {
        id: "dokter_umum",
        label: "General Practitioner",
        earlyBirdPrice: 1500000,
        normalPrice: 1750000,
        onSitePrice: 2000000,
        currency: "IDR",
      },
      {
        id: "perawat",
        label: "Nurse",
        earlyBirdPrice: 500000,
        normalPrice: 700000,
        onSitePrice: 1000000,
        currency: "IDR",
      },
      {
        id: "medical_student",
        label: "Medical Student",
        earlyBirdPrice: 500000,
        normalPrice: 700000,
        onSitePrice: 1000000,
        currency: "IDR",
      },
    ],
  },
]

// Helper function to get pricing by event ID
export function getPricingByEventId(eventId: string): EventPricing | undefined {
  return eventPricingData.find((event) => event.id === eventId)
}

// Helper function to get workshop pricing by number (1-7)
export function getWorkshopPricing(workshopNumber: number): EventPricing | undefined {
  return eventPricingData.find((event) => event.id === `ws${workshopNumber}`)
}

// Helper function to format price
export function formatPrice(amount: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Helper to get minimum price for an event (for display purposes)
export function getMinimumPrice(
  eventId: string,
  priceType: "earlyBird" | "normal" | "onSite" = "earlyBird",
): number | null {
  const event = getPricingByEventId(eventId)
  if (!event || event.participantTypes.length === 0) return null

  const prices = event.participantTypes.map((pt) => {
    switch (priceType) {
      case "earlyBird":
        return pt.earlyBirdPrice
      case "normal":
        return pt.normalPrice
      case "onSite":
        return pt.onSitePrice
    }
  })

  return Math.min(...prices)
}

// Early bird deadline
export const EARLY_BIRD_DEADLINE = "2026-01-30T23:59:59"

// Helper function to get webinar pricing
export function getWebinarPricing(): EventPricing | undefined {
  return eventPricingData.find((event) => event.id === "webinar_equity_pain")
}

// Helper function to get webinar pricing by ID
export function getWebinarPricingById(webinarId: string): EventPricing | undefined {
  return eventPricingData.find((event) => event.id === webinarId)
}

// Helper function to get all webinar pricing entries
export function getAllWebinarPricing(): EventPricing[] {
  return eventPricingData.filter((event) => event.id.startsWith("webinar"))
}

// Helper function to check if a webinar is purchasable
export function isWebinarPurchasable(webinarId: string): boolean {
  const pricing = getWebinarPricingById(webinarId)
  return pricing !== undefined && pricing.participantTypes.length > 0
}
