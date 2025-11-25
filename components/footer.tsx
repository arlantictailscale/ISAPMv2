"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Instagram } from "lucide-react"
import Image from "next/image"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* About */}
          <div>
            <div className="mb-4">
              {/* Main conference logo */}
              <Link href="/" className="inline-block mb-4">
                <Image
                  src="/images/isapm-2026-logo.png"
                  alt="ISAPM 2026 - 8th Indonesian Society of Anesthesiology for Pain Management National Meeting"
                  width={280}
                  height={80}
                  className="h-14 md:h-16 w-auto"
                />
              </Link>
              {/* Partner logos in horizontal row */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <Image
                  src="/images/kemenkes-logo.png"
                  alt="Kementerian Kesehatan Republik Indonesia"
                  width={160}
                  height={80}
                  className="h-10 md:h-12 w-auto"
                />
                <Image
                  src="/images/isapm-org-logo.png"
                  alt="ISAPM - Indonesian Society of Anesthesiology for Pain Management"
                  width={80}
                  height={80}
                  className="h-10 md:h-12 w-auto"
                />
                <Image
                  src="/images/perdatin-logo.png"
                  alt="PERDATIN - Perhimpunan Dokter Spesialis Anestesiologi dan Terapi Intensif Indonesia"
                  width={80}
                  height={80}
                  className="h-10 md:h-12 w-auto"
                />
              </div>
            </div>
            {/* End of logo rearrangement */}
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              The Indonesian Society of Anesthesiology for Pain Management National Meeting brings together healthcare
              professionals to advance pain management practices with equity and excellence.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:admin@isapm2026.org"
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:underline"
                >
                  admin@isapm2026.org
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <a
                    href="https://wa.me/6289602626709"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-foreground/80 hover:text-primary-foreground hover:underline block"
                  >
                    +62 896-0262-6709 (WhatsApp)
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/80">Batu, Malang, East Java, Indonesia</span>
              </div>
              <div className="flex items-start gap-3">
                <Instagram size={18} className="mt-0.5 flex-shrink-0" />
                <a
                  href="https://www.instagram.com/isapm_id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:underline"
                >
                  @isapm_id
                </a>
              </div>
              <div className="pt-2">
                <a
                  href="https://www.positivessl.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Image
                    src="/images/positivessl-seal-sm.png"
                    alt="Secured by PositiveSSL"
                    width={124}
                    height={32}
                    className="hover:opacity-80 transition-opacity"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {currentYear} Indonesian Society of Anesthesiology for Pain Management. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-6">
            <Link href="/privacy-policy" className="hover:text-primary-foreground hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-primary-foreground hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
