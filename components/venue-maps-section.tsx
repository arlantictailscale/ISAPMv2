"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin } from "lucide-react"

const VenueMapsContent = dynamic(() => import("./venue-maps-content").then((mod) => mod.VenueMapsContent), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="w-full h-96 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  ),
  ssr: false,
})

export function VenueMapsSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <MapPin className="w-8 h-8 text-cyan-600" />
          <h2 className="text-3xl font-bold text-gray-900">Location</h2>
        </div>
        <VenueMapsContent />
      </div>
    </section>
  )
}
