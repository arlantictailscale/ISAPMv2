"use client"

import { useRef } from "react"
import { QRCodeSVG } from "qrcode.react"

const SURVEY_URL = "https://www.isapm2026.org/pain-clinic-survey"

export default function PainClinicSurveyQRPage() {
  const printRef = useRef<HTMLDivElement>(null)

  function handleDownload() {
    const svg = printRef.current?.querySelector("svg")
    if (!svg) return

    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const blob = new Blob([svgStr], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "pain-clinic-survey-qr.svg"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center gap-6 print:shadow-none print:p-0">
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-1">ISAPM 2026</p>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Pain Clinic Survey</h1>
          <p className="text-sm text-gray-500 mt-1">Scan to fill out the survey</p>
        </div>

        {/* QR Code */}
        <div
          ref={printRef}
          className="p-4 bg-white rounded-xl border border-gray-100 shadow-inner"
        >
          <QRCodeSVG
            value={SURVEY_URL}
            size={220}
            bgColor="#ffffff"
            fgColor="#1a1a1a"
            level="H"
            marginSize={2}
            imageSettings={{
              src: "/logo-isapm.png",
              x: undefined,
              y: undefined,
              height: 36,
              width: 36,
              excavate: true,
            }}
          />
        </div>

        {/* URL */}
        <p className="text-xs text-gray-400 break-all text-center">{SURVEY_URL}</p>

        {/* Action Buttons — hidden on print */}
        <div className="flex gap-3 w-full print:hidden">
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 rounded-xl border border-orange-500 text-orange-500 text-sm font-medium hover:bg-orange-50 transition-colors"
          >
            Download SVG
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
