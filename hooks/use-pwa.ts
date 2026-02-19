"use client"

import { useState, useEffect } from "react"

interface PWAStatus {
  isInstalled: boolean
  isInstallable: boolean
  isOnline: boolean
  isIOS: boolean
  isAndroid: boolean
}

export function usePWA(): PWAStatus {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOnline: true,
    isIOS: false,
    isAndroid: false,
  })

  useEffect(() => {
    // Check if installed
    const isInStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      window.navigator.standalone === true

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    setStatus((prev) => ({
      ...prev,
      isInstalled: isInStandaloneMode,
      isIOS,
      isAndroid,
      isOnline: navigator.onLine,
    }))

    // Listen for install prompt
    const handleBeforeInstallPrompt = () => {
      setStatus((prev) => ({ ...prev, isInstallable: true }))
    }

    // Listen for online/offline
    const handleOnline = () => setStatus((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setStatus((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return status
}
