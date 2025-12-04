"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, FileText } from "lucide-react"
import { toast } from "sonner"

interface DownloadInvoiceButtonProps {
  orderId: string
  invoiceNumber?: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  isSponsored?: boolean
}

export function DownloadInvoiceButton({
  orderId,
  invoiceNumber,
  variant = "outline",
  size = "default",
  className,
  isSponsored = false,
}: DownloadInvoiceButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const buttonLabel = isSponsored ? "Unduh Bukti Registrasi" : "Unduh Kwitansi"
  const downloadingLabel = "Mengunduh..."
  const filePrefix = isSponsored ? "Bukti-Registrasi" : "Kwitansi"
  const successMessage = isSponsored ? "Bukti registrasi berhasil diunduh" : "Kwitansi berhasil diunduh"
  const errorMessage = isSponsored ? "Gagal mengunduh bukti registrasi" : "Gagal mengunduh kwitansi"

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const response = await fetch(`/api/invoice/generate?orderId=${orderId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate invoice")
      }

      // Get the blob from response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${filePrefix}-ISAPM-2026-${invoiceNumber || orderId.slice(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(successMessage, {
        description: "File PDF telah disimpan ke perangkat Anda.",
      })
    } catch (error) {
      console.error("[v0] Error downloading invoice:", error)
      toast.error(errorMessage, {
        description: error instanceof Error ? error.message : "Silakan coba lagi nanti.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {downloadingLabel}
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          {buttonLabel}
        </>
      )}
    </Button>
  )
}
