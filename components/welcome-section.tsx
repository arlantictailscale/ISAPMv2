import Image from "next/image"
import { ScrollSection } from "@/components/scroll-section"

export default function WelcomeSection() {
  return (
    <section className="relative px-4 overflow-hidden py-0 mb-10">
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 items-start gap-0">
          {/* Left Side - Photo with Name Badge - Hidden on mobile, visible on desktop */}
          <ScrollSection animation="slide-left" className="hidden md:flex flex-col items-center md:items-start">
            <div className="relative w-full md:w-auto">
              <div className="relative w-full md:w-[500px] lg:w-[600px] h-[700px] lg:h-[800px] overflow-hidden">
                <Image
                  src="/images/chair-photo.jpg"
                  alt="Dr.dr. Ristiawan Muji Laksono - Committee Chair of ISAPM 2026"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>
          </ScrollSection>

          {/* Right Side - Welcome Message */}
          <ScrollSection animation="slide-right" className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-light text-slate-700 tracking-wide mt-0 pt-4 md:pt-10 scroll-underline">
                WELCOME MESSAGE
              </h2>
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-wide">FROM ORGANIZING</h3>
              <h3 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-wide">COMMITTEE CHAIR</h3>
              <div className="w-full h-px bg-slate-800 mt-4"></div>
            </div>

            {/* Welcome Message Content */}
            <div className="space-y-4">
              <h4 className="text-xl md:text-2xl font-bold text-slate-800">Welcome Message</h4>
              <div className="text-slate-700 leading-relaxed space-y-4 text-justify stagger-children">
                <p>
                  Along with the rapid advancements in medicine—accelerating exponentially in the 21st century—we must
                  not become complacent with the technologies that have benefited our patients and eased our daily work
                  as anesthesiologists.
                </p>
                <p>
                  We cordially invite Distinguished Professors, Doctors, Consultants, and dedicated Anesthesiology
                  Experts to participate in the Indonesian Society of Anesthesiology for Pain Management (ISAPM)
                  National Meeting 2026, to be held on April 16-18, 2026.
                </p>
                <p>
                  We hope this meeting will offer valuable insights, knowledge, and skills that enhance daily practice
                  and support ongoing professional development.
                </p>

                <div className="flex items-center gap-4 mt-6 md:mt-0">
                  <div className="relative w-16 h-16 md:hidden rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-300">
                    <Image
                      src="/images/chair-photo.jpg"
                      alt="Dr.dr. Ristiawan Muji Laksono"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <p className="text-left font-black tracking-tighter font-serif text-foreground">
                    Dr.dr. Ristiawan Muji Laksono,SpAn-TI.,Subsp.M.N.(K)., FIPP
                  </p>
                </div>
              </div>
            </div>
          </ScrollSection>
        </div>
      </div>
    </section>
  )
}
