import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dashboard/", "/my-profile/", "/my-posters/", "/payment/"],
    },
    sitemap: "https://www.isapm2026.org/sitemap.xml",
  }
}
