-- Webinar Content Management System
-- Manages links, materials, recordings, and resources for webinars

-- Create webinar_content table
CREATE TABLE IF NOT EXISTS public.webinar_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('link', 'material', 'recording', 'resource')),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  file_type TEXT, -- pdf, pptx, mp4, zip, doc, link, youtube, zoom, etc.
  file_size BIGINT, -- bytes, nullable for links
  sort_order INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false, -- visible to all vs. purchasers only
  is_active BOOLEAN DEFAULT true, -- soft delete
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webinar_content_history table for audit trail
CREATE TABLE IF NOT EXISTS public.webinar_content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.webinar_content(id) ON DELETE SET NULL,
  webinar_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored')),
  field_changed TEXT, -- which field was changed (null for create/delete)
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT -- optional note explaining the change
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webinar_content_webinar_id ON public.webinar_content(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_content_type ON public.webinar_content(content_type);
CREATE INDEX IF NOT EXISTS idx_webinar_content_active ON public.webinar_content(is_active);
CREATE INDEX IF NOT EXISTS idx_webinar_content_history_content_id ON public.webinar_content_history(content_id);
CREATE INDEX IF NOT EXISTS idx_webinar_content_history_webinar_id ON public.webinar_content_history(webinar_id);

-- Enable RLS
ALTER TABLE public.webinar_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_content_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage all webinar content" ON public.webinar_content;
DROP POLICY IF EXISTS "Users can view active public content" ON public.webinar_content;
DROP POLICY IF EXISTS "Users can view content for purchased webinars" ON public.webinar_content;
DROP POLICY IF EXISTS "Admins can view all history" ON public.webinar_content_history;
DROP POLICY IF EXISTS "Service role full access content" ON public.webinar_content;
DROP POLICY IF EXISTS "Service role full access history" ON public.webinar_content_history;

-- RLS Policies for webinar_content
-- Admins can do everything
CREATE POLICY "Admins can manage all webinar content" ON public.webinar_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Authenticated users can view active public content
CREATE POLICY "Users can view active public content" ON public.webinar_content
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND is_public = true
  );

-- Users can view content for webinars they have access to (purchased or granted)
CREATE POLICY "Users can view content for purchased webinars" ON public.webinar_content
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      -- Check direct purchase
      EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.order_items oi ON oi.order_id = o.id
        JOIN public.order_payments op ON op.order_id = o.id
        WHERE o.user_id = auth.uid()
        AND oi.item_type = 'webinar'
        AND oi.event_id = webinar_content.webinar_id
        AND op.payment_status = 'verified'
      )
      OR
      -- Check symposium bonus grant
      EXISTS (
        SELECT 1 FROM public.symposium_webinar_grants swg
        WHERE swg.user_id = auth.uid()
        AND swg.webinar_id = webinar_content.webinar_id
        AND swg.status = 'active'
      )
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access content" ON public.webinar_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for webinar_content_history
-- Only admins can view history
CREATE POLICY "Admins can view all history" ON public.webinar_content_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role has full access to history
CREATE POLICY "Service role full access history" ON public.webinar_content_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_webinar_content_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS update_webinar_content_timestamp ON public.webinar_content;
CREATE TRIGGER update_webinar_content_timestamp
  BEFORE UPDATE ON public.webinar_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_webinar_content_timestamp();

-- Grant permissions
GRANT ALL ON public.webinar_content TO service_role;
GRANT ALL ON public.webinar_content_history TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.webinar_content TO authenticated;
GRANT SELECT ON public.webinar_content_history TO authenticated;
