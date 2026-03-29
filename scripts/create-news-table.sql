-- Create news table for event announcements and updates
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    category TEXT DEFAULT 'announcement',
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_scheduled ON news(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Enable RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Public can view published news
CREATE POLICY "Public can view published news" ON news
    FOR SELECT
    USING (is_published = true AND (published_at IS NULL OR published_at <= NOW()));

-- Admins can manage all news
CREATE POLICY "Admins can manage news" ON news
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add comment for documentation
COMMENT ON TABLE news IS 'Stores news articles and announcements for the ISAPM event';
