import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ISAPM 2026 - 8th National Meeting",
    short_name: "ISAPM 2026",
    description:
      "Indonesian Society of Anesthesiology and Pain Management 8th National Meeting. Register for events, webinars, workshops, and symposiums.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#14b8a6",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1080x1920",
        type: "image/png",
        // @ts-ignore - form_factor is valid but not in types
        form_factor: "narrow",
        label: "ISAPM 2026 Home Screen",
      },
      {
        src: "/screenshots/events.png",
        sizes: "1080x1920",
        type: "image/png",
        // @ts-ignore
        form_factor: "narrow",
        label: "Events & Registration",
      },
    ],
    categories: ["medical", "education", "health"],
    shortcuts: [
      {
        name: "Events",
        short_name: "Events",
        description: "Browse and register for events",
        url: "/events",
        icons: [{ src: "/icons/events-shortcut.png", sizes: "96x96" }],
      },
      {
        name: "My Purchases",
        short_name: "Purchases",
        description: "View your purchase history",
        url: "/my-purchases",
        icons: [{ src: "/icons/purchases-shortcut.png", sizes: "96x96" }],
      },
      {
        name: "Webinars",
        short_name: "Webinars",
        description: "Access webinar series",
        url: "/webinar",
        icons: [{ src: "/icons/webinar-shortcut.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
