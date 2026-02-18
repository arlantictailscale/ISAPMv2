# YouTube Embedding - Architecture & Flow Diagrams

## Overall Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Request                              │
│            User navigates to /webinar/[slug]                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js Route Handler                              │
│      app/webinar/[slug]/page.tsx                               │
│                                                                 │
│  1. Fetches webinar data by slug                              │
│  2. Checks if youtubeUrl property exists                       │
│  3. Applies security headers from next.config.mjs              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           Webinar Data (/lib/data/webinars.ts)                 │
│                                                                 │
│  Webinar {                                                      │
│    id: "webinar_equity_pain"                                   │
│    slug: "equity-pain-management"                              │
│    youtubeUrl: "https://www.youtube.com/embed/..."             │
│    title: "Achieving Equity in Pain Management"                │
│    ...                                                          │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         Render JSX Components                                   │
│   <WebinarDetailHero />                                         │
│   <WebinarDetailSpeakers />                                     │
│   <WebinarVideo /> ← YouTube video embedding happens here      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│        WebinarVideo Component                                   │
│   (/components/webinar/webinar-video.tsx)                      │
│                                                                 │
│  Props:                                                         │
│  - youtubeUrl: "https://www.youtube.com/embed/..."            │
│  - title: "Webinar Title"                                      │
│                                                                 │
│  Returns:                                                       │
│  - <section> with responsive <iframe> container               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│      Security Headers Applied                                   │
│     (next.config.mjs headers())                                │
│                                                                 │
│  X-Frame-Options: ALLOWALL (for /webinar/* routes)           │
│  Content-Security-Policy: frame-src 'self'                     │
│                           https://www.youtube.com ...          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│        Browser Renders iframe                                   │
│                                                                 │
│  <div class="relative w-full" style="paddingBottom: 56.25%">  │
│    <iframe                                                      │
│      src="https://www.youtube.com/embed/..."                  │
│      allow="accelerometer autoplay clipboard-write ..."       │
│      allowFullScreen                                           │
│      loading="lazy"                                            │
│    />                                                          │
│  </div>                                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│       YouTube Player Loads                                      │
│   (Requests approved by security headers)                      │
│                                                                 │
│  1. iframe src approved ✓                                      │
│  2. YouTube scripts allowed ✓                                  │
│  3. Permissions granted ✓                                      │
│  4. Player renders ✓                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│      User Interaction                                           │
│                                                                 │
│  ✓ Click play button                                           │
│  ✓ Video plays inline                                          │
│  ✓ Click fullscreen                                            │
│  ✓ Adjust volume                                               │
│  ✓ Share video                                                 │
│  ✓ Responsive on mobile                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
WebinarDetailPage (/app/webinar/[slug]/page.tsx)
│
├── <Navigation />
│
├── <main> (pt-16)
│   │
│   ├── <WebinarDetailHero />
│   │   └── Hero section with title, date, speakers overview
│   │
│   ├── <WebinarDetailSpeakers />
│   │   └── Detailed speaker profiles and topics
│   │
│   └── <WebinarVideo /> ← NEW: YouTube video embedding
│       │
│       └── <section className="py-16 bg-gradient...">
│           │
│           ├── <div className="container">
│           │   │
│           │   ├── Section header with icon
│           │   │
│           │   ├── Video container (responsive 16:9)
│           │   │   │
│           │   │   └── <div style="paddingBottom: 56.25%">
│           │   │       └── <iframe src="youtube.com/embed/...">
│           │   │
│           │   └── Video info box with benefits
│           │
│           └── </div>
│
└── <Footer />
```

---

## Security Headers Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Client Request: GET /webinar/equity-pain-management        │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Server Processes next.config.mjs headers()                 │
│                                                              │
│  Match routes:                                              │
│  1. source: "/:path*" → Apply global headers               │
│  2. source: "/webinar/:path*" → Apply webinar-specific    │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Global Headers Applied to All Routes                       │
│                                                              │
│  X-DNS-Prefetch-Control: on                                 │
│  X-Content-Type-Options: nosniff                            │
│  Referrer-Policy: strict-origin-when-cross-origin          │
│  Permissions-Policy: camera=(), microphone=(), ...         │
│  Content-Security-Policy: (see below)                      │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Webinar Route-Specific Headers                             │
│                                                              │
│  X-Frame-Options: ALLOWALL                                  │
│  (Overrides/supplements global headers)                    │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Content-Security-Policy Analysis                           │
│                                                              │
│  frame-ancestors 'self' https:                              │
│  ├── Only embed in same-origin or HTTPS contexts           │
│  └── Prevents clickjacking attacks                         │
│                                                              │
│  frame-src 'self' https://www.youtube.com ... https://youtu.be │
│  ├── Allow iframes from these domains                      │
│  ├── YouTube.com approved ✓                                │
│  ├── YouTube-nocookie.com approved ✓                       │
│  └── Youtu.be approved ✓                                   │
│                                                              │
│  script-src 'self' 'unsafe-inline' 'unsafe-eval'           │
│            https://www.youtube.com https://s.ytimg.com    │
│  ├── Allow YouTube's JavaScript to execute ✓              │
│  ├── Allow inline scripts for player initialization        │
│  └── Allow YouTube image CDN requests                      │
│                                                              │
│  connect-src 'self' https:                                  │
│  ├── Allow connections to HTTPS endpoints ✓               │
│  └── Allows API calls and asset loading                    │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Response Headers Sent to Browser                           │
│                                                              │
│  HTTP/1.1 200 OK                                            │
│  Content-Type: text/html; charset=UTF-8                    │
│  X-Frame-Options: ALLOWALL                                  │
│  Content-Security-Policy: [policy string above]            │
│  ... other headers ...                                      │
│                                                              │
│  [HTML body follows]                                        │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Browser Evaluates Headers                                  │
│                                                              │
│  1. X-Frame-Options: ALLOWALL?                              │
│     Yes → Allow framing by external sites ✓               │
│                                                              │
│  2. CSP frame-src includes youtube.com?                     │
│     Yes → Allow iframe from youtube.com ✓                 │
│                                                              │
│  3. CSP script-src includes https://www.youtube.com?       │
│     Yes → Allow YouTube scripts ✓                          │
│                                                              │
│  Result: All security checks PASS ✓✓✓                     │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Render HTML and Request YouTube iframe                     │
│                                                              │
│  1. Parse HTML                                              │
│  2. Find <iframe src="https://www.youtube.com/embed/...">  │
│  3. Security checks: ALL PASSED ✓                          │
│  4. Load iframe content                                     │
│  5. Initialize YouTube player                              │
│  6. Display to user                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Component State & Props

```
WebinarVideo Component
│
├── Props:
│   ├── youtubeUrl: string | undefined
│   │   └── Example: "https://www.youtube.com/embed/HPCteK3E6Fk?si=..."
│   │
│   └── title: string
│       └── Example: "Achieving Equity in Pain Management Services..."
│
├── State:
│   └── None (pure functional component)
│
├── Conditional Rendering:
│   ├── if (!youtubeUrl) → return null
│   │   └── No video section rendered
│   │
│   └── else → render full video section
│       ├── Section header with icon
│       ├── Responsive iframe container
│       └── Information box
│
└── Return Structure:
    <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4">
        
        ┌─ Video Section Header
        ├─ Responsive Video Container (16:9 aspect ratio)
        │  └─ <iframe> element
        │
        └─ Video Information Box
    </section>
```

---

## Responsive Design Aspect Ratio

```
Container Width Changes → Aspect Ratio Maintained
═════════════════════════════════════════════════════════════

Mobile (375px width)
┌─────────────────────────────┐
│                             │ 211px height
│      Video Player          │ (375 × 0.5625)
│                             │
│  Maintains 16:9 ratio      │
├─────────────────────────────┤
│   Video Info                │
└─────────────────────────────┘
     375px

Tablet (768px width)
┌──────────────────────────────────────────┐
│                                          │ 432px height
│          Video Player                   │ (768 × 0.5625)
│                                          │
│     Maintains 16:9 ratio                │
├──────────────────────────────────────────┤
│         Video Info                       │
└──────────────────────────────────────────┘
         768px

Desktop (1200px width)
┌───────────────────────────────────────────────────────────┐
│                                                           │ 675px height
│                  Video Player                            │ (1200 × 0.5625)
│                                                           │
│           Maintains 16:9 ratio                           │
├───────────────────────────────────────────────────────────┤
│                  Video Info                              │
└───────────────────────────────────────────────────────────┘
            1200px


Aspect Ratio Calculation
═════════════════════════

16:9 Ratio
└─ 9 ÷ 16 = 0.5625
   └─ As percentage = 56.25%
      └─ paddingBottom: "56.25%"

CSS Technique
└─ Parent: position: relative
   └─ Padding div: paddingBottom: 56.25%
      └─ Creates fixed 16:9 ratio regardless of width
         └─ iframe: position: absolute; top: 0; left: 0; width: 100%; height: 100%
            └─ Fills entire padding container
```

---

## iframe Allow Permissions Dependency Graph

```
YouTube Player Features
│
├── Basic Playback
│   ├── autoplay ─────────────────────┐
│   └── web-share ───────────────────┐│
│       (can share with apps)        ││
│                                    ││
├── Device Features                  ││
│   ├── accelerometer ────────────────┤│
│   │   (portrait/landscape)          ││
│   ├── gyroscope ──────────────────┐ ││
│   │   (VR video support)          │ ││
│   └── encrypted-media ────────────┤ ││
│       (DRM content/premium)       │ ││
│                                   │ ││
├── User Interactions                │ ││
│   ├── picture-in-picture ──────────┤ ││
│   │   (floating window)            │ ││
│   └── clipboard-write ─────────────┤ ││
│       (copy/share URLs)            │ ││
│                                    │ ││
└── Result: Full YouTube Feature Set │ ││
                                     └─┘│
                                       └─ "allow" attribute value

All combined into single allow attribute:
"accelerometer autoplay clipboard-write encrypted-media 
 gyroscope picture-in-picture web-share"
```

---

## Iframe HTML Structure with CSS

```
┌─ Wrapper (position: relative)
│
└─ Padding Container (paddingBottom: 56.25%)
   │
   │  When browser calculates layout:
   │  1. Container width = 100% of parent
   │  2. paddingBottom = 56.25% of width
   │  3. Height = automatically calculated from padding
   │  4. iframe stretches to fill
   │
   └─ iframe (position: absolute; top: 0; left: 0; width: 100%; height: 100%)
      │
      ├─ Positioned at top-left corner
      ├─ Stretches to 100% width
      ├─ Stretches to 100% height (determined by padding)
      ├─ Always maintains 16:9 ratio
      └─ Responsive at any viewport size
```

---

## Error Handling Flow

```
User visits /webinar/equity-pain-management
│
├─ Webinar data loaded with youtubeUrl
│  │
│  ├─ youtubeUrl is null/undefined
│  │  └─ WebinarVideo returns null
│  │     └─ No video section rendered
│  │
│  └─ youtubeUrl exists
│     │
│     ├─ Browser loads iframe
│     │  │
│     │  ├─ CSP allows youtube.com?
│     │  │  ├─ YES → iframe loads ✓
│     │  │  └─ NO → iframe blocked ✗
│     │  │        └─ CSP error in console
│     │  │
│     │  ├─ Video ID valid?
│     │  │  ├─ YES → video plays ✓
│     │  │  └─ NO → YouTube 404 page shown
│     │  │
│     │  └─ User blocked in region?
│     │     ├─ YES → YouTube restriction message shown
│     │     └─ NO → video plays ✓
│     │
│     └─ User interacts with player
│        ├─ Play button works ✓
│        ├─ Fullscreen works (if allowed in CSP) ✓
│        ├─ Share works ✓
│        └─ Comments show (if YouTube enabled) ✓
```

---

## File Dependency Diagram

```
/app/webinar/[slug]/page.tsx
│
├── imports ─→ @/lib/data/webinars
│              └─ Returns webinar object
│                 └─ webinar.youtubeUrl
│
├── imports ─→ @/components/webinar/webinar-detail-hero
│
├── imports ─→ @/components/webinar/webinar-detail-speakers
│
├── imports ─→ @/components/webinar/webinar-video ◄─ NEW
│              ├─ Receives youtubeUrl prop
│              └─ Receives title prop
│
└── inherits ─→ /next.config.mjs
               ├─ Security headers for response
               └─ CSP for iframe allowance


/next.config.mjs
├─ Global headers section
│  └─ Applies to all routes
│
└─ Route-specific headers
   ├─ /webinar/:path* → X-Frame-Options: ALLOWALL
   └─ Other routes use defaults
```

---

## Browser Rendering Timeline

```
Time ──────────────────────────────────────────────────────►

0ms   │ Browser requests page
      │
      ▼
      │ Server processes headers (security)
      │
      ▼
      │ HTML downloaded
      │
      ▼
      │ HTML parsed
      │
      ▼
      │ Components render:
      │  - WebinarDetailHero (images load)
      │  - WebinarDetailSpeakers (speaker images load)
      │  - WebinarVideo (JSX renders)
      │
      ▼
      │ iframe element created (loading="lazy" so deferred)
      │
      ▼
      │ Page interactive (user can scroll, click buttons)
      │
      ▼
      │ User scrolls to Video section
      │
      ▼
      │ iframe comes into viewport
      │
      ▼
      │ Browser loads iframe source (youtube.com)
      │
      ▼
      │ Security headers checked:
      │  ✓ X-Frame-Options: ALLOWALL
      │  ✓ CSP frame-src: youtube.com allowed
      │
      ▼
      │ YouTube player script loads
      │
      ▼
      │ Video player initializes
      │
      ▼
      │ Controls appear (play, fullscreen, share, etc.)
      │
      ▼
      │ User can interact with video
      │

Benefits:
- Early page render: doesn't wait for video
- Performance: lazy loading defers iframe request
- Smoothness: rest of page loads while waiting for video
```

This architecture ensures YouTube videos embed correctly while maintaining security, performance, and responsiveness across all devices.
