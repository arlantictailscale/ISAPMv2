"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Expand, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const deluxeRoomImages = [
  {
    src: "/images/cover-20deluxe.jpg",
    alt: "Deluxe Room - Elegant bedroom with illuminated mirror and balcony view",
    title: "Elegant Bedroom",
  },
  {
    src: "/images/deluxe-202.jpg",
    alt: "Deluxe Room - Spacious room with work desk and modern amenities",
    title: "Work & Relaxation Area",
  },
  {
    src: "/images/20240724-115404ed.jpg",
    alt: "Deluxe Room - Full room panorama with traditional Javanese art",
    title: "Room Panorama",
  },
  {
    src: "/images/dsc08842edt.jpg",
    alt: "Deluxe Room - King bed with orange accents and bathroom view",
    title: "King Bed Suite",
  },
  {
    src: "/images/deluxe-205.jpg",
    alt: "Deluxe Room - Marble vanity bathroom with backlit mirror",
    title: "Luxury Bathroom",
  },
  {
    src: "/images/dsc03945edtt.jpg",
    alt: "Deluxe Room - In-room coffee and tea making facilities",
    title: "Refreshment Station",
  },
  {
    src: "/images/dsc03758edt.jpg",
    alt: "Deluxe Room - Premium Singhasari Resort bathroom amenities",
    title: "Premium Amenities",
  },
]

const GalleryModal = ({ images, currentIndex, isOpen, onOpenChange, onNext, onPrev, onKeyDown }: any) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent
      className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none overflow-hidden"
      onKeyDown={onKeyDown}
      hideCloseButton
    >
      <VisuallyHidden>
        <DialogTitle>Deluxe Room Gallery - {images[currentIndex].title}</DialogTitle>
      </VisuallyHidden>

      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
        onClick={() => onOpenChange(false)}
        aria-label="Close gallery"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Image Counter */}
      <div className="absolute top-4 left-4 z-50 text-white/90 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full h-[70vh] max-h-[600px]">
          <Image
            src={images[currentIndex].src || "/placeholder.svg"}
            alt={images[currentIndex].alt}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12"
          onClick={onPrev}
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full w-12 h-12"
          onClick={onNext}
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>

      {/* Image Title */}
      <div className="absolute bottom-20 left-0 right-0 text-center">
        <p className="text-white font-medium text-lg">{images[currentIndex].title}</p>
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
        {images.map((image: any, index: number) => (
          <button
            key={index}
            onClick={() => {
              // Update currentIndex through parent
              const event = new CustomEvent("updateIndex", { detail: index })
              window.dispatchEvent(event)
            }}
            className={cn(
              "relative flex-shrink-0 w-16 h-12 rounded overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500",
              index === currentIndex ? "ring-2 ring-cyan-500 opacity-100 scale-110" : "opacity-60 hover:opacity-100",
            )}
            aria-label={`View ${image.title}`}
            aria-current={index === currentIndex ? "true" : undefined}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 48'%3E%3Crect fill='%23cbd5e1' width='64' height='48'/%3E%3C/svg%3E"
            />
          </button>
        ))}
      </div>
    </DialogContent>
  </Dialog>
)

export function DeluxeRoomGallery() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openGallery = (index = 0) => {
    setCurrentIndex(index)
    setIsOpen(true)
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % deluxeRoomImages.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + deluxeRoomImages.length) % deluxeRoomImages.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextImage()
    if (e.key === "ArrowLeft") prevImage()
    if (e.key === "Escape") setIsOpen(false)
  }

  return (
    <>
      {/* Thumbnail Grid Trigger */}
      <div className="mt-4">
        <button
          onClick={() => openGallery(0)}
          className="group relative w-full h-48 rounded-lg overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          aria-label="View deluxe room photo gallery"
        >
          <Image
            src={deluxeRoomImages[0].src || "/placeholder.svg"}
            alt={deluxeRoomImages[0].alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23e2e8f0' width='400' height='300'/%3E%3C/svg%3E"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Camera className="w-5 h-5" />
              <span className="font-medium text-sm">View Room Gallery</span>
            </div>
            <div className="flex items-center gap-1 text-white/90 text-xs">
              <span>{deluxeRoomImages.length} photos</span>
              <Expand className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </button>

        {/* Mini Thumbnail Preview */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {deluxeRoomImages.slice(1, 5).map((image, index) => (
            <button
              key={index}
              onClick={() => openGallery(index + 1)}
              className="relative flex-shrink-0 w-16 h-12 rounded overflow-hidden opacity-80 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label={`View ${image.title}`}
            >
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                fill
                className="object-cover"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 48'%3E%3Crect fill='%23cbd5e1' width='64' height='48'/%3E%3C/svg%3E"
              />
            </button>
          ))}
          {deluxeRoomImages.length > 5 && (
            <button
              onClick={() => openGallery(5)}
              className="relative flex-shrink-0 w-16 h-12 rounded overflow-hidden bg-slate-800 text-white text-xs font-medium flex items-center justify-center hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="View more photos"
            >
              +{deluxeRoomImages.length - 5}
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <GalleryModal
        images={deluxeRoomImages}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onNext={nextImage}
        onPrev={prevImage}
        onKeyDown={handleKeyDown}
      />
    </>
  )
}
