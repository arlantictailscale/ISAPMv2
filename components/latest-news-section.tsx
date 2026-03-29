import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Calendar, ArrowRight, Newspaper } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface NewsItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image_url: string | null
  published_at: string | null
  category: string
}

const categoryColors: Record<string, string> = {
  announcement: "bg-teal-100 text-teal-700 border-teal-200",
  update: "bg-blue-100 text-blue-700 border-blue-200",
  press: "bg-purple-100 text-purple-700 border-purple-200",
  event: "bg-amber-100 text-amber-700 border-amber-200",
  registration: "bg-green-100 text-green-700 border-green-200",
}

const categoryLabels: Record<string, string> = {
  announcement: "Announcement",
  update: "Update",
  press: "Press Release",
  event: "Event",
  registration: "Registration",
}

export default async function LatestNewsSection() {
  const supabase = await createClient()

  const { data: newsItems } = await supabase
    .from("news")
    .select("id, title, slug, excerpt, image_url, published_at, category")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(3)

  if (!newsItems || newsItems.length === 0) return null

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-teal-500 rounded-full" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-0.5">Stay Informed</p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Latest News</h2>
            </div>
          </div>
          <Link
            href="/news"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors group"
          >
            View all news
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {newsItems.map((news, index) => (
            <Link
              key={news.id}
              href={`/news/${news.slug}`}
              className={`group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-teal-200 transition-all duration-300 flex flex-col ${
                index === 0 ? "md:col-span-1" : ""
              }`}
            >
              {/* Image */}
              {news.image_url ? (
                <div className="h-44 overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={news.image_url}
                    alt={news.title}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center flex-shrink-0">
                  <Newspaper className="w-10 h-10 text-teal-300" />
                </div>
              )}

              {/* Content */}
              <div className="p-4 flex flex-col flex-1 gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0.5 ${categoryColors[news.category] || categoryColors.announcement}`}
                  >
                    {categoryLabels[news.category] || "News"}
                  </Badge>
                  {news.published_at && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(news.published_at), "MMM d, yyyy")}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-slate-800 leading-snug text-sm md:text-base group-hover:text-teal-700 transition-colors line-clamp-2">
                  {news.title}
                </h3>

                {news.excerpt && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
                    {news.excerpt}
                  </p>
                )}

                <span className="mt-auto text-xs font-medium text-teal-600 group-hover:text-teal-700 flex items-center gap-1">
                  Read more
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view all link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            View all news
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
