"use client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { AlertCircle, FileText, CheckCircle, Award } from 'lucide-react'
import Link from 'next/link'

export default function EPoster() {
  // Main content rendering without authentication check
  return (
    <>
      <Navigation />
      <main className="pt-24 overflow-x-hidden">
        <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl sm:text-5xl font-bold mb-6">e-Poster ISAPM 2026</h1>
            <p className="text-lg text-muted-foreground">
              Guidelines and requirements for submitting e-Posters to the ISAPM National Meeting
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-6 flex gap-4">
              <AlertCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-2">Submission Deadline: March 31, 2026</p>
                <p className="text-sm text-muted-foreground">
                  All e-Poster abstracts must be submitted online through our submission form by March 31, 2026
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                e-Poster File Requirements
              </h2>
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">1.</span>
                    <span>e-Posters will be displayed on LED screens</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">2.</span>
                    <span>File format: TIFF (*.tif/8.tiff) or JPEG</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">3.</span>
                    <span>Maximum file size: 10 MB</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">4.</span>
                    <span>Maximum slides per e-Poster: 2 slides</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">5.</span>
                    <span>All posters displayed in portrait layout</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">6.</span>
                    <span>No animated files, films, or audio files accepted</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">7.</span>
                    <span>Include PERDATIN logo (top right) and institution logo (top left)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">8.</span>
                    <span>
                      References must use AMA (American Medical Association) format using Mendeley. Maximum 20
                      references. Learn more:{" "}
                      <a
                        href="https://guides.lib.berkeley.edu/index.php/jap/about/submissions#authorGuidelines"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        AMA Style Guide
                      </a>
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                e-Poster Writing Guidelines
              </h2>
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">1.</span>
                    <span>Poster must include abstract and full paper</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">2.</span>
                    <span>
                      Follow guidelines from{" "}
                      <a
                        href="https://jap.ub.ac.id/index.php/jap/about/submissions#authorGuidelines"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Journal of Anesthesia and Pain
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">3.</span>
                    <span>Abstract must be in English</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">4.</span>
                    <span>Title: capitalized and bold, concise and specific</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">5.</span>
                    <span>Include full author names (without degrees) underlined</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">6.</span>
                    <span>Include institution names and author cities</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">7.</span>
                    <span>Avoid non-standard abbreviations, unclear terms, symbols, or acronyms</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">8.</span>
                    <span>Use Arial font, size 11</span>
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <p className="font-semibold mb-2">Select One Topic:</p>
                  <ul className="space-y-2 text-sm">
                    <li>• Emergencies (Kegawatdaruratan)</li>
                    <li>• Pain Management (Manajemen Nyeri)</li>
                    <li>• ICU Management (Manajemen ICU)</li>
                    <li>• Anesthesia Management (Manajemen Anestesi)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                e-Poster Display & Selection
              </h2>
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">1.</span>
                    <span>All approved e-Posters will be automatically displayed on LED screens as a slide show</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">2.</span>
                    <span>10 selected posters will be presented in front of evaluation committee</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">3.</span>
                    <span>Presentation schedule and location will be announced later</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">4.</span>
                    <span>All accepted participants must pay conference registration fee</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">5.</span>
                    <span>Presentation details will be sent via email before April 2026</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                Awards & Recognition
              </h2>
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">1.</span>
                    <span>10 best posters will be selected for presentation</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">2.</span>
                    <span>
                      3 best posters will be published in{" "}
                      <a
                        href="https://jap.ub.ac.id/index.php/jap"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Journal of Anesthesia and Pain
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">3.</span>
                    <span>Winners receive cash prize and certificate</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">4.</span>
                    <span>Winners announced by April 2026</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">5.</span>
                    <span>Case presentations: wear traditional attire from your region</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-8">
              <h3 className="font-display text-xl font-bold mb-4">How to Submit</h3>
              <p className="text-foreground mb-4">
                Submit your e-Poster abstract through our online submission form.
              </p>
              <p className="text-foreground mb-6">
                <strong>Submission Deadline:</strong> March 31, 2026
              </p>
              
              <Link href="/submit-poster">
                <button className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity mb-4">
                  Submit Your E-Poster
                </button>
              </Link>

              <div className="bg-background rounded p-4">
                <p className="font-semibold mb-2">For more information, contact:</p>
                <p className="text-sm">
                  <a 
                    href="https://wa.me/6289602626709" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    +62 896-0262-6709 (WhatsApp)
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
