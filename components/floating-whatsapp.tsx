"use client"

import { useState, useEffect } from "react"
import { X, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Configuration - easily updateable
const WHATSAPP_CONFIG = {
  // WhatsApp number (include country code without + or spaces)
  // +62 896-0262-6709 -> 6289602626709
  phoneNumber: "6289602626709",
  // Default message when user clicks to chat
  defaultMessage: "Hi! I have a question about ISAPM 2026 National Meeting.",
  // Tooltip text
  tooltipText: "Chat with us",
  // Show tooltip on hover
  showTooltip: true,
  // Auto-show welcome message after delay (ms), set to 0 to disable
  welcomeMessageDelay: 5000,
  // Welcome message content
  welcomeMessage: "Hello! Need help with registration or have questions about ISAPM 2026? We're here to help!",
}

interface FloatingWhatsAppProps {
  phoneNumber?: string
  defaultMessage?: string
  tooltipText?: string
  showTooltip?: boolean
  welcomeMessageDelay?: number
  welcomeMessage?: string
  position?: "bottom-right" | "bottom-left"
}

export function FloatingWhatsApp({
  phoneNumber = WHATSAPP_CONFIG.phoneNumber,
  defaultMessage = WHATSAPP_CONFIG.defaultMessage,
  tooltipText = WHATSAPP_CONFIG.tooltipText,
  showTooltip = WHATSAPP_CONFIG.showTooltip,
  welcomeMessageDelay = WHATSAPP_CONFIG.welcomeMessageDelay,
  welcomeMessage = WHATSAPP_CONFIG.welcomeMessage,
  position = "bottom-right",
}: FloatingWhatsAppProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  // Delay initial appearance for smooth entry
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 1500)

    return () => clearTimeout(showTimer)
  }, [])

  // Show welcome message after delay
  useEffect(() => {
    if (welcomeMessageDelay > 0 && isVisible) {
      const welcomeTimer = setTimeout(() => {
        // Only show if user hasn't dismissed it before
        const dismissed = sessionStorage.getItem("whatsapp-welcome-dismissed")
        if (!dismissed) {
          setShowWelcome(true)
        }
      }, welcomeMessageDelay)

      return () => clearTimeout(welcomeTimer)
    }
  }, [welcomeMessageDelay, isVisible])

  // Track scroll to adjust position on mobile
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 100)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClick = () => {
    const encodedMessage = encodeURIComponent(defaultMessage)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
  }

  const dismissWelcome = () => {
    setShowWelcome(false)
    sessionStorage.setItem("whatsapp-welcome-dismissed", "true")
  }

  const positionClasses = position === "bottom-right" 
    ? "right-4 md:right-6" 
    : "left-4 md:left-6"

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-500 ease-out",
        positionClasses,
        // Adjust for mobile bottom nav (pb-16 on mobile)
        hasScrolled ? "bottom-20 md:bottom-6" : "bottom-20 md:bottom-6",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
      )}
    >
      {/* Welcome Message Bubble */}
      {showWelcome && (
        <div
          className={cn(
            "absolute bottom-16 mb-2 w-64 animate-in fade-in slide-in-from-bottom-2 duration-300",
            position === "bottom-right" ? "right-0" : "left-0"
          )}
        >
          <div className="relative rounded-2xl bg-white p-4 shadow-lg border border-gray-100">
            {/* Close button */}
            <button
              onClick={dismissWelcome}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            
            {/* Message content */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">ISAPM Support</p>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {welcomeMessage}
                </p>
              </div>
            </div>
            
            {/* Chat now button */}
            <button
              onClick={handleClick}
              className="mt-3 w-full rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
            >
              Chat Now
            </button>
            
            {/* Speech bubble tail */}
            <div 
              className={cn(
                "absolute -bottom-2 h-4 w-4 rotate-45 bg-white border-b border-r border-gray-100",
                position === "bottom-right" ? "right-6" : "left-6"
              )}
            />
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && isHovered && !showWelcome && (
        <div
          className={cn(
            "absolute bottom-full mb-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white shadow-lg animate-in fade-in zoom-in-95 duration-200",
            position === "bottom-right" ? "right-0" : "left-0"
          )}
        >
          {tooltipText}
          <div 
            className={cn(
              "absolute top-full h-2 w-2 -translate-y-1 rotate-45 bg-gray-900",
              position === "bottom-right" ? "right-5" : "left-5"
            )}
          />
        </div>
      )}

      {/* Main WhatsApp Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "bg-green-500 hover:bg-green-600 hover:scale-110 hover:shadow-xl",
          "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2",
          // Pulse animation when welcome message is shown
          showWelcome && "animate-pulse"
        )}
        aria-label="Chat on WhatsApp"
      >
        {/* WhatsApp Icon */}
        <svg 
          viewBox="0 0 24 24" 
          className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-110" 
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>

        {/* Notification dot - shows when welcome is visible */}
        {showWelcome && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
          </span>
        )}
      </button>
    </div>
  )
}
