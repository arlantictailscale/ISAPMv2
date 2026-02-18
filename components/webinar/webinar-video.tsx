"use client"

import { Play } from "lucide-react"

interface WebinarVideoProps {
  youtubeUrl?: string
  title: string
}

export function WebinarVideo({ youtubeUrl, title }: WebinarVideoProps) {
  if (!youtubeUrl) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Play className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Webinar Recording</h2>
            <p className="text-sm text-muted-foreground">Watch the recorded session</p>
          </div>
        </div>

        {/* Video Container with Proper Responsive Aspect Ratio */}
        <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
          {/* 16:9 Aspect Ratio Wrapper */}
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={youtubeUrl}
              title={`${title} - Webinar Recording`}
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer autoplay clipboard-write encrypted-media gyroscope picture-in-picture web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
              data-testid="webinar-video-iframe"
            />
          </div>
        </div>

        {/* Video Info */}
        <div className="mt-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-2">Access the Recording</h3>
          <p className="text-muted-foreground mb-4">
            Watch the complete webinar recording at your own pace. This video remains accessible for 30 days from the
            original broadcast date.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Full session with all speakers and Q&A</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>High-quality video and crystal-clear audio</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Subtitle support available</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Download transcripts from course materials</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
