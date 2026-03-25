"use client"

import dynamic from "next/dynamic"
import { StatsSkeleton } from "./skeleton-loaders"

// Dynamic import with ssr: false is allowed in Client Components
const IndonesiaParticipantMap = dynamic(
  () => import("./indonesia-participant-map").then(mod => ({ default: mod.IndonesiaParticipantMap })),
  {
    loading: () => <StatsSkeleton />,
    ssr: false, // This is fine in a Client Component
  }
)

export function ParticipantMapWrapper() {
  return <IndonesiaParticipantMap />
}
