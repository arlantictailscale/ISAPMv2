import type { MetadataRoute } from "next"

export const dynamic = "force-static"
export const revalidate = 86400 // Revalidate daily

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.isapm2026.org"
  const today = new Date().toISOString().split("T")[0]

  return [
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/webinar`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/call-for-papers`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/program`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/workshop`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/venue`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/hotel-booking`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/submit-poster`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/auth/sign-up`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ]
}
