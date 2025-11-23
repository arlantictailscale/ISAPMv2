import Image from "next/image"
import { Mail, Globe, Instagram } from 'lucide-react'

export default function WelcomeSection() {
  return (
    <section className="relative px-4 overflow-hidden py-0 mb-10">
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 items-center gap-0">
          {/* Left Side - Photo with Name Badge */}
          <div className="flex flex-col items-center md:items-start">
            <div className="relative w-full md:w-auto">
              <div className="relative w-full md:w-[800px] h-[500px] md:h-[900px] overflow-hidden">
                <Image
                  src="/images/chair-photo.jpg"
                  alt="Dr.dr. Ristiawan Muji Laksono"
                  fill
                  className="object-cover object-top pr-96"
                />
              </div>
            </div>
          </div>

          {/* Right Side - Welcome Message */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-light text-slate-700 tracking-wide mt-0 pt-10">WELCOME MESSAGE</h2>
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-wide">FROM ORGANIZING</h3>
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-wide">COMMITTEE CHAIR</h3>
              <div className="w-full h-px bg-slate-800 mt-4"></div>
            </div>

            {/* Welcome Message Content */}
            <div className="space-y-4">
              <h4 className="text-xl md:text-2xl font-bold text-slate-800">Welcome Message</h4>
              <div className="text-slate-700 leading-relaxed space-y-4 text-justify">
                <p>
                  Along with the rapid advancements in medicine—accelerating exponentially in the 21st century—we must not become complacent with the technologies that have benefited our patients and eased our daily work as anesthesiologists.
                </p>
                <p>
                  We cordially invite Distinguished Professors, Doctors, Consultants, and dedicated Anesthesiology Experts to participate in the Indonesian Society of Anesthesiology for Pain Management (ISAPM) National Meeting 2026, to be held on April 16-18, 2026.
                </p>
                <p>
                  We hope this meeting will offer valuable insights, knowledge, and skills that enhance daily practice and support ongoing professional development.
                </p>
                <p className="mt-6 text-left font-black tracking-tighter font-serif text-foreground">
                  Dr.dr. Ristiawan Muji Laksono,SpAn-TI.,Subsp.M.N.(K)., FIPP
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
