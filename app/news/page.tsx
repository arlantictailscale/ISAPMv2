import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, ArrowRight, Tag, Newspaper } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

export const metadata = {
  title: "News & Updates | ISAPM 2026",
  description: "Latest news, announcements, and updates about the ISAPM 8th National Meeting 2026",
}

interface NewsItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  image_url: string | null
  is_published: boolean
  is_featured: boolean
  published_at: string | null
  author_name: string | null
  category: string
  tags: string[] | null
  view_count: number
  created_at: string
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

export default async function NewsPage() {
  const supabase = await createClient()
  
  const { data: newsItems, error } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })

  if (error) {
    console.error("Error fetching news:", error)
  }

  const featuredNews = newsItems?.filter((item: NewsItem) => item.is_featured) || []
  const regularNews = newsItems?.filter((item: NewsItem) => !item.is_featured) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <Navigation />
      
      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-16 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-10"></div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Newspaper className="w-6 h-6" />
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                ISAPM 2026
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">News & Updates</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              Stay informed about the latest announcements, updates, and press releases 
              for the ISAPM 8th National Meeting 2026.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Featured News */}
          {featuredNews.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
                Featured News
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {featuredNews.map((news: NewsItem) => (
                  <Link key={news.id} href={`/news/${news.slug}`}>
                    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white h-full">
                      {news.image_url && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={news.image_url}
                            alt={news.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                          <Badge 
                            className={`absolute top-4 left-4 ${categoryColors[news.category] || categoryColors.announcement}`}
                          >
                            {categoryLabels[news.category] || "News"}
                          </Badge>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                          {news.title}
                        </h3>
                        {news.excerpt && (
                          <p className="text-slate-600 mb-4 line-clamp-2">{news.excerpt}</p>
                        )}
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <div className="flex items-center gap-4">
                            {news.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(news.published_at), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-teal-600 font-medium group-hover:gap-2 transition-all">
                            Read more <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All News */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
              {featuredNews.length > 0 ? "Latest News" : "All News"}
            </h2>
            
            {regularNews.length === 0 && featuredNews.length === 0 ? (
              <Card className="border-0 bg-white">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Newspaper className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No News Yet</h3>
                  <p className="text-slate-600">
                    Check back soon for the latest updates and announcements about ISAPM 2026.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {regularNews.map((news: NewsItem) => (
                  <Link key={news.id} href={`/news/${news.slug}`}>
                    <Card className="group overflow-hidden hover:shadow-md transition-all duration-300 border-0 bg-white">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {news.image_url && (
                            <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden hidden sm:block">
                              <Image
                                src={news.image_url}
                                alt={news.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="secondary"
                                className={`text-xs ${categoryColors[news.category] || categoryColors.announcement}`}
                              >
                                {categoryLabels[news.category] || "News"}
                              </Badge>
                              {news.published_at && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(news.published_at), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1 group-hover:text-teal-600 transition-colors line-clamp-1">
                              {news.title}
                            </h3>
                            {news.excerpt && (
                              <p className="text-sm text-slate-600 line-clamp-2">{news.excerpt}</p>
                            )}
                          </div>
                          <div className="flex items-center text-teal-600 group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
