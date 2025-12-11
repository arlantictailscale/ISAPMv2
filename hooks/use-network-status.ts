"use client"

import { useState, useEffect } from "react"

interface NetworkStatus {
  online: boolean
  effectiveType: "slow-2g" | "2g" | "3g" | "4g" | undefined
  downlink: number | undefined
  rtt: number | undefined
  saveData: boolean
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    online: true,
    effectiveType: undefined,
    downlink: undefined,
    rtt: undefined,
    saveData: false,
  })

  useEffect(() => {
    const updateStatus = () => {
      const connection =
        (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      setStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData || false,
      })
    }

    updateStatus()

    window.addEventListener("online", updateStatus)
    window.addEventListener("offline", updateStatus)

    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener("change", updateStatus)
    }

    return () => {
      window.removeEventListener("online", updateStatus)
      window.removeEventListener("offline", updateStatus)
      if (connection) {
        connection.removeEventListener("change", updateStatus)
      }
    }
  }, [])

  return status
}

// Helper to determine if we should load low-quality assets
export function shouldLoadLowQuality(status: NetworkStatus): boolean {
  return (
    status.saveData ||
    status.effectiveType === "slow-2g" ||
    status.effectiveType === "2g" ||
    (status.rtt !== undefined && status.rtt > 500)
  )
}
