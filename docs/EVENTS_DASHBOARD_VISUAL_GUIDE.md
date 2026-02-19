# Admin Events Dashboard - Visual Guide

## Dashboard Layout Overview

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR (Logo, Title, User Menu, Dark Mode)                 │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                        │
│   SIDEBAR    │  EVENTS DASHBOARD                                    │
│   (Admin     │  "Comprehensive view of all symposium events..."     │
│   Menu)      │                                                        │
│              ├──────────────────────────────────────────────────────┤
│  • Events    │  SUMMARY STATISTICS (5 Cards)                        │
│    Dashboard │  ┌──────┬──────┬──────┬──────┬──────┐               │
│  • Payment   │  │Total │ CPD  │Work- │Symp. │Webinar              │
│    Validation│  │  10  │  1   │  6   │  2   │   1  │               │
│  • Carts     │  └──────┴──────┴──────┴──────┴──────┘               │
│  • Invoices  │                                                        │
│  • Users     │  FILTER & SEARCH (Control Card)                     │
│  • Attendees │  ┌──────────────────────────────────┐               │
│  • Webinar   │  │ 🔍 Search Events...              │ 🔀 Grid/List│
│    CMS       │  ├──────────────────────────────────┤               │
│  • Posters   │  │ Filter by Type: [All Events ▼]  │               │
│  • Symposium │  │ Sort by: [Name (A-Z) ▼]        │               │
│    Access    │  └──────────────────────────────────┘               │
│  • Rooms     │                                                        │
│  • Email     │  EVENT CARDS GRID (3 Columns - Desktop)             │
│              │                                                        │
│              │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│              │  │ 🎓 CPD      │ │ 🛠️ WS1      │ │ 🛠️ WS2      │  │
│              │  │ CPD Courses │ │ Regenerative│ │ Intervention│  │
│              │  │ [CPD BADGE] │ │ [WORKSHOP] │ │ [WORKSHOP] │  │
│              │  │             │ │             │ │             │  │
│              │  │ 📅 April... │ │ 📅 April... │ │ 📅 April... │  │
│              │  │             │ │             │ │             │  │
│              │  │ 1 Type | DB │ │ 1 Type | DB │ │ 1 Type | DB │  │
│              │  │             │ │             │ │             │  │
│              │  │ [Edit Event]│ │ [Edit Event]│ │ [Edit Event]│  │
│              │  └─────────────┘ └─────────────┘ └─────────────┘  │
│              │                                                        │
│              │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│              │  │ 🛠️ WS3      │ │ 👥 Symposium│ │ 🎥 Webinar  │  │
│              │  │ Pediatric   │ │ ISAPM 8th   │ │ Equity Pain │  │
│              │  │ [WORKSHOP] │ │ [SYMPOSIUM]│ │ [WEBINAR]  │  │
│              │  │             │ │             │ │             │  │
│              │  │ 📅 April... │ │ 📅 April... │ │ 📅 January..│  │
│              │  │             │ │             │ │             │  │
│              │  │ 4 Types | DB│ │ 0 Types | DB│ │ 1 Type | DB │  │
│              │  │             │ │             │ │             │  │
│              │  │ [Edit Event]│ │ [Edit Event]│ │ [Edit Event]│  │
│              │  └─────────────┘ └─────────────┘ └─────────────┘  │
│              │                                                        │
│              │  Showing 6 of 10 events                             │
│              │                                                        │
├──────────────┴──────────────────────────────────────────────────────┤
│  FOOTER                                                              │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

## List View Layout

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN EVENTS DASHBOARD                                              │
│  Comprehensive view of all symposium events and workshops            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  SUMMARY STATS (5 Cards in Row)                                     │
│  [10 Total] [1 CPD] [6 Workshops] [2 Symposium] [1 Webinar]       │
│                                                                       │
│  CONTROLS                               [📊 Grid] [📋 List Selected]│
│  [Search Events...] [Filter ▼] [Sort ▼]                            │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 🎓 CPD Courses          [CPD BADGE]   📅 April 16-17, 2026    │ │
│  │                                       👥 1 participant types   │ │
│  │                                       [Edit]                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 🛠️ WS1: Regenerative    [WORKSHOP]   📅 April 17, 2026        │ │
│  │                                       👥 1 participant types   │ │
│  │                                       [Edit]                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ 🛠️ WS2: Interventional  [WORKSHOP]   📅 April 17, 2026        │ │
│  │                                       👥 1 participant types   │ │
│  │                                       [Edit]                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Showing 3 of 10 events                                             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

