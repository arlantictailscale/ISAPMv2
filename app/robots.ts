import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/my-profile/",
          "/my-posters/",
          "/my-purchases/",
          "/my-events/",
          "/my-orders/",
          "/my-registrations/",
          "/my-hotel-bookings/",
          "/payment/",
          "/checkout/",
          "/cart/",
          "/badge/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/my-*/", "/payment/", "/checkout/", "/cart/", "/badge/"],
      },
    ],
    sitemap: "https://www.isapm2026.org/sitemap.xml",
  }
}
