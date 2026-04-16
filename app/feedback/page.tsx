"use client"

import { useState } from "react"
import { MessageSquare, Send, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      // Handle empty response
      const text = await response.text()
      if (!text) {
        throw new Error("Server returned empty response")
      }
      
      let result
      try {
        result = JSON.parse(text)
      } catch {
        console.error("[v0] Failed to parse response:", text)
        throw new Error("Invalid server response")
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit feedback")
      }

      setIsSubmitted(true)
    } catch (err) {
      console.error("[v0] Feedback submission error:", err)
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h2>
            <p className="text-gray-600 mb-6">
              Masukan Anda telah berhasil dikirim. Kami sangat menghargai waktu dan kontribusi Anda untuk membantu kami
              menjadi lebih baik.
            </p>
            {formData.email && (
              <p className="text-sm text-gray-500 mb-6">
                Konfirmasi telah dikirim ke <span className="font-medium">{formData.email}</span>
              </p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData({ name: "", email: "", category: "general", message: "" })
                }}
                className="w-full py-3 px-4 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
              >
                Kirim Masukan Lainnya
              </button>
              <Link
                href="/"
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-center"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kritik & Saran</h1>
              <p className="text-teal-100 text-sm">ISAPM 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
          <p className="text-gray-600 mb-6">
            Kami sangat menghargai masukan Anda untuk membantu meningkatkan kualitas acara ISAPM 2026. Silakan
            sampaikan kritik, saran, atau ide Anda di bawah ini.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="Masukkan nama Anda"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                placeholder="email@contoh.com"
              />
              <p className="text-xs text-gray-500 mt-1">Kami akan mengirim konfirmasi jika email diisi</p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all bg-white"
              >
                <option value="general">Umum</option>
                <option value="registration">Pendaftaran</option>
                <option value="event">Acara / Program</option>
                <option value="venue">Venue / Lokasi</option>
                <option value="website">Website / Aplikasi</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                Pesan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
                placeholder="Tuliskan kritik, saran, atau masukan Anda..."
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Kirim Masukan
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            Dengan mengirimkan formulir ini, Anda menyetujui bahwa masukan Anda dapat digunakan untuk meningkatkan acara
            ISAPM.
          </p>
        </div>
      </div>
    </div>
  )
}
