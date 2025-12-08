import { NextResponse } from "next/server"

export const dynamic = "force-static"
export const revalidate = 86400 // Revalidate daily

export async function GET() {
  const baseUrl = "https://www.isapm2026.org"

  const pages = [
    { url: "", priority: "1.0", changefreq: "weekly" },
    { url: "/events", priority: "0.9", changefreq: "weekly" },
    { url: "/pricing", priority: "0.9", changefreq: "weekly" },
    { url: "/call-for-papers", priority: "0.8", changefreq: "monthly" },
    { url: "/program", priority: "0.8", changefreq: "monthly" },
    { url: "/workshop", priority: "0.8", changefreq: "monthly" },
    { url: "/symposium", priority: "0.8", changefreq: "monthly" },
    { url: "/venue", priority: "0.8", changefreq: "monthly" },
    { url: "/hotel-booking", priority: "0.7", changefreq: "monthly" },
    { url: "/submit-poster", priority: "0.7", changefreq: "monthly" },
    { url: "/contact", priority: "0.5", changefreq: "yearly" },
    { url: "/auth/login", priority: "0.4", changefreq: "yearly" },
    { url: "/auth/sign-up", priority: "0.4", changefreq: "yearly" },
    { url: "/privacy-policy", priority: "0.2", changefreq: "yearly" },
    { url: "/terms-of-service", priority: "0.2", changefreq: "yearly" },
  ]

  const today = new Date().toISOString().split("T")[0]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
