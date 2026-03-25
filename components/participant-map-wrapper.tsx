"use client"

import dynamic from "next/dynamic"
import { StatsSkeleton } from "./skeleton-loaders"

// Dynamic import with ssr: false - using SVG-based map for reliability
const IndonesiaSvgMap = dynamic(
  () => import("./indonesia-svg-map").then(mod => ({ default: mod.IndonesiaSvgMap })),
  {
    loading: () => <StatsSkeleton />,
    ssr: false, // SVG manipulation needs client-side DOM
  }
)

export function ParticipantMapWrapper() {
  return <IndonesiaSvgMap />
}
