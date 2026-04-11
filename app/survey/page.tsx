import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Survey | ISAPM 2026",
  description: "Complete the ISAPM 2026 survey form. Your feedback is important to us.",
}

export default function SurveyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-sans mb-2">
            ISAPM 2026 Survey
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Please complete the form below. Your response helps us improve future events.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSfGNTxllFxldy80ExDJClJU5jUQnmyO6sWKNCX8XwxBtFNBmQ/viewform?embedded=true"
            width="100%"
            height="1357"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            className="w-full"
            title="ISAPM 2026 Survey Form"
          >
            Loading form...
          </iframe>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Having trouble viewing the form?{" "}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfGNTxllFxldy80ExDJClJU5jUQnmyO6sWKNCX8XwxBtFNBmQ/viewform?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 underline hover:text-teal-700 transition-colors"
          >
            Open in a new tab
          </a>
        </p>
      </main>

      <Footer />
    </div>
  )
}
