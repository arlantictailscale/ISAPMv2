"use client"

import { QRCodeSVG } from "qrcode.react"
import { MessageSquare, Download } from "lucide-react"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

export default function FeedbackQRPage() {
  const feedbackUrl = "https://isapm2026.org/feedback"

  const handleDownload = () => {
    const svg = document.querySelector(".qr-code-container svg")
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        canvas.width = 400
        canvas.height = 400
        if (ctx) {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, 400, 400)
          ctx.drawImage(img, 50, 50, 300, 300)
        }
        const link = document.createElement("a")
        link.download = "isapm2026-feedback-qr.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
      }
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 to-white">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          {/* Header */}
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kritik & Saran</h1>
          <p className="text-gray-600 mb-6">ISAPM 2026</p>

          {/* QR Code */}
          <div className="qr-code-container bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 inline-block mb-6">
            <QRCodeSVG
              value={feedbackUrl}
              size={200}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#0d9488"
            />
          </div>

          <p className="text-sm text-gray-600 mb-6">Scan QR code di atas untuk memberikan masukan Anda</p>

          {/* URL Display */}
          <div className="bg-gray-50 rounded-xl p-3 mb-6">
            <p className="text-xs text-gray-500 mb-1">Atau kunjungi:</p>
            <p className="text-teal-600 font-medium text-sm break-all">{feedbackUrl}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/feedback"
              className="w-full py-3 px-4 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Buka Halaman Feedback
            </Link>
            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
          </div>
        </div>

        {/* Print Instructions */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-medium text-gray-900 mb-2 text-sm">Petunjuk Penggunaan:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>1. Cetak halaman ini atau unduh QR code</li>
            <li>2. Tempel di lokasi strategis (meja registrasi, ruang seminar)</li>
            <li>3. Peserta dapat scan untuk memberikan feedback</li>
          </ul>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
            Kembali ke Beranda
          </Link>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
