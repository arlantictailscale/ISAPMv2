import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { Calendar, ArrowLeft, User, Tag, Share2, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { notFound } from "next/navigation"
import { Metadata } from "next"

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: news } = await supabase
    .from("news")
    .select("title, excerpt, image_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (!news) {
    return {
      title: "News Not Found | ISAPM 2026",
    }
  }

  return {
    title: `${news.title} | ISAPM 2026`,
    description: news.excerpt || `Read about ${news.title} at ISAPM 2026`,
    openGraph: {
      title: news.title,
      description: news.excerpt || undefined,
      images: news.image_url ? [news.image_url] : undefined,
    },
  }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Fetch the news article
  const { data: news, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error || !news) {
    notFound()
  }

  // Increment view count (fire and forget)
  supabase
    .from("news")
    .update({ view_count: (news.view_count || 0) + 1 })
    .eq("id", news.id)
    .then(() => {})

  // Fetch related news
  const { data: relatedNews } = await supabase
    .from("news")
    .select("id, title, slug, image_url, published_at, category")
    .eq("is_published", true)
    .neq("id", news.id)
    .eq("category", news.category)
    .order("published_at", { ascending: false })
    .limit(3)

  // Calculate reading time (rough estimate)
  const wordCount = news.content?.split(/\s+/).length || 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <Navigation />
      
      <main className="pt-20 pb-16">
        {/* Back Link */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/news" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>
        </div>

        {/* Article Header */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={categoryColors[news.category] || categoryColors.announcement}>
                {categoryLabels[news.category] || "News"}
              </Badge>
              {news.published_at && (
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(news.published_at), "MMMM d, yyyy")}
                </span>
              )}
              <span className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} min read
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">
              {news.title}
            </h1>
            
            {news.excerpt && (
              <p className="text-xl text-slate-600 leading-relaxed">
                {news.excerpt}
              </p>
            )}
            
            {news.author_name && (
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{news.author_name}</p>
                  <p className="text-sm text-slate-500">Author</p>
                </div>
              </div>
            )}
          </header>

          {/* Featured Image */}
          {news.image_url && (
            <div className="relative aspect-video rounded-xl overflow-hidden mb-8 shadow-lg">
              <Image
                src={news.image_url}
                alt={news.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-lg prose-slate max-w-none mb-8
              prose-headings:font-bold prose-headings:text-slate-800
              prose-p:text-slate-600 prose-p:leading-relaxed
              prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-800
              prose-ul:text-slate-600 prose-ol:text-slate-600
              prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: news.content.replace(/\n/g, '<br />') }}
          />

          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-8 pb-8 border-b border-slate-200">
              <Tag className="w-4 h-4 text-slate-400" />
              {news.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Share Section */}
          <div className="flex items-center justify-between py-6 border-y border-slate-200 mb-12">
            <span className="text-slate-600 font-medium">Share this article</span>
            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(news.title)}&url=${encodeURIComponent(`https://isapm2026.org/news/${news.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-700"
              >
                <Share2 className="w-4 h-4" />
                Share
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${news.title} - https://isapm2026.org/news/${news.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-md hover:bg-slate-50 transition-colors text-slate-700"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </article>

        {/* Related News */}
        {relatedNews && relatedNews.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
              Related News
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedNews.map((item: any) => (
                <Link key={item.id} href={`/news/${item.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-md transition-all duration-300 border-0 bg-white h-full">
                    {item.image_url && (
                      <div className="relative h-32 overflow-hidden">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      {item.published_at && (
                        <span className="text-xs text-slate-500">
                          {format(new Date(item.published_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
