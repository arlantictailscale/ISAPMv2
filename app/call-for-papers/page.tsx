"use client"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CallForPapersPage() {
  return (
    <>
      <Navigation />
      <main className="pt-16">
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />

          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-30" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              {/* <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-1.5">
                <Sparkles className="w-3 h-3 mr-1" />
                Call for Papers - ISAPM 2026
              </Badge> */}

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                {/* <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Submit Your Research
                </span> */}
                <span className="text-foreground">Call for Papers</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                Submit your e-Posters and research presentations to be considered for the ISAPM National Meeting.
                Selected presentations will be featured on our LED screens and outstanding submissions will be
                considered for publication.
              </p>

              {/* Deadline Highlight */}
              <div className="max-w-xl mx-auto">
                {/* <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 shadow-sm">
                  <div className="p-2 rounded-lg bg-orange-100">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-orange-800">Submission Deadline: March 15, 2026</p>
                    <p className="text-xs text-orange-600">
                      All e-Poster abstracts must be submitted online through our submission form.
                    </p>
                  </div>
                </div> */}
                <p className="text-sm font-semibold text-orange-700 bg-orange-50 p-4 rounded">
                  Submission Deadline: March 15, 2026
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            {/* Section Headers with Icons */}
            <div className="space-y-16">
              {/* File Requirements */}
              {/* <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">File Requirements</h2>
                    <p className="text-sm text-muted-foreground">Technical specifications for e-Poster submissions</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { num: 1, text: "Posters will be displayed on LED screens" },
                    { num: 2, text: "File format: TIFF (*.tif/*.tiff) or JPEG" },
                    { num: 3, text: "Maximum file size: 10 MB" },
                    { num: 4, text: "Maximum slides per e-Poster: 2 slides" },
                    { num: 5, text: "All posters displayed in portrait layout" },
                    { num: 6, text: "No animated files, films, or audio files accepted" },
                    { num: 7, text: "Include PERDATIN logo (top right) and institution logo (top left)" },
                    {
                      num: 8,
                      text: "References must use AMA format using Mendeley. Max 20 references. Learn more: AMA Style Guide",
                    },
                  ].map((item) => (
                    <Card key={item.num} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <span className="text-primary font-bold flex-shrink-0">{item.num}.</span>
                          <span className="text-sm">{item.text}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div> */}

              <div>
                <h2 className="text-2xl font-bold mb-6">File Requirements</h2>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>Posters will be displayed on LED screens</li>
                  <li>File format: TIFF (*.tif/*.tiff) or JPEG</li>
                  <li>Maximum file size: 10 MB</li>
                  <li>Maximum slides per e-Poster: 2 slides</li>
                  <li>All posters displayed in portrait layout</li>
                  <li>No animated files, films, or audio files accepted</li>
                  <li>Include PERDATIN logo (top right) and institution logo (top left)</li>
                  <li>References must use AMA format using Mendeley. Max 20 references.</li>
                </ol>
              </div>

              {/* Writing Guidelines */}
              {/* <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Writing Guidelines</h2>
                    <p className="text-sm text-muted-foreground">Content and formatting standards</p>
                  </div>
                </div>

                <Card className="border-l-4 border-l-blue-600">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-4 text-blue-900">Content Requirements</h3>
                        <ul className="space-y-2">
                          {[
                            "Poster must include abstract and full paper",
                            "Follow guidelines from Journal of Anesthesia and Pain",
                            "Abstract must be in English",
                            "Title: capitalized, bold, concise and specific",
                            "Include full author names (without degrees) underlined",
                            "Include institution names and author cities",
                          ].map((item, idx) => (
                            <li key={idx} className="flex gap-2 text-sm">
                              <span className="text-blue-600 font-bold">{idx + 1}.</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-4 text-blue-900">Formatting</h3>
                        <ul className="space-y-2 mb-4">
                          <li className="flex gap-2 text-sm">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Avoid non-standard abbreviations, unclear terms, symbols, or acronyms</span>
                          </li>
                          <li className="flex gap-2 text-sm">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Use Arial font, size 11</span>
                          </li>
                        </ul>

                        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <p className="font-semibold mb-3 text-sm">Select One Topic:</p>
                          <ul className="space-y-1 text-sm">
                            <li>• Emergencies (Kegawatdaruratan)</li>
                            <li>• Pain Management (Manajemen Nyeri)</li>
                            <li>• ICU Management (Manajemen ICU)</li>
                            <li>• Anesthesia Management (Manajemen Anestesi)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div> */}

              <div>
                <h2 className="text-2xl font-bold mb-6">Writing Guidelines</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Content Requirements</h3>
                    <ol className="space-y-2 text-sm list-decimal list-inside">
                      <li>Poster must include abstract and full paper</li>
                      <li>Follow guidelines from Journal of Anesthesia and Pain</li>
                      <li>Abstract must be in English</li>
                      <li>Title: capitalized, bold, concise and specific</li>
                      <li>Include full author names (without degrees) underlined</li>
                      <li>Include institution names and author cities</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Formatting</h3>
                    <ul className="space-y-2 text-sm list-disc list-inside">
                      <li>Avoid non-standard abbreviations, unclear terms, symbols, or acronyms</li>
                      <li>Use Arial font, size 11</li>
                    </ul>
                    <div className="mt-4">
                      <p className="font-semibold text-sm mb-3">Select One Topic:</p>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Emergencies (Kegawatdaruratan)</li>
                        <li>Pain Management (Manajemen Nyeri)</li>
                        <li>ICU Management (Manajemen ICU)</li>
                        <li>Anesthesia Management (Manajemen Anestesi)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Display & Selection */}
              {/* <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Display & Selection Process</h2>
                    <p className="text-sm text-muted-foreground">How your submission will be reviewed and displayed</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      num: 1,
                      text: "All approved e-Posters will be automatically displayed on LED screens as a slide show",
                    },
                    { num: 2, text: "10 selected posters will be presented in front of evaluation committee" },
                    { num: 3, text: "Presentation schedule and location will be announced later" },
                    { num: 4, text: "All accepted participants must pay conference registration fee" },
                    { num: 5, text: "Presentation details will be sent via email before April 2026" },
                  ].map((item) => (
                    <Card key={item.num} className="border-l-4 border-l-green-600 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <span className="text-green-600 font-bold flex-shrink-0">{item.num}.</span>
                          <span className="text-sm">{item.text}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div> */}

              <div>
                <h2 className="text-2xl font-bold mb-6">Display & Selection Process</h2>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>All approved e-Posters will be automatically displayed on LED screens as a slide show</li>
                  <li>10 selected posters will be presented in front of evaluation committee</li>
                  <li>Presentation schedule and location will be announced later</li>
                  <li>All accepted participants must pay conference registration fee</li>
                  <li>Presentation details will be sent via email before April 2026</li>
                </ol>
              </div>

              {/* Awards & Recognition */}
              {/* <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Awards & Recognition</h2>
                    <p className="text-sm text-muted-foreground">Recognition for outstanding submissions</p>
                  </div>
                </div>

                <Card className="border-l-4 border-l-amber-600">
                  <CardContent className="p-6">
                    <ul className="space-y-3">
                      {[
                        "10 best posters will be selected for presentation",
                        "3 best posters will be published in Journal of Anesthesia and Pain",
                        "Winners receive cash prize and certificate",
                        "Winners announced by April 2026",
                        "Case presentations: wear traditional attire from your region",
                      ].map((item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="text-amber-600 font-bold">{idx + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div> */}

              <div>
                <h2 className="text-2xl font-bold mb-6">Awards & Recognition</h2>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>10 best posters will be selected for presentation</li>
                  <li>3 best posters will be published in Journal of Anesthesia and Pain</li>
                  <li>Winners receive cash prize and certificate</li>
                  <li>Winners announced by April 2026</li>
                  <li>Case presentations: wear traditional attire from your region</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {/* <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 border-0 text-white overflow-hidden">
              <CardContent className="p-8 md:p-12 relative">
                {/* Background Pattern */}
        {/* <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" /> */}

        {/* <div className="relative z-10 max-w-2xl mx-auto text-center">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Share Your Research?</h3>
                  <p className="text-white/80 mb-6">
                    Submit your e-Poster before March 15, 2026. Selected presentations will be featured at the ISAPM
                    National Meeting, and the best submissions will be published in the Journal of Anesthesia and Pain.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/submit-poster">
                      <Button size="lg" className="bg-white text-cyan-600 hover:bg-white/90 font-semibold">
                        Submit Your E-Poster
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                    <Link href="/call-for-papers">
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 bg-transparent font-semibold"
                      >
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section> */}

        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-3">Ready to Submit Your Research?</h3>
              <p className="text-muted-foreground mb-6">Submit your e-Poster before March 15, 2026.</p>
              <Link href="/submit-poster">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Submit Your E-Poster
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        {/* <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Have Questions?</h3>
                <p className="text-muted-foreground mb-6">
                  For additional information or technical support regarding your submission, please get in touch with
                  us.
                </p>

                <div className="space-y-3">
                  <p className="font-semibold">Contact us via WhatsApp:</p>
                  <Link href="https://wa.me/6289602626709" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-center bg-transparent">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      +62 896-0262-6709
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section> */}

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <h3 className="text-2xl font-bold mb-4">Have Questions?</h3>
            <p className="text-muted-foreground mb-4">
              For additional information or technical support regarding your submission, please contact us via WhatsApp.
            </p>
            <Link href="https://wa.me/6289602626709" target="_blank" rel="noopener noreferrer">
              <Button variant="outline">Contact us: +62 896-0262-6709</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
