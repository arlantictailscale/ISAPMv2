-- Event CMS Database Migration
-- Creates tables for managing events, resources, speakers, and history

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  event_type TEXT NOT NULL CHECK (event_type IN ('webinar', 'workshop', 'symposium', 'cpd', 'meeting', 'other')),
  title TEXT NOT NULL,
  short_title TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  
  -- Date & Time
  start_date DATE,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  timezone TEXT DEFAULT 'Asia/Jakarta',
  
  -- Location
  location TEXT,
  venue TEXT,
  address TEXT,
  is_online BOOLEAN DEFAULT false,
  online_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'coming_soon', 'sold_out', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Images
  thumbnail_url TEXT,
  hero_image_url TEXT,
  
  -- Pricing (JSON structure for flexibility)
  -- Structure: { "participant_types": [{ "type": "specialist", "label": "Specialist", "early": 1000000, "normal": 1500000, "onsite": 2000000 }] }
  pricing JSONB DEFAULT '{"participant_types": []}'::jsonb,
  
  -- Settings (JSON for additional config)
  -- Structure: { "max_participants": 100, "benefits": ["Certificate", "Lunch"], "tags": ["pain", "management"], "skp_points": 5 }
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

-- ============================================
-- EVENT RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  
  -- Resource Info
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'image', 'link', 'video', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- File/URL
  url TEXT NOT NULL,
  file_type TEXT, -- pdf, docx, png, mp4, etc.
  file_size BIGINT, -- in bytes
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false, -- visible to all vs purchasers only
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_resources_event_id ON event_resources(event_id);
CREATE INDEX IF NOT EXISTS idx_event_resources_type ON event_resources(resource_type);

-- ============================================
-- EVENT SPEAKERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  
  -- Speaker Info
  name TEXT NOT NULL,
  title TEXT, -- Dr., Prof., etc.
  credentials TEXT, -- MD, PhD, SpAn, etc.
  role TEXT, -- Keynote Speaker, Moderator, Panelist
  organization TEXT,
  bio TEXT,
  photo_url TEXT,
  
  -- Display
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_speakers_event_id ON event_speakers(event_id);

-- ============================================
-- EVENT HISTORY TABLE (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS event_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  
  -- Change Info
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored', 'status_changed')),
  changes JSONB NOT NULL DEFAULT '{}', -- { "field": { "old": "value", "new": "value" } }
  
  -- Actor
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_event_history_event_id ON event_history(event_id);
CREATE INDEX IF NOT EXISTS idx_event_history_changed_at ON event_history(changed_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_history ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Admins can manage events" ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view active events" ON events
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND status IN ('active', 'coming_soon', 'sold_out'));

-- Event resources policies
CREATE POLICY "Admins can manage event resources" ON event_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view public resources" ON event_resources
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND is_public = true);

-- Event speakers policies
CREATE POLICY "Admins can manage event speakers" ON event_speakers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view active speakers" ON event_speakers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Event history policies (admin only)
CREATE POLICY "Admins can view event history" ON event_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert event history" ON event_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_event_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_updated_at();

DROP TRIGGER IF EXISTS update_event_resources_updated_at ON event_resources;
CREATE TRIGGER update_event_resources_updated_at
  BEFORE UPDATE ON event_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_event_updated_at();

DROP TRIGGER IF EXISTS update_event_speakers_updated_at ON event_speakers;
CREATE TRIGGER update_event_speakers_updated_at
  BEFORE UPDATE ON event_speakers
  FOR EACH ROW
  EXECUTE FUNCTION update_event_updated_at();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_event_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;
