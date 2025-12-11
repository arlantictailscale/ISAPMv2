"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load gallery components with ssr: false (must be in client component)
const DeluxeRoomGalleryDynamic = dynamic(
  () => import("@/components/deluxe-room-gallery").then((mod) => ({ default: mod.DeluxeRoomGallery })),
  {
    loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
    ssr: false,
  },
)

const PremierRoomGalleryDynamic = dynamic(
  () => import("@/components/premier-room-gallery").then((mod) => ({ default: mod.PremierRoomGallery })),
  {
    loading: () => <Skeleton className="h-48 w-full rounded-lg" />,
    ssr: false,
  },
)

export function DeluxeRoomGallery() {
  return <DeluxeRoomGalleryDynamic />
}

export function PremierRoomGallery() {
  return <PremierRoomGalleryDynamic />
}
