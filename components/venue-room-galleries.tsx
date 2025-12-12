"use client"

import { DeluxeRoomGallery } from "@/components/deluxe-room-gallery"
import { PremierRoomGallery } from "@/components/premier-room-gallery"

export function VenueRoomGalleries() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="space-y-16">
          <DeluxeRoomGallery />
          <PremierRoomGallery />
        </div>
      </div>
    </section>
  )
}