## Color Coding System

### CPD Courses (Purple)
\`\`\`
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓ [CPD] │  Purple gradient header
│                      │  Light purple background
│ 🎓 CPD Courses       │  Color badge
│ CPD Courses          │  Short label
│                      │
│ 📅 April 16-17      │
│                      │
│ 1 Type | Static     │  Info cards with light bg
│                      │
│ [Edit Event]         │
└──────────────────────┘
Color: from-purple-600 to-purple-800
Badge: bg-purple-100 text-purple-800
\`\`\`

### Workshops (Blue)
\`\`\`
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓ [WORK] │  Blue gradient header
│                      │  Light blue background
│ 🛠️ WS1: Regenerative │  Color badge
│ Regenerative Therapy │  Short label
│                      │
│ 📅 April 17, 2026   │
│                      │
│ 1 Type | Static     │  Info cards with light bg
│                      │
│ [Edit Event]         │
└──────────────────────┘
Color: from-blue-600 to-blue-800
Badge: bg-blue-100 text-blue-800
\`\`\`

### Symposium (Orange)
\`\`\`
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓ [SYMP] │  Orange gradient header
│                      │  Light orange background
│ 👥 ISAPM 8th Meeting │  Color badge
│ Symposium            │  Short label
│                      │
│ 📅 April 18, 2026   │
│                      │
│ 0 Types | Static    │  Info cards with light bg
│                      │
│ [Edit Event]         │
└──────────────────────┘
Color: from-orange-600 to-orange-800
Badge: bg-orange-100 text-orange-800
\`\`\`

### Webinars (Green)
\`\`\`
┌──────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓ [WEB]  │  Green gradient header
│                      │  Light green background
│ 🎥 Equity in Pain   │  Color badge
│ Webinar Equity Pain │  Short label
│                      │
│ 📅 Jan 30, 2026     │
│                      │
│ 1 Type | Static     │  Info cards with light bg
│                      │
│ [Edit Event]         │
└──────────────────────┘
Color: from-green-600 to-green-800
Badge: bg-green-100 text-green-800
\`\`\`

## Filtering Logic

\`\`\`
                   ┌─────────────────────┐
                   │   ALL EVENTS (10)   │
                   └──────────┬──────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
         ┌──────────┐   ┌──────────┐   ┌──────────┐
         │  CPD     │   │WORKSHOP  │   │SYMPOSIUM │
         │  (1)     │   │  (6)     │   │  (2)     │
         └──────────┘   └──────────┘   └──────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌──────────────┐        ┌──────────────┐
            │ Sorted A-Z   │        │Sorted by Type│
            │ WS1          │        │ WS1 (Blue)   │
            │ WS2          │        │ WS2 (Blue)   │
            │ WS3          │        │ WS3 (Blue)   │
            │ WS4          │        │ WS5 (Blue)   │
            │ WS5          │        │ WS6 (Blue)   │
            │ WS6          │        │ WS7 (Blue)   │
            └──────────────┘        └──────────────┘
\`\`\`

## User Interaction Flow

\`\`\`
START
  │
  ├─ Not logged in? ────────────► REDIRECT TO LOGIN
  │
  ├─ Logged in, not admin? ─────► REDIRECT TO HOME
  │
  └─ Logged in, admin role? ─────► LOAD DASHBOARD
                                     │
                                     ├─ Load Static Events
                                     ├─ Load Summary Stats
                                     └─ Subscribe to Real-time
                                         │
                                         ▼
                                    [DISPLAY DASHBOARD]
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
              [SEARCH]          [FILTER]              [SORT]
                    │                    │                    │
                    ├────────────────────┼────────────────────┤
                    │                                        │
                    └───────────────────────┬────────────────┘
                                            │
                                            ▼
                                    [RENDER FILTERED]
                                    [EVENT CARDS]
                                            │
                        ┌───────────────────┴───────────────────┐
                        │                                       │
                        ▼                                       ▼
                  [GRID VIEW]                           [LIST VIEW]
                  (Cards 3x Grid)                      (Compact List)
                        │                                       │
                        └───────────────────┬───────────────────┘
                                            │
                                            ▼
                                    [CLICK EDIT]
                                            │
                                            ▼
                                [NAVIGATE TO EVENT CMS]
                                [?edit=EVENT_ID]
\`\`\`

## Responsive Breakpoints

### Mobile (< 768px)
\`\`\`
┌──────────────────┐
│   TOP NAV        │
├──────────────────┤
│ [≡] Admin Menu   │
├──────────────────┤
│                  │
│ Events Dashboard │
│ Summary...       │
│                  │
│ STATS (Vertical) │
│ [10]             │
│ [1]              │
│ [6]              │
│ [2]              │
│ [1]              │
│                  │
│ CONTROLS         │
│ [Search]         │
│ [Filter]         │
│ [Sort]           │
│                  │
│ EVENTS (1 Col)   │
│ ┌──────────────┐ │
│ │ Event 1      │ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Event 2      │ │
│ └──────────────┘ │
│                  │
│ FOOTER           │
└──────────────────┘
\`\`\`

### Tablet (768px - 1024px)
\`\`\`
┌────────────────────────────────────┐
│        TOP NAV                     │
├────────────┬───────────────────────┤
│ Admin Menu │ Events Dashboard      │
│            │ Summary...            │
│ • Events   │                       │
│ • Payments │ STATS (2 rows x 3)   │
│ • Carts    │ [10] [1] [6]         │
│            │ [2]  [1]             │
│            │                       │
│            │ CONTROLS              │
│            │ [Search] [Filter]    │
│            │ [Sort]               │
│            │                       │
│            │ EVENTS (2 Columns)    │
│            │ ┌────┐ ┌────┐       │
│            │ │ E1 │ │ E2 │       │
│            │ └────┘ └────┘       │
│            │ ┌────┐ ┌────┐       │
│            │ │ E3 │ │ E4 │       │
│            │ └────┘ └────┘       │
│            │                       │
├────────────┴───────────────────────┤
│        FOOTER                      │
└────────────────────────────────────┘
\`\`\`

### Desktop (> 1024px)
\`\`\`
┌──────────────────────────────────────────────────┐
│            TOP NAV                               │
├─────────────┬──────────────────────────────────┤
│ Admin Menu  │ Events Dashboard                 │
│             │ Summary...                       │
│ • Events    │                                  │
│   Dashboard │ STATS (Single Row: 5 Cards)     │
│ • Payments  │ [10] [1] [6] [2] [1]           │
│ • Carts     │                                  │
│ • Invoices  │ CONTROLS                         │
│ • Users     │ [Search]   [Filter ▼] [Sort ▼] │
│             │                                  │
│             │ EVENTS (3 Columns Grid)          │
│             │ ┌─────┐ ┌─────┐ ┌─────┐        │
│             │ │ E1  │ │ E2  │ │ E3  │        │
│             │ └─────┘ └─────┘ └─────┘        │
│             │ ┌─────┐ ┌─────┐ ┌─────┐        │
│             │ │ E4  │ │ E5  │ │ E6  │        │
│             │ └─────┘ └─────┘ └─────┘        │
│             │                                  │
├─────────────┴──────────────────────────────────┤
│             FOOTER                             │
└──────────────────────────────────────────────────┘
\`\`\`

## Event Card Anatomy

\`\`\`
┌─ Gradient Bar ─────────────────────────────────┐
│ ████████████████████████████████████████████████│
├────────────────────────────────────────────────┤
│ 📚 Event Title                    [BADGE]      │ ← Header Section
│ Short description or label                      │
├────────────────────────────────────────────────┤
│ 📅 April 17, 2026                              │ ← Content Section
│                                                │
│ ┌─────────────────┬──────────────────┐        │
│ │ 1 Type          │ Static           │        │
│ │ Participant     │ Source           │        │
│ │ Types           │                  │        │
│ └─────────────────┴──────────────────┘        │
│                                                │
│              [Edit Event]                      │ ← Action Section
└────────────────────────────────────────────────┘
\`\`\`

## Summary Statistics Card

\`\`\`
┌──────────────────────┐
│  Event Type Count    │
│                      │
│  ┌────────────────┐  │
│  │      10        │  │ Large, bold number
│  └────────────────┘  │
│                      │
│  Total Events        │ Small label below
│                      │
└──────────────────────┘
\`\`\`

---

This visual guide helps administrators understand the dashboard layout and navigation at a glance.
