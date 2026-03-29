"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn } from "lucide-react"

interface ImageLightboxProps {
  src: string
  alt: string
}

export default function ImageLightbox({ src, alt }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      {/* Clickable Image */}
      <div
        className="aspect-video rounded-xl overflow-hidden mb-8 shadow-lg bg-slate-100 relative group cursor-zoom-in"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          crossOrigin="anonymous"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md">
            <ZoomIn className="w-5 h-5 text-slate-700" />
          </div>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Full Image */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            crossOrigin="anonymous"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
