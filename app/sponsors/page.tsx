import type { Metadata } from "next"
import Image from "next/image"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Our Sponsors",
  description:
    "ISAPM 2026 is proudly supported by leading pharmaceutical and medical equipment companies in Indonesia.",
}

const sponsors = [
  {
    name: "Dexa Medica",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Dexa%20Medica-5YagLo8G1r65SVCJwHdDjT8rfz49Hg.png",
  },
  {
    name: "PT. ETHICA Industri Farmasi",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pt-ethica-logo-dark-1BK8JOPfmYpqenmc2UoMvRetGCcUOX.png",
  },
  {
    name: "PT. Withall Medika Indonesia",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/01.%20Logo%20Primary%20Withall%20Media%20Indonesia%20%281%29-3Sd1lKJCgsD0gN8Z2j45mFrNNtyiNH.png",
  },
  {
    name: "Bernofarm Pharmaceutical Company",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20bernofarm-4RPdVpH5JyloU3YDCtWfls07H9gtH3.png",
  },
  {
    name: "Martha Inti Persada",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/martha%20inti%20persada-r7vfGujV5BE7WVXLpa2WpHlvJaeWRf.png",
  },
  {
    name: "Fahrenheit - PT Pratapa Nirmala",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-FahrenheiT-DAN-NAMA-PT-Ck25w1lK2nLRk2KmQKKopvwICKk931.png",
  },
  {
    name: "Kimera Health",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/employee%20of%20the%20month.pdf-4hugEQza1DyAnKfWslB7j32pfhQMIj.png",
  },
  {
    name: "B. Braun",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbraun-uYEVs8EQs8NZVqgFqIHGHRIxc6Z9Y4.png",
  },
  {
    name: "Eufrat Med",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20Eufrat%20Med%20standard%20august%202025.pdf-gwRGLfabQStTn4H9Oyy9RL4zxif3rZ.png",
  },
  {
    name: "Sonna Medika Jaya",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-sonna-medika-o5aKXHRnIZSNbGHLblH2RfVnKUv7x4.jpg",
  },
  {
    name: "PT. Mahakam Beta Farma",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MBF%20Logo-04-1mtcfzMTNeeQhcqv4yuPHHxLt3FS1t.png",
  },
  {
    name: "PT. Tri Tunggal Alkesindo",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tritunggal%20alkesindo-z7BnYVn93i8BbxbVg4dKA7cGqevKpJ.png",
  },
  {
    name: "Kimia Farma",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Kimia_Farma_logo.svg-xJWO71aH6kBnOhBjaAdtTwMF6D3Yj0.png",
  },
  {
    name: "PT. Wellesta CPI",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20PT.%20Wellesta%20CPI-Y7Eso9SQMbtPSxFIGRKXWkE4uW2jWO.png",
  },
  {
    name: "PT Mitsubishi Tanabe Pharma Indonesia",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tanabe-067EfwcDVB2PLzA424aMcX1OOqVl36.png",
  },
  {
    name: "PT Karya Hisani Mandiri",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20KHM-fgdqrDodlVoMXisDwEYUEb668GoVqO.png",
  },
  {
    name: "Novell Pharmaceutical Laboratories",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PT-Novell-Pharmaceutical-Laboratories--1vvMVVVTHIj9IUUfbNpeTCYGvlmVtj.jpg",
  },
  {
    name: "Kalbe",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Kalbe%20baru-eqVHBx3X6MQKtk8TaXjfySelbPeceZ.png",
  },
]

export default function SponsorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Supported by
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                ISAPM 2026 is made possible through the generous support of our valued sponsors and partners 
                from Indonesia&apos;s leading pharmaceutical and medical equipment companies.
              </p>
            </div>

            {/* Sponsors Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
              {sponsors.map((sponsor, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center border border-slate-100 hover:border-teal-200"
                >
                  <div className="relative w-full h-20 md:h-24 flex items-center justify-center">
                    <Image
                      src={sponsor.logo}
                      alt={sponsor.name}
                      fill
                      className="object-contain filter grayscale-[30%] group-hover:grayscale-0 transition-all duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-teal-600 to-teal-700">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Interested in Becoming a Sponsor?
            </h2>
            <p className="text-teal-100 mb-8 max-w-2xl mx-auto">
              Join our distinguished sponsors and showcase your brand to healthcare professionals 
              from across Indonesia at ISAPM 2026.
            </p>
            <a
              href="mailto:sponsorship@isapm2026.org"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-teal-700 font-semibold rounded-full hover:bg-teal-50 transition-colors duration-200"
            >
              Contact Us for Sponsorship
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
